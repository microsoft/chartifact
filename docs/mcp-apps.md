# Chartifact MCP Apps Integration

Chartifact now supports the [Model Context Protocol (MCP) Apps](https://modelcontextprotocol.io) extension, allowing it to be embedded as an interactive UI component in MCP-compatible clients like Claude, VS Code, ChatGPT, and more.

## What is MCP Apps?

MCP Apps is an extension to the Model Context Protocol that enables tools and resources to provide rich, interactive UIs directly within AI assistants and other context-aware applications. Instead of plain text responses, tools can now deliver dashboards, data visualizations, forms, and other interactive components.

## Features

- **JSON-RPC 2.0 Protocol**: Full implementation of the MCP Apps communication protocol
- **Sandboxed Rendering**: Secure iframe-based rendering with strict isolation
- **Interactive Documents**: Support for both Markdown and JSON document formats
- **Real-time Updates**: Dynamic content updates through reactive variables
- **Data Visualization**: Charts, tables, diagrams, and more

## Quick Start

### Embedding Chartifact in Your MCP Server

The MCP-compatible viewer is hosted at:
```
https://microsoft.github.io/chartifact/view/?mcp
```

The viewer automatically detects MCP mode via the `?mcp` URL parameter and disables interactive features like clipboard, drag-drop, and file upload.

### Example MCP Server Configuration

**Security Note:** Always use the latest version of `@modelcontextprotocol/sdk` (1.25.2 or later) to ensure you have the latest security patches, including fixes for ReDoS vulnerabilities and DNS rebinding protection.

Here's a simple example of an MCP server that returns Chartifact documents:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'chartifact-example',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Example tool that returns a Chartifact visualization
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'visualize_data') {
    const data = request.params.arguments?.data || [];
    
    // Return an MCP Apps UI response
    return {
      content: [
        {
          type: 'ui',
          uri: 'https://microsoft.github.io/chartifact/view/?mcp',
          data: {
            method: 'ui/render',
            params: {
              title: 'Data Visualization',
              markdown: `# Data Visualization

\`\`\`json chartifact
{
  "type": "chart",
  "chartKey": "myChart"
}
\`\`\`

\`\`\`json chartifact
{
  "type": "resource",
  "resourceType": "charts",
  "resourceKey": "myChart",
  "spec": {
    "data": { "values": ${JSON.stringify(data)} },
    "mark": "bar",
    "encoding": {
      "x": { "field": "category", "type": "nominal" },
      "y": { "field": "value", "type": "quantitative" }
    }
  }
}
\`\`\`
`
            }
          }
        }
      ]
    };
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

### Using JSON Format

You can also send documents in JSON format:

```typescript
return {
  content: [
    {
      type: 'ui',
      uri: 'https://microsoft.github.io/chartifact/view/?mcp',
      data: {
        method: 'ui/render',
        params: {
          title: 'Sales Dashboard',
          interactiveDocument: {
            "$schema": "https://microsoft.github.io/chartifact/schema/idoc_v1.json",
            "metadata": {
              "title": "Sales Dashboard"
            },
            "components": [
              {
                "type": "text",
                "content": "# Sales Dashboard\n\nQuarterly revenue: **$1.2M**"
              }
            ]
          }
        }
      }
    }
  ]
};
```

## Protocol Details

### JSON-RPC Methods

The MCP viewer implements the following JSON-RPC 2.0 methods:

#### `initialize`
Initialize the connection with the MCP host.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "example-client",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "resources": true
    },
    "serverInfo": {
      "name": "chartifact-viewer",
      "version": "1.0.0"
    }
  }
}
```

#### `ui/render`
Render a Chartifact document (markdown or JSON format).

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "ui/render",
  "params": {
    "title": "My Document",
    "markdown": "# Hello World\n\nThis is a Chartifact document."
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "success": true
  }
}
```

#### `ui/get-content`
Get information about currently displayed content.

#### `ui/clear`
Clear the current content and reset the viewer.

### Notifications

#### `ui/ready`
Sent by the viewer when it's ready to receive content.

```json
{
  "jsonrpc": "2.0",
  "method": "ui/ready",
  "params": {
    "capabilities": {
      "formats": ["markdown", "json"],
      "interactive": true
    }
  }
}
```

#### `ui/update`
Notification from host to update content without waiting for response.

#### `ui/content-mode`
Sent by viewer to notify host about content format (markdown/json).

## Security

The MCP viewer is designed with security in mind:

- **Sandboxed Rendering**: All content is rendered in isolated iframes
- **No Custom JavaScript**: No execution of user-provided JavaScript
- **Origin Validation**: Can be configured to only accept messages from trusted origins
- **XSS Protection**: Defensive CSS parsing and no raw HTML in Markdown

## Examples

Check out example MCP servers and documents:
- [Basic Example Server](examples/mcp-server-basic.js)
- [Data Visualization Server](examples/mcp-server-viz.js)
- [Dashboard Server](examples/mcp-server-dashboard.js)

## Resources

- [MCP Apps Documentation](https://modelcontextprotocol.io)
- [Chartifact Documentation](https://microsoft.github.io/chartifact/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](../LICENSE) for details.
