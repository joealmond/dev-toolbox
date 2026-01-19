#!/usr/bin/env node

/**
 * Semantic search CLI tool
 * Query the semantic index for relevant code/docs
 */

const { search } = require('./semantic-indexer');
const Table = require('table').table;

async function main() {
  const [, , ...args] = process.argv;

  if (args.length === 0) {
    console.error('Usage: node scripts/query-search.js <query> [--limit N]');
    process.exit(1);
  }

  const query = args[0];
  let limit = 5;

  // Parse --limit flag
  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limit = parseInt(args[limitIndex + 1], 10);
  }

  try {
    console.log(`🔍 Searching for: "${query}"\n`);

    const results = await search(query, { limit });

    if (results.length === 0) {
      console.log('❌ No results found.');
      process.exit(0);
    }

    // Display results in table
    const tableData = [
      ['#', 'File', 'Score', 'Snippet'],
      ...results.map((result, index) => [
        String(index + 1),
        result.path,
        result.score.toFixed(2),
        result.snippet ? result.snippet.substring(0, 60) + '...' : 'N/A',
      ]),
    ];

    const output = Table(tableData, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        join: '┼',
      },
    });

    console.log(output);

    // Show full snippets
    console.log('\n📄 Full Snippets:\n');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.path}`);
      console.log(`   Score: ${result.score.toFixed(2)}`);
      if (result.snippet) {
        console.log(`\n   ${result.snippet}\n`);
      }
      console.log('---\n');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    process.exit(1);
  }
}

main();
