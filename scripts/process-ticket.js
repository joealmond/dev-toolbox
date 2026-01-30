#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const specParser = require('./spec-parser');
const { buildPrompt } = require('./utils/prompt-builder');
const logger = require('./utils/logger');
const AdapterFactory = require('./adapters/adapter-factory');

// Load configuration
const config = require('../config.json');
const semanticIndexer = require('./semantic-indexer');

/**
 * Process a ticket using configured AI adapter (Aider, Continue, etc.)
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

        // Construct the prompt
        const prompt = buildPrompt(frontMatter, body, searchResults);
        
        logger.info(`Processing task-${taskId} with model: ${model}`);
        logger.info(`Prompt length: ${prompt.length} characters`);
        
        // Create AI adapter
        const adapter = AdapterFactory.create({
          adapter: config.ai?.adapter || 'aider',
          model,
          ollamaHost: process.env.OLLAMA_HOST || 'http://host.containers.internal:11434',
          timeout: config.ollama.timeout,
          autoApprove: config.ai?.autoApprove !== false
        });

        logger.info(`Using adapter: ${adapter.getName()}`);

        // Process the task
        const result = await adapter.process({
          prompt,
          workingDirectory: process.cwd(),
          taskId,
          contextFiles: searchResults.map(r => r.path).filter(Boolean)
        });

        resolve(result);

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
