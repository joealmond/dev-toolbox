#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');

const { buildIndex, ensureIndex, search } = require('./semantic-indexer');
const config = require('../config.json');

(async () => {
  try {
    console.log('[TEST] Building semantic index...');
    const { count, indexFile } = await buildIndex();
    assert.ok(count >= 0, 'Index should report a non-negative file count');
    const exists = await fs.access(indexFile).then(() => true).catch(() => false);
    assert.ok(exists, 'Index file should exist after build');
    console.log(`[TEST] Index built with ${count} files at ${indexFile}`);

    console.log('[TEST] Loading semantic index...');
    const index = await ensureIndex();
    assert.ok(index, 'ensureIndex should return an index instance');
    console.log('[TEST] Index loaded successfully');

    const sampleQuery = 'ticket';
    console.log(`[TEST] Searching for "${sampleQuery}"...`);
    const results = await search(sampleQuery, { limit: 3 });
    assert.ok(Array.isArray(results), 'Search should return an array');
    if (results.length > 0) {
      const top = results[0];
      assert.ok(top.path, 'Search result should include path');
      console.log(`[TEST] Got ${results.length} result(s), top hit: ${top.path}`);
    } else {
      console.log('[TEST] No results found (acceptable if corpus lacks the query)');
    }

    console.log('[TEST] Semantic search smoke test passed.');
    process.exit(0);
  } catch (error) {
    console.error('[TEST] Semantic search smoke test failed:', error.message);
    process.exit(1);
  }
})();
