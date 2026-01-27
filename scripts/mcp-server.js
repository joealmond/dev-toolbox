#!/usr/bin/env node

/**
 * MCP Server for Spec-Driven Ticket Processing
 * Exposes 12 tools for VS Code integration via Model Context Protocol
 * 
 * Tools:
 * 1. create_task - Create a new task from scratch
 * 2. create_spec - Create a new specification-driven task
 * 3. process_task - Trigger processing of a task
 * 4. approve_code - Approve code implementation
 * 5. approve_docs - Approve generated documentation
 * 6. reject_task - Reject task and move to failed
 * 7. check_status - Check status of a task
 * 8. list_pending - List all pending approvals
 * 9. query_search - Semantic search across codebase
 * 10. generate_adr - Generate architecture decision record
 * 11. append_changelog - Add entry to CHANGELOG.md
 * 12. check_staleness - Check for stale tasks
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const {
  StdioServerTransport,
} = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

// Import local modules
const specParser = require('./spec-parser');
const docGenerator = require('./doc-generator');
const approvalHandler = require('./approval-handler');
const config = require('../config.json');

// Initialize server
const server = new Server({
  name: 'dev-toolbox-mcp',
  version: '1.0.0',
  capabilities: {
    tools: {},
  },
});

// Define tools
const tools = [
  {
    name: 'create_task',
    description: 'Create a new task in the todo folder',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task title',
        },
        description: {
          type: 'string',
          description: 'Task description',
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of acceptance criteria',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Task priority',
        },
        assignee: {
          type: 'string',
          description: 'Assignee email/name',
        },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'create_spec',
    description: 'Create a new specification-driven task',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Specification title',
        },
        requirements: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of requirements',
        },
        architecture: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: { type: 'string' },
            },
            integrations: {
              type: 'array',
              items: { type: 'string' },
            },
            decisions: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['title', 'requirements'],
    },
  },
  {
    name: 'process_task',
    description: 'Trigger processing of a task with AI',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID (e.g., "1", "123")',
        },
        model: {
          type: 'string',
          description: 'LLM model to use',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'approve_code',
    description: 'Approve code implementation of a task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        approver: {
          type: 'string',
          description: 'Approver name/email',
        },
        notes: {
          type: 'string',
          description: 'Approval notes',
        },
      },
      required: ['taskId', 'approver'],
    },
  },
  {
    name: 'approve_docs',
    description: 'Approve generated documentation',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        approver: {
          type: 'string',
          description: 'Approver name/email',
        },
        notes: {
          type: 'string',
          description: 'Approval notes',
        },
      },
      required: ['taskId', 'approver'],
    },
  },
  {
    name: 'reject_task',
    description: 'Reject a task and move to failed folder',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        reason: {
          type: 'string',
          description: 'Rejection reason',
        },
      },
      required: ['taskId', 'reason'],
    },
  },
  {
    name: 'check_status',
    description: 'Check current status of a task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'list_pending',
    description: 'List all tasks pending approval',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['code', 'docs', 'all'],
          description: 'Type of pending approvals to list',
        },
      },
    },
  },
  {
    name: 'query_search',
    description: 'Semantic search across codebase and documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        limit: {
          type: 'number',
          description: 'Max results to return',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'generate_adr',
    description: 'Generate an Architecture Decision Record',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        title: {
          type: 'string',
          description: 'ADR title',
        },
        context: {
          type: 'string',
          description: 'Decision context',
        },
        decision: {
          type: 'string',
          description: 'Decision made',
        },
      },
      required: ['title', 'context', 'decision'],
    },
  },
  {
    name: 'append_changelog',
    description: 'Add entry to CHANGELOG.md',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['added', 'changed', 'fixed', 'removed', 'security'],
          description: 'Change type',
        },
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        title: {
          type: 'string',
          description: 'Change title',
        },
        description: {
          type: 'string',
          description: 'Change description',
        },
      },
      required: ['type', 'title'],
    },
  },
  {
    name: 'check_staleness',
    description: 'Check for stale or stuck tasks',
    inputSchema: {
      type: 'object',
      properties: {
        hoursThreshold: {
          type: 'number',
          description: 'Hours threshold for staleness',
        },
      },
    },
  },
];

// Tool handlers
const handlers = {
  create_task: async (input) => {
    const taskId = Date.now().toString().slice(-6);
    const frontMatter = {
      status: 'Todo',
      createdAt: new Date().toISOString(),
      title: input.title,
      description: input.description || '',
      acceptanceCriteria: input.acceptanceCriteria || [],
      priority: input.priority || 'medium',
      assignee: input.assignee || '',
      spec: { enabled: false },
    };

    const fileName = `task-${taskId}.md`;
    const filePath = path.join(config.folders.todo, fileName);
    const content = matter.stringify('', frontMatter);

    await fs.writeFile(filePath, content);
    return {
      success: true,
      taskId,
      message: `Created task-${taskId}`,
      filePath,
    };
  },

  create_spec: async (input) => {
    const taskId = Date.now().toString().slice(-6);
    const frontMatter = {
      status: 'Todo',
      createdAt: new Date().toISOString(),
      title: input.title,
      spec: {
        enabled: true,
        requirements: input.requirements || [],
        architecture: input.architecture || {},
      },
      approval: {
        code: { required: true, approved: false },
        docs: { required: true, approved: false, generate: true },
      },
      acceptanceCriteria: input.acceptanceCriteria || [],
    };

    const fileName = `spec-${taskId}.md`;
    const filePath = path.join(config.folders.todo, fileName);
    const content = matter.stringify('', frontMatter);

    await fs.writeFile(filePath, content);
    return {
      success: true,
      taskId,
      message: `Created spec-${taskId}`,
      filePath,
    };
  },

  process_task: async (input) => {
    try {
      const taskFile = await approvalHandler.findTaskFile(input.taskId);
      if (!taskFile) {
        return { success: false, error: `Task ${input.taskId} not found` };
      }

      // Move to doing folder
      const fromPath = taskFile;
      const fileName = path.basename(fromPath);
      const doingPath = path.join(config.folders.doing, fileName);

      await fs.rename(fromPath, doingPath);

      return {
        success: true,
        message: `Task ${input.taskId} moved to processing`,
        taskFile: doingPath,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  approve_code: async (input) => {
    try {
      const result = approvalHandler.approveCode(
        input.taskId,
        input.approver,
        input.notes
      );
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  approve_docs: async (input) => {
    try {
      const result = approvalHandler.approveDocs(
        input.taskId,
        input.approver,
        input.notes
      );
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  reject_task: async (input) => {
    try {
      const result = approvalHandler.rejectTask(input.taskId, input.reason);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  check_status: async (input) => {
    try {
      const taskFile = await approvalHandler.findTaskFile(input.taskId);
      if (!taskFile) {
        return { success: false, error: `Task ${input.taskId} not found` };
      }

      const content = await fs.readFile(taskFile, 'utf-8');
      const { data: frontMatter } = matter(content);

      const status = approvalHandler.checkApprovalStatus(input.taskId);
      return {
        success: true,
        taskId: input.taskId,
        status: frontMatter.status,
        location: taskFile,
        approval: status,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  list_pending: async (input) => {
    try {
      const pending = approvalHandler.listPendingApprovals();
      const type = input.type || 'all';

      let filtered = pending;
      if (type === 'code') {
        filtered = pending.filter((t) => t.codePending);
      } else if (type === 'docs') {
        filtered = pending.filter((t) => t.docsPending);
      }

      return {
        success: true,
        count: filtered.length,
        pending: filtered,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  query_search: async (input) => {
    try {
      // Placeholder for semantic search implementation (Phase 6)
      // This will be fully implemented with minisearch in Phase 6
      return {
        success: true,
        query: input.query,
        results: [],
        note: 'Semantic search indexing enabled in Phase 6',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  generate_adr: async (input) => {
    try {
      const adrNumber = await docGenerator.getNextAdrNumber();
      const result = await docGenerator.generateAdr(
        { id: input.taskId || 'manual' },
        input.title,
        input.context,
        input.decision
      );

      return {
        success: true,
        adrNumber,
        message: result,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  append_changelog: async (input) => {
    try {
      await docGenerator.appendChangelog(
        { id: input.taskId || 'manual' },
        input.type,
        input.title
      );

      return {
        success: true,
        message: `Added ${input.type} entry to CHANGELOG.md`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  check_staleness: async (input) => {
    try {
      const threshold = input.hoursThreshold || 24;
      const files = await fs.readdir(config.folders.doing);
      const stale = [];

      for (const file of files) {
        const stat = await fs.stat(path.join(config.folders.doing, file));
        const ageHours = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60);

        if (ageHours > threshold) {
          stale.push({
            file,
            ageHours: Math.round(ageHours),
          });
        }
      }

      return {
        success: true,
        threshold,
        staleCount: stale.length,
        staleTasks: stale,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Register request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request;
  const handler = handlers[name];

  if (!handler) {
    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await handler(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server started on stdio');
}

main().catch(console.error);

module.exports = { server, tools, handlers };
