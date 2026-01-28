#!/usr/bin/env node

const AIAdapter = require('./ai-adapter');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Continue AI Adapter
 * 
 * VS Code extension with programmatic API
 * Used via file-based communication when CLI API is not available
 * 
 * Note: Continue is primarily UI-based. This adapter creates marker files
 * that the Continue extension can watch and process.
 */
class ContinueAdapter extends AIAdapter {
  constructor(config) {
    super(config);
    this.continueDir = config.continueDir || path.join(process.env.HOME, '.continue');
  }

  async process(task) {
    try {
      const { prompt, workingDirectory, taskId, contextFiles = [] } = task;

      logger.info(`[Continue] Task-${taskId} queued for Continue extension`);
      logger.warn(`[Continue] This adapter requires manual processing via VS Code Continue extension`);

      // Create a task file for Continue to pick up
      const taskFile = path.join(workingDirectory, `.continue-task-${taskId}.json`);
      
      await fs.writeFile(taskFile, JSON.stringify({
        prompt,
        taskId,
        model: this.model,
        contextFiles,
        timestamp: new Date().toISOString()
      }, null, 2));

      logger.info(`[Continue] Task file created: ${taskFile}`);
      logger.info(`[Continue] Open this file in VS Code and use Continue chat to process it`);

      return {
        success: true,
        message: 'Task queued for Continue extension',
        taskFile,
        adapter: 'continue',
        model: this.model,
        taskId,
        requiresManualAction: true
      };

    } catch (error) {
      logger.error(`[Continue] Exception: ${error.message}`);
      return {
        success: false,
        error: error.message,
        adapter: 'continue',
        taskId: task.taskId
      };
    }
  }

  async healthCheck() {
    try {
      // Check if Continue config directory exists
      const configPath = path.join(this.continueDir, 'config.json');
      await fs.access(configPath);

      return {
        healthy: true,
        adapter: 'continue',
        message: 'Continue config found'
      };
    } catch (error) {
      return {
        healthy: false,
        adapter: 'continue',
        error: 'Continue extension not configured or not installed'
      };
    }
  }
}

module.exports = ContinueAdapter;
