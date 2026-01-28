/**
 * AI Adapters Module
 * 
 * Provides abstraction layer for different AI coding tools.
 * Currently supports:
 * - Aider (terminal-based, autonomous)
 * - Continue (VS Code extension, interactive)
 */

const AIAdapter = require('./ai-adapter');
const AiderAdapter = require('./aider-adapter');
const ContinueAdapter = require('./continue-adapter');
const AdapterFactory = require('./adapter-factory');

module.exports = {
  AIAdapter,
  AiderAdapter,
  ContinueAdapter,
  AdapterFactory
};
