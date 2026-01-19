#!/usr/bin/env node

const chokidar = require('chokidar');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const PQueue = require('p-queue').default;
const matter = require('gray-matter');
const crypto = require('crypto');

// Load configuration and utilities
const config = require('../config.json');
const specParser = require('./spec-parser');
const docGenerator = require('./doc-generator');
const approvalHandler = require('./approval-handler');
const semanticIndexer = require('./semantic-indexer');
require('dotenv').config();

// Initialize processing queue
const queue = new PQueue({ concurrency: config.processing.concurrency });

// Initialize webhook server
const app = express();
app.use(express.json());

// Store for tracking processed files to avoid duplicates
const processingFiles = new Set();

// Logging utility
function log(level, message, data = {}) {
  const timestamp = config.logging.includeTimestamp 
    ? new Date().toISOString() 
    : '';
  
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  
  const color = config.logging.colorize ? colors[level] || colors.reset : '';
  const reset = config.logging.colorize ? colors.reset : '';
  
  const logMessage = `${color}[${timestamp}] [${level.toUpperCase()}] ${message}${reset}`;
  console.log(logMessage, data && Object.keys(data).length > 0 ? data : '');
}

// Extract task ID from filename
function extractTaskId(filename) {
  const match = filename.match(new RegExp(config.taskIdFormat.extractRegex));
  return match ? match[1] : null;
}

// Process ticket file with spec support and approval workflow
async function processTicket(filePath) {
  const filename = path.basename(filePath);
  
  // Prevent duplicate processing
  if (processingFiles.has(filename)) {
    log('warning', `File ${filename} is already being processed, skipping`);
    return;
  }
  
  processingFiles.add(filename);
  
  try {
    log('info', `Processing ticket: ${filename}`);
    
    // Wait for file to be fully written
    await new Promise(resolve => setTimeout(resolve, config.processing.moveDelay));
    
    // Move to 'doing' folder
    const doingPath = path.join(config.folders.doing, filename);
    await fs.rename(filePath, doingPath);
    log('info', `Moved ${filename} to 'doing' folder`);
    
    // Read and parse the task
    const content = await fs.readFile(doingPath, 'utf-8');
    const { data: frontMatter, content: body } = matter(content);
    
    const taskId = extractTaskId(filename);
    const processTicketModule = require('./process-ticket');
    
    // Process with kodu
    const result = await processTicketModule(doingPath, frontMatter, body, taskId);
    
    if (result.success) {
      log('success', `✓ Kodu processing succeeded for ${filename}`);
      
      // Parse spec if enabled (for metadata and doc generation)
      let spec = null;
      let isSpec = false;
      
      try {
        if (frontMatter.spec && frontMatter.spec.enabled === true) {
          spec = {
            id: frontMatter.id,
            title: frontMatter.title,
            description: frontMatter.description,
            spec: frontMatter.spec,
            approval: frontMatter.approval,
            documentation: frontMatter.documentation,
            acceptanceCriteria: frontMatter.acceptanceCriteria,
            model: result.model
          };
          isSpec = true;
          log('info', `Spec-driven task detected: ${taskId}`);
        }
      } catch (specError) {
        log('warning', `Could not parse spec metadata: ${specError.message}`);
      }
      
      // Check approval requirements
      const codeApprovalRequired = isSpec && frontMatter.approval?.code?.required;
      const docsApprovalRequired = isSpec && frontMatter.approval?.docs?.required;
      
      let docsGenerated = false;
      let docs = {};
      
      // Generate documentation if spec mode and auto-approval configured
      if (isSpec && frontMatter.approval?.docs?.generate) {
        try {
          log('info', `Generating documentation for ${taskId}`);
          
          docs = await docGenerator.generateAll(spec, result);
          docsGenerated = true;
          
          // Update front matter with doc paths
          frontMatter.documentation = frontMatter.documentation || {};
          frontMatter.documentation.generated = true;
          frontMatter.documentation.worklogPath = docs.worklogPath || null;
          frontMatter.documentation.adrPath = docs.adrPath || null;
          frontMatter.documentation.changelogPath = docs.changelogPath || null;
          
          log('success', `✓ Documentation generated for ${taskId}`);
        } catch (docError) {
          log('error', `Failed to generate docs for ${taskId}: ${docError.message}`);
          // Continue even if docs fail - code is valid
        }
      }
      
      // Move to review folder
      const reviewPath = path.join(config.folders.review, filename);
      const updatedContent = matter.stringify(body, frontMatter);
      await fs.writeFile(doingPath, updatedContent); // Update with doc paths
      await fs.rename(doingPath, reviewPath);
      
      // Log approval status
      if (codeApprovalRequired) {
        log('warning', `Task ${taskId} requires CODE approval before proceeding`);
      } else if (docsApprovalRequired && docsGenerated) {
        log('warning', `Task ${taskId} requires DOCS approval before completion`);
      } else {
        log('success', `✓ Task ${taskId} ready for completion (no approvals required)`);
      }
      
      // Trigger git operations if configured
      if (config.git.createPR) {
        try {
          const gitManager = require('./git-manager');
          await gitManager.processTaskRepo(taskId, frontMatter, result);
          log('success', `✓ Git operations completed for ${taskId}`);
        } catch (gitError) {
          log('error', `Git operations failed for ${taskId}: ${gitError.message}`);
        }
      }
      
    } else {
      // Move to failed folder with error log
      const failedPath = path.join(config.folders.failed, filename);
      await fs.rename(doingPath, failedPath);
      
      // Write error log
      const errorLogPath = failedPath.replace('.md', '.error.log');
      await fs.writeFile(errorLogPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        filename,
        error: result.error,
        stderr: result.stderr,
        exitCode: result.exitCode
      }, null, 2));
      
      log('error', `✗ Failed to process ${filename}`, { error: result.error });
    }
    
  } catch (error) {
    log('error', `Error processing ${filename}:`, { error: error.message });
    
    // Try to move to failed folder
    try {
      const doingPath = path.join(config.folders.doing, filename);
      const failedPath = path.join(config.folders.failed, filename);
      
      if (await fs.access(doingPath).then(() => true).catch(() => false)) {
        await fs.rename(doingPath, failedPath);
      }
    } catch (moveError) {
      log('error', `Failed to move ${filename} to failed folder:`, { error: moveError.message });
    }
  } finally {
    processingFiles.delete(filename);
  }
}

// Webhook handler for Gitea events
app.post(config.webhook.path, async (req, res) => {
  try {
    // Verify webhook secret
    const signature = req.headers['x-gitea-signature'];
    const secret = process.env.GITEA_WEBHOOK_SECRET;
    
    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const calculatedSignature = hmac.update(JSON.stringify(req.body)).digest('hex');
      
      if (signature !== calculatedSignature) {
        log('warning', 'Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    const event = req.headers['x-gitea-event'];
    const payload = req.body;
    
    log('info', `Received webhook event: ${event}`);
    
    // Handle pull request events
    if (event === 'pull_request') {
      const action = payload.action;
      const prNumber = payload.number;
      const prTitle = payload.pull_request?.title || '';
      const merged = payload.pull_request?.merged || false;
      
      log('info', `PR #${prNumber}: ${action}`, { title: prTitle, merged });
      
      // Extract task ID from PR title
      const taskIdMatch = prTitle.match(/\[Task (\d+)\]/i);
      const taskId = taskIdMatch ? taskIdMatch[1] : null;
      
      if (merged && taskId && config.webhook.autoMergePR) {
        // Auto-complete task when PR is merged
        try {
          const reviewFiles = await fs.readdir(config.folders.review);
          const taskFile = reviewFiles.find(f => f.includes(`task-${taskId}`) || f.includes(`spec-${taskId}`));
          
          if (taskFile) {
            const reviewPath = path.join(config.folders.review, taskFile);
            const completedPath = path.join(config.folders.completed, taskFile);
            
            // Update task status
            const content = await fs.readFile(reviewPath, 'utf-8');
            const { data: frontMatter, content: body } = matter(content);
            
            frontMatter.status = 'Completed';
            frontMatter.completedAt = new Date().toISOString();
            
            const updatedContent = matter.stringify(body, frontMatter);
            await fs.writeFile(reviewPath, updatedContent);
            
            // Move to completed
            await fs.rename(reviewPath, completedPath);
            log('success', `✓ Moved task-${taskId} to completed (PR #${prNumber} merged)`);
          }
        } catch (error) {
          log('error', `Failed to auto-complete task-${taskId}: ${error.message}`);
        }
      }
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    log('error', 'Webhook handler error:', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    queueSize: queue.size,
    queuePending: queue.pending,
    processing: Array.from(processingFiles)
  });
});

// Start webhook server
let server;
if (config.webhook.enabled) {
  server = app.listen(config.webhook.port, () => {
    log('info', `Webhook server listening on port ${config.webhook.port}`);
    log('info', `Webhook endpoint: http://localhost:${config.webhook.port}${config.webhook.path}`);
    log('info', `Health check: http://localhost:${config.webhook.port}/health`);
  });
}

// Initialize file watcher
log('info', 'Starting ticket processor watcher...');
log('info', `Watching folder: ${config.folders.todo}`);
log('info', `Processing concurrency: ${config.processing.concurrency}`);
log('info', `Default model: ${config.ollama.defaultModel}`);

// Warm the semantic index on startup when enabled
if (config.search && config.search.enabled !== false) {
  (async () => {
    try {
      if (config.search.rebuildOnStart) {
        const { count, indexFile } = await semanticIndexer.buildIndex();
        log('success', `Rebuilt semantic index (${count} files) at ${indexFile}`);
      } else {
        await semanticIndexer.ensureIndex();
        log('info', 'Semantic index ready');
      }
    } catch (error) {
      log('warning', `Semantic index unavailable: ${error.message}`);
    }
  })();
}

const watcher = chokidar.watch(`${config.folders.todo}/*.md`, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: config.processing.watchDebounce,
    pollInterval: 100
  }
});

watcher
  .on('add', filePath => {
    log('info', `New ticket detected: ${path.basename(filePath)}`);
    queue.add(() => processTicket(filePath));
  })
  .on('error', error => {
    log('error', 'Watcher error:', { error: error.message });
  });

log('success', '✓ Watcher is ready and monitoring for new tickets');

// Graceful shutdown
function gracefulShutdown(signal) {
  log('info', `Received ${signal}, shutting down gracefully...`);
  
  watcher.close();
  
  if (server) {
    server.close(() => {
      log('info', 'Webhook server closed');
    });
  }
  
  queue.onIdle().then(() => {
    log('info', 'All pending tasks completed');
    process.exit(0);
  });
  
  // Force exit after 30 seconds
  setTimeout(() => {
    log('warning', 'Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled rejection:', { reason, promise });
});
