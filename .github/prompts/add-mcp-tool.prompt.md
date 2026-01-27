---
description: Add a new MCP tool to the dev-toolbox server
mode: agent
tools: ['editFiles', 'search', 'readFile']
---

# Add New MCP Tool

Add a new tool to the MCP server (`scripts/mcp-server.js`) for VS Code integration.

## Tool Information Needed

1. **Tool name** - snake_case identifier (e.g., `my_new_tool`)
2. **Description** - What the tool does
3. **Input parameters** - JSON schema for inputs
4. **Return value** - What the tool returns
5. **Implementation** - The logic to execute

## Steps I Will Perform

1. Add tool definition to the `tools` array in `mcp-server.js`
2. Add handler implementation in the handlers section
3. Update `config.json` mcp.tools list
4. Update documentation in `docs/api/MCP-TOOLS.md`

## Tool Definition Format

```javascript
{
  name: 'tool_name',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description',
      },
    },
    required: ['param1'],
  },
}
```

## Handler Format

```javascript
case 'tool_name': {
  const { param1 } = args;
  // Implementation logic
  return {
    content: [{ type: 'text', text: 'Result message' }],
  };
}
```

## Reference Files

- [scripts/mcp-server.js](scripts/mcp-server.js) - Existing tools
- [docs/api/MCP-TOOLS.md](docs/api/MCP-TOOLS.md) - Documentation
- [config.json](config.json) - Configuration
