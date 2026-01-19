#!/usr/bin/env node

/**
 * Semantic indexer using MiniSearch
 * - Builds a lightweight search index over project files
 * - Supports CLI commands: build, search
 * - Exposes helper functions for runtime search
 */

const fs = require('fs').promises;
const path = require('path');
const MiniSearch = require('minisearch');
const config = require('../config.json');

const projectRoot = path.join(__dirname, '..');
const searchConfig = config.search || {};
const indexDir = path.join(projectRoot, searchConfig.indexPath || '.index');
const indexFile = path.join(indexDir, 'index.json');
const maxFileSize = searchConfig.maxFileSize || 100000;
const defaultInclude = ['.js', '.ts', '.md', '.json'];
const includeExts = deriveExtensions(searchConfig.includePatterns) || defaultInclude;
const excludeSegments = deriveExcludeSegments(searchConfig.excludePatterns || ['node_modules', '.git', '.index']);

function deriveExtensions(patterns = []) {
  const exts = new Set();
  patterns.forEach((pattern) => {
    const match = pattern.match(/\.([a-zA-Z0-9]+)$/);
    if (match) {
      exts.add(`.${match[1]}`);
    }
  });
  return exts.size > 0 ? Array.from(exts) : defaultInclude;
}

function deriveExcludeSegments(patterns = []) {
  return patterns.map((p) => p.replace('/**', '').replace('**/', '').replace('**', '')).filter(Boolean);
}

function shouldExclude(filePath) {
  return excludeSegments.some((segment) => filePath.includes(segment));
}

function shouldInclude(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return includeExts.includes(ext);
}

async function collectFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldExclude(fullPath)) continue;

    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile() && shouldInclude(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function createMiniSearch() {
  return new MiniSearch({
    fields: ['content', 'path'],
    storeFields: ['content', 'path', 'preview'],
  });
}

function getSearchOptions() {
  return {
    boost: { content: 2, path: 1 },
    fuzzy: 0.2,
    prefix: true,
    combineWith: 'AND',
  };
}

function buildPreview(content, maxLength = 240) {
  if (!content) return '';
  return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content;
}

async function buildIndex() {
  const miniSearch = createMiniSearch();
  const files = await collectFiles(projectRoot);

  const docs = [];
  for (const file of files) {
    try {
      const stat = await fs.stat(file);
      if (stat.size > maxFileSize) continue;

      const content = await fs.readFile(file, 'utf-8');
      const relPath = path.relative(projectRoot, file);

      docs.push({
        id: relPath,
        path: relPath,
        content,
        preview: buildPreview(content),
      });
    } catch (error) {
      // Skip unreadable files but continue building index
      continue;
    }
  }

  miniSearch.addAll(docs);

  await fs.mkdir(indexDir, { recursive: true });
  await fs.writeFile(indexFile, JSON.stringify(miniSearch.toJSON()));
  return { count: docs.length, indexFile };
}

async function loadIndex() {
  try {
    const json = await fs.readFile(indexFile, 'utf-8');
    return MiniSearch.loadJSON(json, {
      fields: ['content', 'path'],
      storeFields: ['content', 'path', 'preview'],
    });
  } catch (error) {
    return null;
  }
}

async function ensureIndex() {
  let index = await loadIndex();
  if (!index) {
    await buildIndex();
    index = await loadIndex();
  }
  return index;
}

async function search(query, options = {}) {
  if (!query || !query.trim()) return [];

  const index = await ensureIndex();
  if (!index) return [];

  const searchOpts = { ...getSearchOptions(), limit: options.limit || 5 };
  const results = index.search(query, searchOpts);

  return results.map((result) => ({
    path: result.path,
    score: result.score,
    snippet: result.preview || buildPreview(result.content),
  }));
}

function buildQueryFromTask(frontMatter = {}, body = '') {
  const parts = [];

  if (frontMatter.title) parts.push(frontMatter.title);
  if (frontMatter.description) parts.push(frontMatter.description);

  if (frontMatter.spec?.requirements && Array.isArray(frontMatter.spec.requirements)) {
    parts.push(frontMatter.spec.requirements.join(' '));
  }

  if (frontMatter.acceptanceCriteria && Array.isArray(frontMatter.acceptanceCriteria)) {
    parts.push(frontMatter.acceptanceCriteria.join(' '));
  }

  if (body) parts.push(body);

  return parts.join(' ').trim();
}

async function searchForTask(frontMatter, body, options = {}) {
  const query = buildQueryFromTask(frontMatter, body);
  if (!query) return [];
  return search(query, options);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === 'build') {
    const { count, indexFile: output } = await buildIndex();
    console.log(`✓ Built semantic index (${count} files) → ${output}`);
    return;
  }

  if (command === 'search') {
    const query = rest.join(' ');
    if (!query) {
      console.error('Please provide a search query.');
      process.exit(1);
    }

    const results = await search(query, { limit: 5 });
    console.log(`Query: ${query}`);
    results.forEach((r, idx) => {
      console.log(`\n${idx + 1}. ${r.path} (score: ${r.score.toFixed(2)})`);
      if (r.snippet) console.log(`   ${r.snippet}`);
    });
    return;
  }

  console.error('Unknown command. Use "build" or "search".');
  process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  buildIndex,
  search,
  searchForTask,
  buildQueryFromTask,
  ensureIndex,
};
