/**
 * Shared utilities for task file creation and manipulation
 * Consolidates common patterns from bulk-create, create-task, and MCP
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const config = require('../config.json');
const logger = require('./logger');

/**
 * Validate task file structure
 * @param {string} title - Task title
 * @param {string} body - Task body/description
 * @param {object} frontMatter - Optional front matter fields
 * @returns {object} {valid: boolean, errors: string[]}
 */
function validateTask(title, body, frontMatter = {}) {
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (title && title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!body || body.trim().length === 0) {
    errors.push('Body/description is required');
  }

  // Validate front matter if present
  if (frontMatter.status && !['pending', 'processing', 'complete', 'failed'].includes(frontMatter.status)) {
    errors.push('Status must be one of: pending, processing, complete, failed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate unique task ID based on timestamp
 * Format: task-YYYYMMDD-HHMMSS-NNN (NNN = random 3-digit)
 * @returns {string} Task ID
 */
function generateTaskId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `task-${date}-${random}`;
}

/**
 * Create front matter object with defaults
 * @param {object} overrides - Fields to override defaults
 * @returns {object} Front matter with defaults
 */
function createFrontMatter(overrides = {}) {
  return {
    id: generateTaskId(),
    status: 'pending',
    created: new Date().toISOString(),
    model: config.ollama?.model || 'mistral',
    approval: {
      code: {
        required: config.approval?.code?.required ?? true,
        approved: false
      },
      docs: {
        required: config.approval?.docs?.required ?? false,
        approved: false
      }
    },
    documentation: {
      generate_worklog: config.documentation?.generate_worklog ?? true,
      generate_adr: config.documentation?.generate_adr ?? false,
      update_changelog: config.documentation?.update_changelog ?? true
    },
    ...overrides
  };
}

/**
 * Write task file to filesystem
 * @param {string} taskId - Task ID (used for filename)
 * @param {string} title - Task title
 * @param {string} body - Task body/description
 * @param {object} frontMatter - Front matter fields
 * @param {string} folder - Target folder (todo/doing/etc)
 * @returns {Promise<object>} {success: boolean, path: string, error?: string}
 */
async function writeTaskFile(taskId, title, body, frontMatter = {}, folder = 'todo') {
  try {
    // Validate inputs
    const validation = validateTask(title, body, frontMatter);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    // Ensure folder exists
    const tasksDir = path.join(config.folders.base || './backlog', folder);
    await fs.mkdir(tasksDir, { recursive: true });

    // Create filename
    const filename = `${taskId}.md`;
    const filepath = path.join(tasksDir, filename);

    // Check if file already exists
    try {
      await fs.stat(filepath);
      return {
        success: false,
        error: `Task file already exists: ${filename}`
      };
    } catch {
      // File doesn't exist, proceed
    }

    // Create front matter with defaults
    const fullFrontMatter = createFrontMatter(frontMatter);

    // Build file content using gray-matter
    const fileContent = matter.stringify(body, fullFrontMatter);

    // Write file
    await fs.writeFile(filepath, fileContent, 'utf8');

    logger.task.success(taskId, `Created in ${folder}`, { path: filepath });

    return {
      success: true,
      id: taskId,
      path: filepath,
      frontMatter: fullFrontMatter
    };
  } catch (error) {
    logger.task.error(taskId, `Failed to write file`, { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Read and parse task file
 * @param {string} filepath - Path to task file
 * @returns {Promise<object>} {success: boolean, id: string, content: string, frontMatter: object, error?: string}
 */
async function readTaskFile(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    const parsed = matter(content);

    // Extract task ID from front matter or filename
    const taskId = parsed.data.id || path.basename(filepath, '.md');

    return {
      success: true,
      id: taskId,
      content: parsed.content,
      frontMatter: parsed.data
    };
  } catch (error) {
    logger.error('Failed to read task file', { filepath, error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update front matter fields in task file
 * @param {string} filepath - Path to task file
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} {success: boolean, path: string, error?: string}
 */
async function updateTaskFrontMatter(filepath, updates = {}) {
  try {
    const taskRead = await readTaskFile(filepath);
    if (!taskRead.success) {
      return taskRead;
    }

    const updatedFrontMatter = {
      ...taskRead.frontMatter,
      ...updates,
      modified: new Date().toISOString()
    };

    const fileContent = matter.stringify(taskRead.content, updatedFrontMatter);
    await fs.writeFile(filepath, fileContent, 'utf8');

    logger.info(`Updated front matter: ${path.basename(filepath)}`, { updates });

    return {
      success: true,
      path: filepath,
      frontMatter: updatedFrontMatter
    };
  } catch (error) {
    logger.error('Failed to update task file', { filepath, error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Move task file between folders
 * @param {string} taskId - Task ID
 * @param {string} fromFolder - Source folder (todo, doing, etc)
 * @param {string} toFolder - Target folder (review, completed, etc)
 * @returns {Promise<object>} {success: boolean, path: string, error?: string}
 */
async function moveTask(taskId, fromFolder, toFolder) {
  try {
    const basePath = config.folders.base || './backlog';
    const fromPath = path.join(basePath, fromFolder, `${taskId}.md`);
    const toPath = path.join(basePath, toFolder, `${taskId}.md`);

    // Ensure target folder exists
    const toDir = path.dirname(toPath);
    await fs.mkdir(toDir, { recursive: true });

    // Move file
    await fs.rename(fromPath, toPath);

    logger.task.success(taskId, `Moved from ${fromFolder} to ${toFolder}`);

    return {
      success: true,
      path: toPath,
      from: fromFolder,
      to: toFolder
    };
  } catch (error) {
    logger.task.error(taskId, `Failed to move`, { from: fromFolder, to: toFolder, error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List task files in a folder
 * @param {string} folder - Folder name (todo, doing, etc)
 * @returns {Promise<object[]>} Array of task file info
 */
async function listTasks(folder = 'todo') {
  try {
    const tasksDir = path.join(config.folders.base || './backlog', folder);
    const files = await fs.readdir(tasksDir);
    
    const tasks = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (f) => {
          const taskRead = await readTaskFile(path.join(tasksDir, f));
          return {
            id: taskRead.id,
            file: f,
            status: taskRead.frontMatter?.status,
            created: taskRead.frontMatter?.created
          };
        })
    );

    return tasks.filter(t => t.id); // Filter out failed reads
  } catch (error) {
    logger.error(`Failed to list tasks in ${folder}`, { error: error.message });
    return [];
  }
}

module.exports = {
  validateTask,
  generateTaskId,
  createFrontMatter,
  writeTaskFile,
  readTaskFile,
  updateTaskFrontMatter,
  moveTask,
  listTasks
};
