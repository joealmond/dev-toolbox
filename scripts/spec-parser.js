#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');

/**
 * Parse a spec/task file and extract structured spec object
 * @param {string} filePath - Path to the spec/task file
 * @returns {Promise<object>} - Parsed spec object
 */
async function parseSpec(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontMatter, content: body } = matter(content);

    return {
      filePath,
      filename: path.basename(filePath),
      frontMatter,
      body,
      isSpec: isSpecEnabled(frontMatter),
      id: frontMatter.id,
      title: frontMatter.title,
      description: frontMatter.description,
      spec: frontMatter.spec || {},
      approval: frontMatter.approval || {},
      documentation: frontMatter.documentation || {},
      acceptanceCriteria: frontMatter.acceptanceCriteria || [],
      model: frontMatter.model || 'ollama/deepseek-coder'
    };
  } catch (error) {
    throw new Error(`Failed to parse spec at ${filePath}: ${error.message}`);
  }
}

/**
 * Validate spec/task structure
 * @param {object} spec - Parsed spec object
 * @returns {object} - Validation result {valid: boolean, errors: string[]}
 */
function validateSpec(spec) {
  const errors = [];

  // Required fields
  if (!spec.id) errors.push('Missing required field: id');
  if (!spec.title) errors.push('Missing required field: title');
  if (!spec.description) errors.push('Missing required field: description');

  // Spec-specific validation
  if (spec.isSpec) {
    if (!spec.spec.type) {
      errors.push('Spec enabled but missing spec.type');
    } else if (!['feature', 'bugfix', 'refactor', 'docs', 'infra', 'test'].includes(spec.spec.type)) {
      errors.push(`Invalid spec.type: ${spec.spec.type}`);
    }

    if (!spec.spec.requirements || spec.spec.requirements.length === 0) {
      errors.push('Spec enabled but missing spec.requirements');
    }
  }

  // Acceptance criteria
  if (!spec.acceptanceCriteria || spec.acceptanceCriteria.length === 0) {
    errors.push('Missing acceptanceCriteria');
  }

  // Approval configuration
  if (spec.approval.code && spec.approval.code.autoApprove === undefined) {
    // Set default
    spec.approval.code.autoApprove = false;
  }
  if (spec.approval.docs && spec.approval.docs.autoApprove === undefined) {
    spec.approval.docs.autoApprove = false;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract requirements as formatted text
 * @param {object} spec - Parsed spec object
 * @returns {string} - Formatted requirements
 */
function extractRequirements(spec) {
  if (!spec.spec || !spec.spec.requirements) {
    return '';
  }

  return spec.spec.requirements
    .map((req, i) => `${i + 1}. ${req}`)
    .join('\n');
}

/**
 * Check if spec mode is enabled
 * @param {object} frontMatter - Front matter object
 * @returns {boolean} - True if spec is enabled
 */
function isSpecEnabled(frontMatter) {
  return frontMatter.spec && frontMatter.spec.enabled === true;
}

/**
 * Build enhanced prompt for kodu processing
 * @param {object} spec - Parsed spec object
 * @returns {string} - Enhanced prompt for kodu
 */
function buildPrompt(spec) {
  let prompt = spec.body;

  // If spec mode, inject requirements
  if (spec.isSpec && spec.spec.requirements) {
    const requirementsText = extractRequirements(spec);
    prompt = `## Requirements\n${requirementsText}\n\n## Task\n${prompt}`;
  }

  // If architecture context, inject it
  if (spec.spec.architecture && Object.keys(spec.spec.architecture).length > 0) {
    const archContext = [];
    if (spec.spec.architecture.components && spec.spec.architecture.components.length > 0) {
      archContext.push(`Components:\n${spec.spec.architecture.components.map(c => `- ${c}`).join('\n')}`);
    }
    if (spec.spec.architecture.integrations && spec.spec.architecture.integrations.length > 0) {
      archContext.push(`Integrations:\n${spec.spec.architecture.integrations.map(i => `- ${i}`).join('\n')}`);
    }
    if (spec.spec.architecture.decisions) {
      archContext.push(`Key Decisions:\n${spec.spec.architecture.decisions}`);
    }

    if (archContext.length > 0) {
      prompt += `\n\n## Architecture Context\n${archContext.join('\n\n')}`;
    }
  }

  // Add acceptance criteria
  if (spec.acceptanceCriteria && spec.acceptanceCriteria.length > 0) {
    const criteria = spec.acceptanceCriteria
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n');
    prompt += `\n\n## Acceptance Criteria\n${criteria}`;
  }

  return prompt;
}

/**
 * CLI interface
 */
async function main() {
  const command = process.argv[2];
  const filePath = process.argv[3];

  if (!command || !filePath) {
    console.log(`
${chalk.bold('Spec Parser CLI')}

Usage:
  node scripts/spec-parser.js <command> <file>

Commands:
  validate                  Validate spec file
  show-requirements         Show parsed requirements
  show-prompt              Show generated prompt
  parse                    Show full parsed spec
    `);
    process.exit(0);
  }

  try {
    const spec = await parseSpec(filePath);

    switch (command) {
      case 'validate': {
        const validation = validateSpec(spec);
        if (validation.valid) {
          console.log(chalk.green('✓ Spec is valid'));
          console.log(`  Type: ${spec.isSpec ? `${spec.spec.type} (spec-driven)` : 'standard task'}`);
          console.log(`  Title: ${spec.title}`);
          console.log(`  Requirements: ${spec.spec.requirements?.length || 0}`);
          console.log(`  Criteria: ${spec.acceptanceCriteria?.length || 0}`);
        } else {
          console.log(chalk.red('✗ Spec validation failed:'));
          validation.errors.forEach(e => console.log(`  - ${e}`));
          process.exit(1);
        }
        break;
      }

      case 'show-requirements': {
        if (!spec.isSpec) {
          console.log(chalk.yellow('⚠ Not a spec-driven task'));
          process.exit(1);
        }
        const reqs = extractRequirements(spec);
        console.log(chalk.bold('Requirements:'));
        console.log(reqs);
        break;
      }

      case 'show-prompt': {
        const prompt = buildPrompt(spec);
        console.log(chalk.bold('Generated Prompt:'));
        console.log('---');
        console.log(prompt);
        console.log('---');
        break;
      }

      case 'parse': {
        console.log(chalk.bold('Parsed Spec Object:'));
        console.log(JSON.stringify(spec, null, 2));
        break;
      }

      default:
        console.log(chalk.red(`Unknown command: ${command}`));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Exports for use as module
module.exports = {
  parseSpec,
  validateSpec,
  extractRequirements,
  isSpecEnabled,
  buildPrompt
};

// Run CLI if called directly
if (require.main === module) {
  main();
}
