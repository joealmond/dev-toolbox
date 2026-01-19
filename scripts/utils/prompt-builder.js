const defaultTitle = 'Task';

/**
 * Build a comprehensive prompt for kodu from the task details.
 * Supports spec-driven and standard tasks, and optionally enriches with search results.
 */
function buildPrompt(frontMatter = {}, body = '', searchResults = []) {
  const isSpec = frontMatter.spec && frontMatter.spec.enabled === true;
  const title = frontMatter.title || defaultTitle;
  let prompt = '';

  if (isSpec) {
    prompt += `# Spec: ${title}\n\n`;

    if (Array.isArray(frontMatter.spec?.requirements) && frontMatter.spec.requirements.length) {
      prompt += '## Requirements\n';
      frontMatter.spec.requirements.forEach((req, idx) => {
        prompt += `${idx + 1}. ${req}\n`;
      });
      prompt += '\n';
    }

    const arch = frontMatter.spec?.architecture || {};
    if (arch.components || arch.integrations || arch.decisions) {
      prompt += '## Architecture Context\n';

      if (Array.isArray(arch.components) && arch.components.length) {
        prompt += '### Components\n';
        arch.components.forEach((comp) => { prompt += `- ${comp}\n`; });
        prompt += '\n';
      }
      if (Array.isArray(arch.integrations) && arch.integrations.length) {
        prompt += '### Integrations\n';
        arch.integrations.forEach((int) => { prompt += `- ${int}\n`; });
        prompt += '\n';
      }
      if (arch.decisions) {
        prompt += `### Key Decisions\n${arch.decisions}\n\n`;
      }
    }
  } else {
    prompt += `# ${title}\n\n`;
    if (frontMatter.description) {
      prompt += `## Description\n${frontMatter.description}\n\n`;
    }
  }

  if (Array.isArray(frontMatter.acceptanceCriteria) && frontMatter.acceptanceCriteria.length) {
    prompt += '## Acceptance Criteria\n';
    frontMatter.acceptanceCriteria.forEach((criterion, idx) => {
      prompt += `${idx + 1}. ${criterion}\n`;
    });
    prompt += '\n';
  }

  if (!isSpec) {
    if (Array.isArray(frontMatter.dependencies) && frontMatter.dependencies.length) {
      prompt += '## Dependencies\n';
      prompt += `This task depends on: ${frontMatter.dependencies.join(', ')}\n\n`;
    }
    if (Array.isArray(frontMatter.labels) && frontMatter.labels.length) {
      prompt += '## Labels\n';
      prompt += `${frontMatter.labels.join(', ')}\n\n`;
    }
    if (frontMatter.priority) {
      prompt += `## Priority\n${frontMatter.priority}\n\n`;
    }
    if (frontMatter.estimatedHours) {
      prompt += `## Estimated Time\n${frontMatter.estimatedHours} hours\n\n`;
    }
  }

  if (searchResults && searchResults.length) {
    prompt += '## Related Context (from repository search)\n';
    searchResults.slice(0, 5).forEach((result, idx) => {
      const score = typeof result.score === 'number' ? result.score.toFixed(2) : 'n/a';
      prompt += `${idx + 1}. ${result.path} (score: ${score})\n`;
      if (result.snippet) {
        prompt += `   Snippet: ${result.snippet}\n`;
      }
      prompt += '\n';
    });
  }

  if (body && body.trim()) {
    prompt += isSpec ? `## Implementation Notes\n${body}\n\n` : `## Additional Details\n${body}\n\n`;
  }

  prompt += '## Instructions\n';
  if (isSpec) {
    prompt += 'Implement this specification according to the requirements and architecture above. ';
    prompt += 'Ensure all acceptance criteria are met. Follow the architecture decisions and use the specified components/integrations. ';
  } else {
    prompt += 'Implement this task according to the description and acceptance criteria above. ';
    prompt += 'Make sure all acceptance criteria are met. ';
  }
  prompt += 'Write clean, well-documented, and tested code. Follow best practices and coding standards.\n';

  return prompt;
}

module.exports = { buildPrompt };
