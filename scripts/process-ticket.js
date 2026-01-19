#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const specParser = require('./spec-parser');
const { buildPrompt } = require('./utils/prompt-builder');
const logger = require('./utils/logger');

// Load configuration
const config = require('../config.json');
const semanticIndexer = require('./semantic-indexer');

/**
 * Process a ticket using Kilo Code CLI
 * @param {string} filePath - Path to the ticket markdown file
 * @param {object} frontMatter - Parsed front matter from the ticket
 * @param {string} body - Body content of the ticket
 * @param {string} taskId - Extracted task ID
 * @returns {Promise<object>} - Processing result with success status
 */
async function processTicket(filePath, frontMatter, body, taskId) {
  return new Promise((resolve) => {
    (async () => {
      try {
        // Determine which model to use (per-task or default)
        const model = frontMatter.model || config.ollama.defaultModel;

        // Best-effort semantic search for additional context
        let searchResults = [];
        if (config.search && config.search.enabled !== false) {
          try {
            searchResults = await semanticIndexer.searchForTask(frontMatter, body, { limit: 5 });
            if (searchResults.length) {
              logger.info(`Semantic context found: ${searchResults.length} items`);
            }
          } catch (error) {
            logger.warn(`Semantic search skipped: ${error.message}`);
          }
        }

        // Construct the prompt for kodu
        const prompt = buildPrompt(frontMatter, body, searchResults);
        
        logger.info(`Processing task-${taskId} with model: ${model}`);
        logger.info(`Prompt length: ${prompt.length} characters`);
        
        // Spawn kodu process
        const koduArgs = [
          'kodu',
          '--message', prompt,
          '--auto-approve',
          '--model', model
        ];
        
        logger.info(`Executing: npx ${koduArgs.join(' ')}`);
        
        const koduProcess = spawn('npx', koduArgs, {
          cwd: path.dirname(filePath),
          env: {
            ...process.env,
            OLLAMA_API_BASE: process.env.OLLAMA_HOST || 'http://host.containers.internal:11434'
          }
        });
        
        let stdout = '';
        let stderr = '';
        
        koduProcess.stdout.on('data', (data) => {
          const chunk = data.toString();
          stdout += chunk;
          // Stream output in real-time
          process.stdout.write(chunk);
        });
        
        koduProcess.stderr.on('data', (data) => {
          const chunk = data.toString();
          stderr += chunk;
          process.stderr.write(chunk);
        });
        
        koduProcess.on('close', (code) => {
          if (code === 0) {
            logger.success(`Task-${taskId} processed successfully`);
            resolve({
              success: true,
              exitCode: code,
              stdout,
              stderr,
              model,
              taskId
            });
          } else {
            logger.error(`Task-${taskId} failed with exit code ${code}`);
            resolve({
              success: false,
              exitCode: code,
              stdout,
              stderr,
              error: `Kodu exited with code ${code}`,
              model,
              taskId
            });
          }
        });
        
        koduProcess.on('error', (error) => {
          logger.error(`Failed to spawn kodu process: ${error.message}`);
          resolve({
            success: false,
            error: error.message,
            stderr: error.stack,
            model,
            taskId
          });
        });
        
        // Set timeout for long-running processes
        const timeout = setTimeout(() => {
          logger.error(`Task-${taskId} timed out after ${config.ollama.timeout}ms`);
          koduProcess.kill('SIGTERM');
          
          resolve({
            success: false,
            error: `Process timed out after ${config.ollama.timeout}ms`,
            stderr: 'Process killed due to timeout',
            model,
            taskId
          });
        }, config.ollama.timeout);
        
        koduProcess.on('close', () => {
          clearTimeout(timeout);
        });
        
      } catch (error) {
        logger.error(`Exception in processTicket: ${error.message}`);
        resolve({
          success: false,
          error: error.message,
          stderr: error.stack,
          taskId
        });
      }
    })();
  });
}

module.exports = processTicket;
