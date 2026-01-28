#!/usr/bin/env node

const { spawn } = require('child_process');
const AIAdapter = require('./ai-adapter');
const logger = require('../utils/logger');

/**
 * Aider AI Adapter
 * 
 * Terminal-based AI coding assistant with excellent git integration
 * Works great with Ollama and provides autonomous coding capabilities
 */
class AiderAdapter extends AIAdapter {
  constructor(config) {
    super(config);
    this.autoApprove = config.autoApprove !== false;
  }

  async process(task) {
    return new Promise((resolve) => {
      try {
        const { prompt, workingDirectory, taskId, contextFiles = [] } = task;

        // Build Aider command
        const args = [
          '--model', `ollama/${this.model}`,
          '--no-git', // We handle git separately
          '--yes', // Auto-approve changes (if enabled)
          '--message', prompt
        ];

        // Add context files
        if (contextFiles.length > 0) {
          args.push(...contextFiles);
        }

        logger.info(`[Aider] Processing task-${taskId} with model: ${this.model}`);
        logger.info(`[Aider] Command: aider ${args.join(' ')}`);

        const aiderProcess = spawn('aider', args, {
          cwd: workingDirectory,
          env: {
            ...process.env,
            OLLAMA_API_BASE: this.ollamaHost
          }
        });

        let stdout = '';
        let stderr = '';

        aiderProcess.stdout.on('data', (data) => {
          const chunk = data.toString();
          stdout += chunk;
          this.onOutput(chunk);
        });

        aiderProcess.stderr.on('data', (data) => {
          const chunk = data.toString();
          stderr += chunk;
          this.onError(chunk);
        });

        aiderProcess.on('close', (code) => {
          if (code === 0) {
            logger.success(`[Aider] Task-${taskId} completed successfully`);
            resolve({
              success: true,
              exitCode: code,
              stdout,
              stderr,
              adapter: 'aider',
              model: this.model,
              taskId
            });
          } else {
            logger.error(`[Aider] Task-${taskId} failed with exit code ${code}`);
            resolve({
              success: false,
              exitCode: code,
              stdout,
              stderr,
              error: `Aider exited with code ${code}`,
              adapter: 'aider',
              model: this.model,
              taskId
            });
          }
        });

        aiderProcess.on('error', (error) => {
          logger.error(`[Aider] Failed to spawn: ${error.message}`);
          resolve({
            success: false,
            error: error.message,
            stderr: error.stack,
            adapter: 'aider',
            model: this.model,
            taskId
          });
        });

        // Set timeout
        const timeout = setTimeout(() => {
          logger.error(`[Aider] Task-${taskId} timed out after ${this.timeout}ms`);
          aiderProcess.kill('SIGTERM');

          resolve({
            success: false,
            error: `Process timed out after ${this.timeout}ms`,
            stderr: 'Process killed due to timeout',
            adapter: 'aider',
            model: this.model,
            taskId
          });
        }, this.timeout);

        aiderProcess.on('close', () => {
          clearTimeout(timeout);
        });

      } catch (error) {
        logger.error(`[Aider] Exception: ${error.message}`);
        resolve({
          success: false,
          error: error.message,
          stderr: error.stack,
          adapter: 'aider',
          taskId: task.taskId
        });
      }
    });
  }

  async healthCheck() {
    return new Promise((resolve) => {
      const aider = spawn('aider', ['--version']);
      
      let output = '';
      aider.stdout.on('data', (data) => output += data.toString());
      aider.stderr.on('data', (data) => output += data.toString());
      
      aider.on('close', (code) => {
        if (code === 0) {
          resolve({
            healthy: true,
            adapter: 'aider',
            version: output.trim()
          });
        } else {
          resolve({
            healthy: false,
            adapter: 'aider',
            error: 'aider command not found or failed'
          });
        }
      });

      aider.on('error', (error) => {
        resolve({
          healthy: false,
          adapter: 'aider',
          error: error.message
        });
      });
    });
  }
}

module.exports = AiderAdapter;
