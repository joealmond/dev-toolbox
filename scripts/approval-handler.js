#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');
const table = require('table').table;
const inquirer = require('inquirer');

// Load configuration
const config = require('../config.json');

/**
 * Check approval status for a task
 * @param {string} taskId - Task ID
 * @returns {Promise<object>} - Approval status
 */
async function checkApprovalStatus(taskId) {
  try {
    const taskFile = await findTaskFile(taskId);
    if (!taskFile) {
      throw new Error(`Task ${taskId} not found`);
    }

    const content = await fs.readFile(taskFile, 'utf-8');
    const { data: frontMatter } = matter(content);

    return {
      taskId,
      taskFile,
      codeApprovalRequired: frontMatter.approval?.code?.required || false,
      codeApproved: frontMatter.approval?.code?.approved || false,
      docsApprovalRequired: frontMatter.approval?.docs?.required || false,
      docsApproved: frontMatter.approval?.docs?.approved || false,
      docsGenerated: frontMatter.documentation?.generated || false,
      status: getOverallStatus(frontMatter)
    };
  } catch (error) {
    throw new Error(`Failed to check approval status: ${error.message}`);
  }
}

/**
 * Approve code changes for a task
 * @param {string} taskId - Task ID
 * @param {string} approver - Approver name/identifier
 * @param {string} notes - Optional approval notes
 * @returns {Promise<void>}
 */
async function approveCode(taskId, approver = 'system', notes = '') {
  try {
    const taskFile = await findTaskFile(taskId);
    if (!taskFile) {
      throw new Error(`Task ${taskId} not found`);
    }

    const content = await fs.readFile(taskFile, 'utf-8');
    const { data: frontMatter, content: body } = matter(content);

    // Update approval status
    if (!frontMatter.approval) frontMatter.approval = {};
    if (!frontMatter.approval.code) frontMatter.approval.code = {};

    frontMatter.approval.code.approved = true;
    frontMatter.approval.code.approver = approver;
    frontMatter.approval.code.approvedAt = new Date().toISOString();
    if (notes) frontMatter.approval.code.notes = notes;

    // Write back to file
    const newContent = matter.stringify(body, frontMatter);
    await fs.writeFile(taskFile, newContent);

    console.log(chalk.green(`✓ Code approved for ${taskId} by ${approver}`));
  } catch (error) {
    throw new Error(`Failed to approve code: ${error.message}`);
  }
}

/**
 * Approve documentation for a task
 * @param {string} taskId - Task ID
 * @param {string} approver - Approver name/identifier
 * @param {string} notes - Optional approval notes
 * @returns {Promise<void>}
 */
async function approveDocs(taskId, approver = 'system', notes = '') {
  try {
    const taskFile = await findTaskFile(taskId);
    if (!taskFile) {
      throw new Error(`Task ${taskId} not found`);
    }

    const content = await fs.readFile(taskFile, 'utf-8');
    const { data: frontMatter, content: body } = matter(content);

    // Update approval status
    if (!frontMatter.approval) frontMatter.approval = {};
    if (!frontMatter.approval.docs) frontMatter.approval.docs = {};

    frontMatter.approval.docs.approved = true;
    frontMatter.approval.docs.approver = approver;
    frontMatter.approval.docs.approvedAt = new Date().toISOString();
    if (notes) frontMatter.approval.docs.notes = notes;

    // Write back to file
    const newContent = matter.stringify(body, frontMatter);
    await fs.writeFile(taskFile, newContent);

    console.log(chalk.green(`✓ Docs approved for ${taskId} by ${approver}`));
  } catch (error) {
    throw new Error(`Failed to approve docs: ${error.message}`);
  }
}

/**
 * Reject a task and move it to failed
 * @param {string} taskId - Task ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<void>}
 */
async function rejectTask(taskId, reason = '') {
  try {
    const taskFile = await findTaskFile(taskId);
    if (!taskFile) {
      throw new Error(`Task ${taskId} not found`);
    }

    const filename = path.basename(taskFile);
    const failedPath = path.join(config.folders.failed, filename);

    // Add rejection info to front matter
    const content = await fs.readFile(taskFile, 'utf-8');
    const { data: frontMatter, content: body } = matter(content);

    frontMatter.status = 'Failed';
    frontMatter.rejectedAt = new Date().toISOString();
    if (reason) {
      frontMatter.rejectionReason = reason;
    }

    const newContent = matter.stringify(body, frontMatter);
    await fs.mkdir(config.folders.failed, { recursive: true });
    await fs.writeFile(failedPath, newContent);

    // Remove from original location
    try {
      await fs.unlink(taskFile);
    } catch {
      // File may not exist anymore
    }

    console.log(chalk.red(`✗ Task ${taskId} rejected`));
    if (reason) {
      console.log(`  Reason: ${reason}`);
    }
  } catch (error) {
    throw new Error(`Failed to reject task: ${error.message}`);
  }
}

/**
 * List all pending approvals
 * @returns {Promise<array>} - Pending approval tasks
 */
async function listPendingApprovals() {
  try {
    const reviewPath = config.folders.review;
    const files = await fs.readdir(reviewPath).catch(() => []);

    const pending = [];

    for (const file of files) {
      const taskPath = path.join(reviewPath, file);
      const content = await fs.readFile(taskPath, 'utf-8');
      const { data: frontMatter } = matter(content);

      const codeNeeds = frontMatter.approval?.code?.required && !frontMatter.approval?.code?.approved;
      const docsNeeds = frontMatter.approval?.docs?.required && !frontMatter.approval?.docs?.approved;

      if (codeNeeds || docsNeeds) {
        pending.push({
          taskId: frontMatter.id || file,
          title: frontMatter.title,
          codeApprovalNeeded: codeNeeds,
          docsApprovalNeeded: docsNeeds,
          createdAt: frontMatter.createdAt || 'N/A'
        });
      }
    }

    return pending;
  } catch (error) {
    throw new Error(`Failed to list pending approvals: ${error.message}`);
  }
}

/**
 * Find task file by ID across all folders
 * @param {string} taskId - Task ID to find
 * @returns {Promise<string|null>} - Path to task file or null
 */
async function findTaskFile(taskId) {
  const folders = [
    config.folders.todo,
    config.folders.doing,
    config.folders.review,
    config.folders.completed,
    config.folders.failed
  ];

  for (const folder of folders) {
    try {
      const files = await fs.readdir(folder);
      for (const file of files) {
        if (file.includes(taskId)) {
          return path.join(folder, file);
        }
      }
    } catch {
      // Folder may not exist
    }
  }

  return null;
}

/**
 * Get overall approval status
 * @param {object} frontMatter - Front matter object
 * @returns {string} - Status string
 */
function getOverallStatus(frontMatter) {
  const codeNeeds = frontMatter.approval?.code?.required && !frontMatter.approval?.code?.approved;
  const docsNeeds = frontMatter.approval?.docs?.required && !frontMatter.approval?.docs?.approved;

  if (codeNeeds && docsNeeds) return 'Needs Code & Docs Approval';
  if (codeNeeds) return 'Needs Code Approval';
  if (docsNeeds) return 'Needs Docs Approval';
  return 'Fully Approved';
}

/**
 * CLI interface
 */
async function main() {
  const command = process.argv[2];

  if (!command) {
    console.log(`
${chalk.bold('Approval Handler CLI')}

Usage:
  node scripts/approval-handler.js <command> [options]

Commands:
  list                    List all pending approvals
  status <task-id>        Check approval status for task
  approve-code <task-id>  Approve code changes
  approve-docs <task-id>  Approve documentation
  reject <task-id>        Reject task and move to failed
  interactive <task-id>   Interactive approval prompt
    `);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'list': {
        const pending = await listPendingApprovals();

        if (pending.length === 0) {
          console.log(chalk.green('✓ No pending approvals'));
          break;
        }

        const tableData = [
          [chalk.bold('Task ID'), chalk.bold('Title'), chalk.bold('Needed')],
          ...pending.map(p => [
            chalk.cyan(p.taskId),
            p.title || 'N/A',
            chalk.yellow(
              [
                p.codeApprovalNeeded ? 'Code' : '',
                p.docsApprovalNeeded ? 'Docs' : ''
              ]
                .filter(Boolean)
                .join(', ')
            )
          ])
        ];

        console.log(`\n${chalk.bold(`${pending.length} Pending Approvals`)}\n`);
        console.log(table(tableData));
        break;
      }

      case 'status': {
        const taskId = process.argv[3];
        if (!taskId) {
          console.error(chalk.red('Task ID required'));
          process.exit(1);
        }

        const status = await checkApprovalStatus(taskId);
        console.log(chalk.bold(`\nApproval Status for ${taskId}:`));
        console.log(`  Code Approval: ${status.codeApproved ? chalk.green('✓ Approved') : chalk.yellow('⊘ Pending')}`);
        console.log(`  Docs Approval: ${status.docsApproved ? chalk.green('✓ Approved') : chalk.yellow('⊘ Pending')}`);
        console.log(`  Docs Generated: ${status.docsGenerated ? chalk.green('✓ Yes') : chalk.yellow('✗ No')}`);
        console.log(`  Overall: ${status.status}\n`);
        break;
      }

      case 'approve-code': {
        const taskId = process.argv[3];
        if (!taskId) {
          console.error(chalk.red('Task ID required'));
          process.exit(1);
        }

        await approveCode(taskId, 'cli-user');
        break;
      }

      case 'approve-docs': {
        const taskId = process.argv[3];
        if (!taskId) {
          console.error(chalk.red('Task ID required'));
          process.exit(1);
        }

        await approveDocs(taskId, 'cli-user');
        break;
      }

      case 'reject': {
        const taskId = process.argv[3];
        const reason = process.argv[4] || '';

        if (!taskId) {
          console.error(chalk.red('Task ID required'));
          process.exit(1);
        }

        await rejectTask(taskId, reason);
        break;
      }

      case 'interactive': {
        const taskId = process.argv[3];
        if (!taskId) {
          console.error(chalk.red('Task ID required'));
          process.exit(1);
        }

        const status = await checkApprovalStatus(taskId);
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: `Action for ${taskId}:`,
            choices: [
              { name: 'Approve Code', value: 'approve-code', disabled: !status.codeApprovalRequired },
              { name: 'Approve Docs', value: 'approve-docs', disabled: !status.docsApprovalRequired },
              { name: 'Reject Task', value: 'reject' },
              { name: 'View Status', value: 'status' }
            ]
          }
        ]);

        switch (answers.action) {
          case 'approve-code':
            await approveCode(taskId, 'cli-interactive');
            break;
          case 'approve-docs':
            await approveDocs(taskId, 'cli-interactive');
            break;
          case 'reject': {
            const reason = await inquirer.prompt([
              {
                type: 'input',
                name: 'reason',
                message: 'Rejection reason:'
              }
            ]);
            await rejectTask(taskId, reason.reason);
            break;
          }
          case 'status':
            console.log(chalk.bold(`Status: ${status.status}`));
            break;
        }
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
  checkApprovalStatus,
  approveCode,
  approveDocs,
  rejectTask,
  listPendingApprovals,
  findTaskFile
};

// Run CLI if called directly
if (require.main === module) {
  main();
}
