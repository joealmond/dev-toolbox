/**
 * Unified logging utility for all scripts
 * Provides consistent formatting, levels, colors, and structured output
 */

const chalk = require('chalk');
const config = require('../config.json');

// Log levels
const LEVELS = {
  DEBUG: { level: 0, label: 'DEBUG', color: chalk.gray },
  INFO: { level: 1, label: 'INFO', color: chalk.blue },
  SUCCESS: { level: 2, label: 'SUCCESS', color: chalk.green },
  WARN: { level: 3, label: 'WARN', color: chalk.yellow },
  ERROR: { level: 4, label: 'ERROR', color: chalk.red }
};

// Get current log level from config
const currentLevel = LEVELS[config.logging?.level || 'INFO'];

/**
 * Format a log message with timestamp, level, and optional metadata
 * @param {string} level - Log level (DEBUG, INFO, SUCCESS, WARN, ERROR)
 * @param {string} message - Main message
 * @param {object} meta - Optional metadata to include
 * @returns {string} Formatted log line
 */
function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const levelObj = LEVELS[level];
  
  if (!levelObj) {
    throw new Error(`Invalid log level: ${level}`);
  }

  let output = `[${timestamp}] ${levelObj.color(levelObj.label)} ${message}`;

  // Add metadata if provided and not empty
  if (Object.keys(meta).length > 0) {
    if (config.logging?.format === 'json') {
      output = JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    } else {
      // Pretty print metadata
      const metaStr = Object.entries(meta)
        .map(([k, v]) => `${chalk.gray(k)}=${JSON.stringify(v)}`)
        .join(', ');
      output += ` ${chalk.gray(`(${metaStr}`)}${chalk.gray(')')}`;
    }
  }

  return output;
}

/**
 * Log at specified level
 * @param {string} level - Log level
 * @param {string} message - Main message
 * @param {object} meta - Optional metadata
 */
function log(level, message, meta = {}) {
  const levelObj = LEVELS[level];

  if (!levelObj) {
    console.error(`Invalid log level: ${level}`);
    return;
  }

  // Only log if at or above current level
  if (levelObj.level < currentLevel.level) {
    return;
  }

  const formatted = formatMessage(level, message, meta);
  
  if (levelObj.level >= LEVELS.ERROR.level) {
    console.error(formatted);
  } else {
    console.log(formatted);
  }
}

/**
 * Convenience methods for each level
 */
const logger = {
  debug: (msg, meta) => log('DEBUG', msg, meta),
  info: (msg, meta) => log('INFO', msg, meta),
  success: (msg, meta) => log('SUCCESS', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  error: (msg, meta) => log('ERROR', msg, meta),

  /**
   * Log task-related events with standard metadata
   */
  task: {
    start: (taskId, msg, meta = {}) => 
      log('INFO', `Task ${taskId}: ${msg}`, { taskId, ...meta }),
    success: (taskId, msg, meta = {}) => 
      log('SUCCESS', `Task ${taskId}: ${msg}`, { taskId, ...meta }),
    error: (taskId, msg, meta = {}) => 
      log('ERROR', `Task ${taskId}: ${msg}`, { taskId, ...meta }),
    warning: (taskId, msg, meta = {}) => 
      log('WARN', `Task ${taskId}: ${msg}`, { taskId, ...meta })
  },

  /**
   * Log git-related events
   */
  git: {
    start: (repo, msg, meta = {}) => 
      log('INFO', `[Git ${repo}] ${msg}`, { repo, ...meta }),
    success: (repo, msg, meta = {}) => 
      log('SUCCESS', `[Git ${repo}] ${msg}`, { repo, ...meta }),
    error: (repo, msg, meta = {}) => 
      log('ERROR', `[Git ${repo}] ${msg}`, { repo, ...meta })
  },

  /**
   * Log approval-related events
   */
  approval: {
    start: (taskId, msg, meta = {}) => 
      log('INFO', `[Approval ${taskId}] ${msg}`, { taskId, ...meta }),
    approved: (taskId, msg, meta = {}) => 
      log('SUCCESS', `[Approval ${taskId}] ${msg}`, { taskId, ...meta }),
    rejected: (taskId, msg, meta = {}) => 
      log('ERROR', `[Approval ${taskId}] ${msg}`, { taskId, ...meta })
  }
};

module.exports = logger;
module.exports.LEVELS = LEVELS;
module.exports.formatMessage = formatMessage;
