#!/usr/bin/env node

/**
 * AI Adapter Base Class
 * 
 * Abstract interface for AI coding assistants (Aider, Continue, etc.)
 * Allows swapping between different AI tools without changing core logic
 */

class AIAdapter {
  /**
   * Initialize the AI adapter
   * @param {Object} config - Configuration options
   * @param {string} config.model - Model identifier (e.g., "qwen2.5-coder:7b")
   * @param {string} config.ollamaHost - Ollama API endpoint
   * @param {number} config.timeout - Timeout in milliseconds
   */
  constructor(config) {
    this.model = config.model;
    this.ollamaHost = config.ollamaHost;
    this.timeout = config.timeout || 300000;
  }

  /**
   * Process a task with the AI assistant
   * @param {Object} task - Task details
   * @param {string} task.prompt - The prompt to process
   * @param {string} task.workingDirectory - Directory to work in
   * @param {string} task.taskId - Task identifier
   * @param {Array} task.contextFiles - Files to include as context
   * @returns {Promise<Object>} Result object with success, output, etc.
   */
  async process(task) {
    throw new Error('process() must be implemented by subclass');
  }

  /**
   * Check if the AI tool is available and working
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass');
  }

  /**
   * Get the name/identifier of this adapter
   * @returns {string} Adapter name
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Stream output handler (optional override)
   * @param {string} chunk - Output chunk
   */
  onOutput(chunk) {
    process.stdout.write(chunk);
  }

  /**
   * Error handler (optional override)
   * @param {string} chunk - Error chunk
   */
  onError(chunk) {
    process.stderr.write(chunk);
  }
}

module.exports = AIAdapter;
