#!/usr/bin/env node

const AiderAdapter = require('./aider-adapter');
const ContinueAdapter = require('./continue-adapter');

/**
 * AI Adapter Factory
 * 
 * Creates the appropriate AI adapter based on configuration
 */
class AdapterFactory {
  /**
   * Create an AI adapter
   * @param {Object} config - Configuration
   * @param {string} config.adapter - Adapter name ('aider', 'continue')
   * @param {string} config.model - Model to use
   * @param {string} config.ollamaHost - Ollama endpoint
   * @param {number} config.timeout - Timeout in ms
   * @returns {AIAdapter} Configured adapter instance
   */
  static create(config) {
    const adapterName = (config.adapter || 'aider').toLowerCase();

    switch (adapterName) {
      case 'aider':
        return new AiderAdapter(config);
      
      case 'continue':
        return new ContinueAdapter(config);
      
      default:
        throw new Error(`Unknown adapter: ${adapterName}. Available: aider, continue`);
    }
  }

  /**
   * Get list of available adapters
   * @returns {Array<string>} Adapter names
   */
  static getAvailableAdapters() {
    return ['aider', 'continue'];
  }
}

module.exports = AdapterFactory;
