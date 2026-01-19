#!/usr/bin/env node

/**
 * Create a new spec file interactively or via CLI
 * Usage:
 *   node scripts/create-spec.js [--interactive]
 *   node scripts/create-spec.js --title "..." --requirements "req1" "req2" ...
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const inquirer = require('inquirer');

const config = require('../config.json');

async function createSpecInteractive() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Spec title:',
      validate: (input) => input.length > 0 || 'Title is required',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
    },
    {
      type: 'checkbox',
      name: 'requirements',
      message: 'Requirements (press space to select, then enter to add custom ones):',
      choices: [
        { name: 'Feature implementation' },
        { name: 'Documentation' },
        { name: 'Testing' },
        { name: 'Performance optimization' },
        { name: 'Security hardening' },
      ],
      filter: (selected) => selected,
    },
    {
      type: 'input',
      name: 'additionalReq',
      message: 'Add additional requirements (comma-separated, or press Enter to skip):',
    },
    {
      type: 'list',
      name: 'specType',
      message: 'Spec type:',
      choices: ['feature', 'bugfix', 'refactor', 'docs', 'infra'],
      default: 'feature',
    },
    {
      type: 'input',
      name: 'components',
      message: 'Components (comma-separated):',
    },
    {
      type: 'confirm',
      name: 'requireCodeApproval',
      message: 'Require code approval?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'requireDocsApproval',
      message: 'Require docs approval?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'generateWorklog',
      message: 'Generate worklog?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'generateAdr',
      message: 'Generate ADR?',
      default: false,
    },
  ]);

  return answers;
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const result = {
    title: null,
    description: null,
    requirements: [],
    specType: 'feature',
    components: [],
    requireCodeApproval: true,
    requireDocsApproval: true,
    generateWorklog: true,
    generateAdr: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title') {
      result.title = args[++i];
    } else if (args[i] === '--description') {
      result.description = args[++i];
    } else if (args[i] === '--requirements') {
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result.requirements.push(args[++i]);
      }
    } else if (args[i] === '--type') {
      result.specType = args[++i];
    } else if (args[i] === '--components') {
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result.components.push(args[++i]);
      }
    } else if (args[i] === '--no-code-approval') {
      result.requireCodeApproval = false;
    } else if (args[i] === '--no-docs-approval') {
      result.requireDocsApproval = false;
    } else if (args[i] === '--no-worklog') {
      result.generateWorklog = false;
    } else if (args[i] === '--adr') {
      result.generateAdr = true;
    }
  }

  return result;
}

async function createSpec(answers) {
  try {
    const todoDir = config.folders.todo;

    // Create if not exists
    await fs.mkdir(todoDir, { recursive: true });

    // Get next spec ID
    const files = await fs.readdir(todoDir).catch(() => []);
    const maxId = Math.max(
      ...files.map((f) => {
        const match = f.match(/spec-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }),
      0
    );
    const newId = maxId + 1;

    // Parse requirements
    const requirements = [
      ...answers.requirements,
      ...(answers.additionalReq
        ? answers.additionalReq.split(',').map((r) => r.trim())
        : []),
    ].filter(Boolean);

    const components = answers.components
      ? answers.components.split(',').map((c) => c.trim())
      : [];

    const frontMatter = {
      id: `spec-${newId}`,
      title: answers.title,
      description: answers.description || '',
      status: 'To Do',
      priority: 'high',
      spec: {
        enabled: true,
        type: answers.specType,
        requirements,
        architecture: {
          components,
          integrations: [],
          decisions: '',
        },
      },
      approval: {
        code: {
          required: answers.requireCodeApproval,
          autoApprove: false,
        },
        docs: {
          required: answers.requireDocsApproval,
          generate: {
            worklog: answers.generateWorklog,
            adr: answers.generateAdr,
            changelog: true,
          },
        },
      },
      documentation: {
        generated: false,
        worklogPath: null,
        adrPath: null,
      },
      acceptanceCriteria: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const content = matter.stringify(
      `# ${answers.title}\n\n${answers.description || ''}\n\n## Acceptance Criteria\n- \n`,
      frontMatter
    );

    const filePath = path.join(todoDir, `spec-${newId}.md`);
    await fs.writeFile(filePath, content);

    console.log(`\n✅ Spec created successfully!\n`);
    console.log(`📄 File: ${filePath}`);
    console.log(`🆔 Spec ID: spec-${newId}`);
    console.log(`📋 Title: ${answers.title}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Edit the file to add acceptance criteria`);
    console.log(`   2. Add implementation notes in the body`);
    console.log(`   3. Place in backlog/todo/ folder`);
    console.log(`   4. Watcher will process it automatically\n`);
  } catch (error) {
    console.error('❌ Failed to create spec:', error.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isInteractive = args.includes('--interactive') || args.length === 0;

  let answers;
  if (isInteractive) {
    answers = await createSpecInteractive();
  } else {
    answers = parseCliArgs();
    if (!answers.title) {
      console.error('❌ --title is required');
      process.exit(1);
    }
  }

  await createSpec(answers);
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
