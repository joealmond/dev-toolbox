#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const table = require('table').table;

// Load configuration
const config = require('../config.json');

/**
 * Add entry to CHANGELOG.md
 * @param {string} type - Change type (feat, fix, bugfix, docs, etc)
 * @param {string} taskId - Task ID
 * @param {string} title - Change title
 * @param {string} description - Detailed description
 * @param {object} options - Optional fields
 * @returns {Promise<void>}
 */
async function appendEntry(type, taskId, title, description, options = {}) {
  try {
    const changelogPath = config.folders.changelog;
    let content = '';

    try {
      content = await fs.readFile(changelogPath, 'utf-8');
    } catch {
      // Initialize from template
      content = await fs.readFile(config.documentation.templates.changelog, 'utf-8');
    }

    const date = new Date().toISOString().split('T')[0];
    const entry = `- **${title}** ([${taskId}](../../backlog/${taskId}.md)): ${description}${options.breakingChanges ? `\n  ⚠️ BREAKING: ${options.breakingChanges}` : ''}`;

    // Find and update version section
    const versionRegex = /## \[Unreleased\]/i;
    const categoryRegex = new RegExp(`### ${type}`, 'i');

    if (!versionRegex.test(content)) {
      // Create unreleased section
      content = `## [Unreleased]\n\n### ${type}\n${entry}\n\n${content}`;
    } else if (categoryRegex.test(content)) {
      // Update existing category
      const match = content.match(new RegExp(`(### ${type}\\n)([\\s\\S]*?)(###|##|$)`));
      if (match) {
        const before = content.substring(0, match.index + match[1].length);
        const after = match[3];
        const existing = match[2];
        content = before + `${entry}\n${existing}` + after;
      }
    } else {
      // Add new category after unreleased
      const unreleaseEnd = content.search(/\n\n###/);
      if (unreleaseEnd !== -1) {
        content = content.substring(0, unreleaseEnd) + `\n\n### ${type}\n${entry}` + content.substring(unreleaseEnd);
      }
    }

    await fs.mkdir(path.dirname(changelogPath), { recursive: true });
    await fs.writeFile(changelogPath, content);

    console.log(chalk.green(`✓ Changelog entry added: ${type} - ${title}`));
  } catch (error) {
    throw new Error(`Failed to add changelog entry: ${error.message}`);
  }
}

/**
 * Get recent changelog entries
 * @param {number} count - Number of entries to return
 * @returns {Promise<array>} - Recent entries
 */
async function getRecentEntries(count = 10) {
  try {
    const changelogPath = config.folders.changelog;
    const content = await fs.readFile(changelogPath, 'utf-8');

    const entries = [];
    const lines = content.split('\n');
    let currentType = '';

    for (const line of lines) {
      // Skip headers and empty lines
      if (line.match(/^##|^###/) || !line.trim()) continue;

      // Track current type
      if (line.startsWith('### ')) {
        currentType = line.replace(/^###\s+/, '').trim();
        continue;
      }

      // Parse entries
      if (line.startsWith('- ')) {
        const entry = line.replace(/^-\s+/, '').trim();
        entries.push({
          type: currentType,
          entry,
          date: lines[entries.length] || ''
        });

        if (entries.length >= count) break;
      }
    }

    return entries;
  } catch (error) {
    throw new Error(`Failed to get recent entries: ${error.message}`);
  }
}

/**
 * Generate release notes between dates
 * @param {string} fromDate - Start date (ISO)
 * @param {string} toDate - End date (ISO)
 * @returns {Promise<string>} - Formatted release notes
 */
async function generateReleaseNotes(fromDate, toDate) {
  try {
    const changelogPath = config.folders.changelog;
    const content = await fs.readFile(changelogPath, 'utf-8');

    // Simple approach: find entries in date range
    // In production, would parse timestamps from entries
    const entries = await getRecentEntries(50);

    const releaseNotes = `# Release Notes\n\n**From:** ${fromDate}  \n**To:** ${toDate}\n\n`;

    const grouped = {};
    for (const entry of entries) {
      if (!grouped[entry.type]) grouped[entry.type] = [];
      grouped[entry.type].push(entry.entry);
    }

    let notes = releaseNotes;
    for (const [type, items] of Object.entries(grouped)) {
      notes += `## ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
      items.forEach(item => {
        notes += `- ${item}\n`;
      });
      notes += '\n';
    }

    return notes;
  } catch (error) {
    throw new Error(`Failed to generate release notes: ${error.message}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  const command = process.argv[2];

  if (!command) {
    console.log(`
${chalk.bold('Changelog Manager CLI')}

Usage:
  node scripts/changelog-manager.js <command> [options]

Commands:
  add <type> <task-id> <title> [description]
                          Add changelog entry
                          Types: feat, fix, bugfix, docs, chore, refactor
  recent [count]          Show recent entries (default: 10)
  release <from> <to>     Generate release notes for date range
  list                    List all changelog entries
    `);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'add': {
        const type = process.argv[3];
        const taskId = process.argv[4];
        const title = process.argv[5];
        const description = process.argv[6] || '';

        if (!type || !taskId || !title) {
          console.error(chalk.red('Usage: add <type> <task-id> <title> [description]'));
          process.exit(1);
        }

        await appendEntry(type, taskId, title, description);
        break;
      }

      case 'recent': {
        const count = parseInt(process.argv[3]) || 10;
        const entries = await getRecentEntries(count);

        if (entries.length === 0) {
          console.log(chalk.yellow('No changelog entries found'));
          break;
        }

        const tableData = [
          [chalk.bold('Type'), chalk.bold('Entry')],
          ...entries.map(e => [chalk.cyan(e.type), e.entry])
        ];

        console.log('\nRecent Changelog Entries:\n');
        console.log(table(tableData));
        break;
      }

      case 'release': {
        const fromDate = process.argv[3];
        const toDate = process.argv[4];

        if (!fromDate || !toDate) {
          console.error(chalk.red('Usage: release <from-date> <to-date>'));
          process.exit(1);
        }

        const notes = await generateReleaseNotes(fromDate, toDate);
        console.log(notes);
        break;
      }

      case 'list': {
        const entries = await getRecentEntries(100);
        const tableData = [
          [chalk.bold('Type'), chalk.bold('Entry')],
          ...entries.map(e => [chalk.cyan(e.type), e.entry])
        ];

        console.log('\nAll Changelog Entries:\n');
        console.log(table(tableData));
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
  appendEntry,
  getRecentEntries,
  generateReleaseNotes
};

// Run CLI if called directly
if (require.main === module) {
  main();
}
