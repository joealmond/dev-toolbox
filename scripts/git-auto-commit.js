#!/usr/bin/env node

/**
 * Git auto-commit CLI utility
 * Usage:
 *   node scripts/git-auto-commit.js [directory] [message]
 *   
 * Examples:
 *   node scripts/git-auto-commit.js . "feat: add feature"
 *   node scripts/git-auto-commit.js /path/to/repo
 */

const { autoCommitChanges, autoCommitAndPush } = require('./git-manager');
const path = require('path');

async function main() {
  const [,, targetDir = '.', message, ...flags] = process.argv;
  
  const workingDir = path.resolve(targetDir);
  const shouldPush = flags.includes('--push');
  
  console.log(`[INFO] Auto-committing changes in: ${workingDir}`);
  if (message) {
    console.log(`[INFO] Commit message: ${message}`);
  }
  
  let success;
  if (shouldPush) {
    success = await autoCommitAndPush(workingDir, message);
  } else {
    success = await autoCommitChanges(workingDir, message);
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('[ERROR]', error.message);
  process.exit(1);
});
