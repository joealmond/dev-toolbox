#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const chalk = require('chalk');

// Load configuration
const config = require('../config.json');

/**
 * Generate work log from task completion
 * @param {object} task - Task spec object
 * @param {object} result - Kodu processing result
 * @returns {Promise<string>} - Generated work log path
 */
async function generateWorklog(task, result) {
  try {
    const template = await fs.readFile(config.documentation.templates.worklog, 'utf-8');
    const compiled = Handlebars.compile(template);

    // Extract modified/created files from kodu output
    const filesModified = extractFilesFromOutput(result.stdout, 'modified');
    const filesCreated = extractFilesFromOutput(result.stdout, 'created');

    const worklogContent = compiled({
      taskId: task.id,
      title: task.title,
      timestamp: new Date().toISOString(),
      model: result.model,
      description: task.description,
      implementationSummary: result.stdout.split('\n').slice(0, 20).join('\n'),
      filesModified,
      filesCreated,
      acceptanceCriteria: task.acceptanceCriteria || [],
      technicalDecisions: task.spec?.architecture?.decisions || 'No decisions recorded',
      testingNotes: 'See git diff and PR for implementation details'
    });

    const worklogPath = path.join(
      config.folders.worklogs,
      `${task.id}-worklog.md`
    );

    await fs.mkdir(config.folders.worklogs, { recursive: true });
    await fs.writeFile(worklogPath, worklogContent);

    console.log(chalk.green(`✓ Work log generated: ${worklogPath}`));
    return worklogPath;
  } catch (error) {
    throw new Error(`Failed to generate work log: ${error.message}`);
  }
}

/**
 * Generate Architecture Decision Record
 * @param {object} task - Task spec object
 * @param {string} title - ADR title
 * @param {string} context - Context/problem statement
 * @param {string} decision - The decision made
 * @param {object} options - Optional fields
 * @returns {Promise<string>} - Generated ADR path
 */
async function generateAdr(task, title, context, decision, options = {}) {
  try {
    const template = await fs.readFile(config.documentation.templates.adr, 'utf-8');
    const compiled = Handlebars.compile(template);

    // Get next ADR number
    const adrNumber = await getNextAdrNumber();

    const adrContent = compiled({
      number: adrNumber,
      title,
      date: new Date().toISOString().split('T')[0],
      taskId: task.id,
      context,
      decision,
      rationale: options.rationale || 'See context and decision above',
      positiveConsequences: options.positiveConsequences || [],
      negativeConsequences: options.negativeConsequences || [],
      neutralConsequences: options.neutralConsequences || [],
      alternatives: options.alternatives || [],
      notes: options.notes || ''
    });

    const adrPath = path.join(
      config.folders.adr,
      `${adrNumber.toString().padStart(3, '0')}-${title.toLowerCase().replace(/\s+/g, '-')}.md`
    );

    await fs.mkdir(config.folders.adr, { recursive: true });
    await fs.writeFile(adrPath, adrContent);

    console.log(chalk.green(`✓ ADR generated: ${adrPath}`));
    return adrPath;
  } catch (error) {
    throw new Error(`Failed to generate ADR: ${error.message}`);
  }
}

/**
 * Get next ADR number
 * @returns {Promise<number>} - Next ADR number
 */
async function getNextAdrNumber() {
  try {
    const files = await fs.readdir(config.folders.adr).catch(() => []);
    const numbers = files
      .map(f => parseInt(f.split('-')[0]))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a);

    return (numbers[0] || 0) + 1;
  } catch {
    return 1;
  }
}

/**
 * Append entry to CHANGELOG.md
 * @param {object} task - Task spec object
 * @param {string} type - Change type (feat, fix, docs, chore, etc)
 * @param {string} description - Change description
 * @returns {Promise<string>} - Updated changelog path
 */
async function appendChangelog(task, type = 'feat', description = null) {
  try {
    const changelogPath = config.folders.changelog;
    let content = '';

    try {
      content = await fs.readFile(changelogPath, 'utf-8');
    } catch {
      // File doesn't exist, read template
      content = await fs.readFile(config.documentation.templates.changelog, 'utf-8');
    }

    const entryDescription = description || task.description;
    const changelogEntry = `
### ${type}: ${task.title}

${entryDescription}

**Task:** [${task.id}](backlog/${task.id})  
**Processed by:** ${task.model}  
`;

    // Insert after "## [Unreleased]" section
    const unreleaseMarker = '## [Unreleased]\n\n';
    const subMarker = '### Added\n';

    if (content.includes(unreleaseMarker)) {
      const insertPos = content.indexOf(unreleaseMarker) + unreleaseMarker.length;
      content = content.slice(0, insertPos) + `#### ${new Date().toISOString().split('T')[0]}\n` + changelogEntry + '\n' + content.slice(insertPos);
    } else {
      content = unreleaseMarker + `#### ${new Date().toISOString().split('T')[0]}\n` + changelogEntry + '\n' + content;
    }

    await fs.mkdir(path.dirname(changelogPath), { recursive: true });
    await fs.writeFile(changelogPath, content);

    console.log(chalk.green(`✓ Changelog updated: ${changelogPath}`));
    return changelogPath;
  } catch (error) {
    throw new Error(`Failed to update changelog: ${error.message}`);
  }
}

/**
 * Generate all documentation for a completed task
 * @param {object} task - Task spec object
 * @param {object} result - Kodu processing result
 * @returns {Promise<object>} - Generated documentation paths
 */
async function generateAll(task, result) {
  const docs = {};

  try {
    // Generate worklog
    if (task.approval?.docs?.generate?.worklog) {
      docs.worklogPath = await generateWorklog(task, result);
    }

    // Generate ADR if enabled
    if (task.approval?.docs?.generate?.adr && task.spec?.architecture?.decisions) {
      docs.adrPath = await generateAdr(
        task,
        `${task.title} - Architecture Decisions`,
        task.spec.architecture.components?.join(', ') || 'Implementation decision',
        task.spec.architecture.decisions
      );
    }

    // Append changelog
    if (task.approval?.docs?.generate?.changelog) {
      docs.changelogPath = await appendChangelog(task);
    }

    console.log(chalk.green(`✓ All documentation generated for ${task.id}`));
    return docs;
  } catch (error) {
    console.error(chalk.red(`Error generating docs: ${error.message}`));
    throw error;
  }
}

/**
 * Extract file paths from kodu output
 * @param {string} output - Kodu stdout
 * @param {string} type - 'modified' or 'created'
 * @returns {string[]} - File paths
 */
function extractFilesFromOutput(output, type) {
  const files = [];
  const typeKeywords = {
    modified: /modified:|updated:|changed:/i,
    created: /created:|new file:|added:/i
  };

  const keyword = typeKeywords[type];
  const lines = output.split('\n');

  lines.forEach(line => {
    if (keyword.test(line)) {
      const match = line.match(/(?:modified|updated|changed|created|new file|added)[:\s]+(.+?)(?:\s|$)/i);
      if (match && match[1]) {
        files.push(match[1].trim());
      }
    }
  });

  return files;
}

/**
 * CLI interface
 */
async function main() {
  const command = process.argv[2];

  if (!command) {
    console.log(`
${chalk.bold('Doc Generator CLI')}

Usage:
  node scripts/doc-generator.js <command> [options]

Commands:
  worklog <task-id>       Generate work log from task
  adr <task-id> <title>   Generate ADR for task
  changelog <task-id>     Add changelog entry for task
  all <task-id>          Generate all documentation
    `);
    process.exit(0);
  }

  try {
    const taskId = process.argv[3];
    if (!taskId) {
      console.error(chalk.red('Task ID required'));
      process.exit(1);
    }

    switch (command) {
      case 'worklog': {
        // Mock task for demo
        const task = { id: taskId, title: 'Demo Task', description: 'Demo', model: 'demo' };
        const result = { stdout: 'Demo output', model: 'demo' };
        const path = await generateWorklog(task, result);
        console.log(chalk.cyan(`Path: ${path}`));
        break;
      }

      case 'adr': {
        const title = process.argv[4] || 'Architecture Decision';
        const task = { id: taskId };
        const adrPath = await generateAdr(task, title, 'Context', 'Decision made');
        console.log(chalk.cyan(`Path: ${adrPath}`));
        break;
      }

      case 'changelog': {
        const task = { id: taskId, title: 'Demo Task', description: 'Demo', model: 'demo' };
        const path = await appendChangelog(task);
        console.log(chalk.cyan(`Path: ${path}`));
        break;
      }

      case 'all': {
        const task = {
          id: taskId,
          title: 'Demo Task',
          description: 'Demo',
          model: 'demo',
          approval: { docs: { generate: { worklog: true, adr: false, changelog: true } } },
          spec: { architecture: { decisions: 'Demo decisions' } }
        };
        const result = { stdout: 'Demo output', model: 'demo' };
        const docs = await generateAll(task, result);
        console.log(chalk.green('Generated docs:'));
        console.log(JSON.stringify(docs, null, 2));
        break;
      }

      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Exports for use as module
module.exports = {
  generateWorklog,
  generateAdr,
  appendChangelog,
  generateAll,
  getNextAdrNumber
};

// Run CLI if called directly
if (require.main === module) {
  main();
}
