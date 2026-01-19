#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const specParser = require('./spec-parser');

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
              console.log(`[INFO] Semantic context found: ${searchResults.length} items`);
            }
          } catch (error) {
            console.warn(`[WARN] Semantic search skipped: ${error.message}`);
          }
        }

        // Construct the prompt for kodu
        const prompt = buildPrompt(frontMatter, body, searchResults);
        
        console.log(`[INFO] Processing task-${taskId} with model: ${model}`);
        console.log(`[INFO] Prompt length: ${prompt.length} characters`);
        
        // Spawn kodu process
        const koduArgs = [
          'kodu',
          '--message', prompt,
          '--auto-approve',
          '--model', model
        ];
        
        console.log(`[INFO] Executing: npx ${koduArgs.join(' ')}`);
        
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
            console.log(`[SUCCESS] Task-${taskId} processed successfully`);
            resolve({
              success: true,
              exitCode: code,
              stdout,
              stderr,
              model,
              taskId
            });
          } else {
            console.error(`[ERROR] Task-${taskId} failed with exit code ${code}`);
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
          console.error(`[ERROR] Failed to spawn kodu process:`, error.message);
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
          console.error(`[ERROR] Task-${taskId} timed out after ${config.ollama.timeout}ms`);
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
        console.error(`[ERROR] Exception in processTicket:`, error.message);
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

/**
 * Build a comprehensive prompt for kodu from the task details
 * @param {object} frontMatter - Task metadata
 * @param {string} body - Task body content
 * @returns {string} - Formatted prompt
 */
function buildPrompt(frontMatter, body, searchResults = []) {
  // Check if spec mode is enabled
  const isSpec = frontMatter.spec && frontMatter.spec.enabled === true;
  let prompt = '';

  if (isSpec) {
    // SPEC-DRIVEN MODE: Enhanced prompt with requirements and architecture
    prompt = `# Spec: ${frontMatter.title || 'Task'}\n\n`;

    if (frontMatter.spec.requirements && Array.isArray(frontMatter.spec.requirements)) {
      prompt += `## Requirements\n`;
      frontMatter.spec.requirements.forEach((req, index) => {
        prompt += `${index + 1}. ${req}\n`;
      });
      prompt += '\n';
    }

    if (frontMatter.spec.architecture) {
      const arch = frontMatter.spec.architecture;
      if (arch.components || arch.integrations || arch.decisions) {
        prompt += `## Architecture Context\n`;

        if (arch.components && Array.isArray(arch.components) && arch.components.length > 0) {
          prompt += `### Components\n`;
          arch.components.forEach((comp) => {
            prompt += `- ${comp}\n`;
          });
          prompt += '\n';
        }

        if (arch.integrations && Array.isArray(arch.integrations) && arch.integrations.length > 0) {
          prompt += `### Integrations\n`;
          arch.integrations.forEach((int) => {
            prompt += `- ${int}\n`;
          });
          prompt += '\n';
        }

        if (arch.decisions) {
          prompt += `### Key Decisions\n${arch.decisions}\n\n`;
        }
      }
    }

    if (frontMatter.acceptanceCriteria && Array.isArray(frontMatter.acceptanceCriteria)) {
      prompt += `## Acceptance Criteria\n`;
      frontMatter.acceptanceCriteria.forEach((criterion, index) => {
        prompt += `${index + 1}. ${criterion}\n`;
      });
      prompt += '\n';
    }
  } else {
    // STANDARD MODE: Original prompt format
    prompt = `# ${frontMatter.title || 'Task'}\n\n`;

    if (frontMatter.description) {
      prompt += `## Description\n${frontMatter.description}\n\n`;
    }

    if (frontMatter.acceptanceCriteria && Array.isArray(frontMatter.acceptanceCriteria)) {
      prompt += `## Acceptance Criteria\n`;
      frontMatter.acceptanceCriteria.forEach((criterion, index) => {
        prompt += `${index + 1}. ${criterion}\n`;
      });
      prompt += '\n';
    }

    if (frontMatter.dependencies && Array.isArray(frontMatter.dependencies) && frontMatter.dependencies.length > 0) {
      prompt += `## Dependencies\n`;
      prompt += `This task depends on: ${frontMatter.dependencies.join(', ')}\n\n`;
    }

    if (frontMatter.labels && Array.isArray(frontMatter.labels)) {
      prompt += `## Labels\n${frontMatter.labels.join(', ')}\n\n`;
    }

    if (frontMatter.priority) {
      prompt += `## Priority\n${frontMatter.priority}\n\n`;
    }

    if (frontMatter.estimatedHours) {
      prompt += `## Estimated Time\n${frontMatter.estimatedHours} hours\n\n`;
    }
  }

  // Add semantic search context if available
  if (searchResults && searchResults.length > 0) {
    prompt += `## Related Context (from repository search)\n`;
    searchResults.slice(0, 5).forEach((result, index) => {
      const score = typeof result.score === 'number' ? result.score.toFixed(2) : 'n/a';
      prompt += `${index + 1}. ${result.path} (score: ${score})\n`;
      if (result.snippet) {
        prompt += `   Snippet: ${result.snippet}\n`;
      }
      prompt += '\n';
    });
  }

  // Add body content if present (valid for both modes)
  if (body && body.trim()) {
    prompt += isSpec ? `## Implementation Notes\n${body}\n\n` : `## Additional Details\n${body}\n\n`;
  }

  // Add instructions
  prompt += `## Instructions\n`;
  if (isSpec) {
    prompt += `Implement this specification according to the requirements and architecture above. `;
    prompt += `Ensure all acceptance criteria are met. `;
    prompt += `Follow the architecture decisions and use the specified components/integrations. `;
  } else {
    prompt += `Please implement this task according to the description and acceptance criteria above. `;
    prompt += `Make sure all acceptance criteria are met. `;
  }
  prompt += `Write clean, well-documented, and tested code. Follow best practices and coding standards.\n`;

  return prompt;
}

module.exports = processTicket;
