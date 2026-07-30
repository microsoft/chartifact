# Chartifact MCP Server Example

This is an example MCP (Model Context Protocol) server that demonstrates how to use Chartifact as an interactive UI component in MCP-compatible clients.

## Security Note

This example uses `@modelcontextprotocol/sdk` version 1.25.2 or later, which includes important security fixes:
- ReDoS vulnerability fix (CVE addressed in 1.25.2)
- DNS rebinding protection (fixed in 1.24.0)

Always use the latest version of the SDK in production deployments.

## Features

- **Interactive Charts**: Create bar charts, line charts, and more
- **Dashboards**: Build multi-panel dashboards with multiple visualizations
- **Real-time Data**: Pass data from your MCP tools to create visualizations
- **Fully Interactive**: Users can interact with charts, zoom, pan, and explore data

## Installation

```bash
npm install
```

## Usage

### Command Line

Run the server directly:

```bash
npm start
```

### With Claude Desktop

Add to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "chartifact": {
      "command": "node",
      "args": ["/absolute/path/to/this/directory/index.js"]
    }
  }
}
```

Then restart Claude Desktop.

### With Other MCP Clients

Follow your MCP client's documentation for adding custom servers. Use:
- **Command**: `node`
- **Args**: `["/path/to/index.js"]`

## Available Tools

### `create_chart`

Create an interactive chart from your data.

**Parameters:**
- `title` (string): Title for the chart
- `data` (array): Array of data objects
- `chartType` (string): Type of chart ('bar', 'line', 'point', 'area')
- `xField` (string): Field name for x-axis
- `yField` (string): Field name for y-axis

**Example:**
```
Create a bar chart of sales data with months on x-axis and revenue on y-axis
```

### `create_dashboard`

Create a comprehensive dashboard with multiple visualizations.

**Parameters:**
- `title` (string): Title for the dashboard
- `useSampleData` (boolean): Use sample sales data for demonstration

**Example:**
```
Create a sales dashboard
```

## How It Works

1. When a tool is called, the server generates a Chartifact document (in Markdown format)
2. The document is returned as a resource with MIME type `application/x-chartifact+markdown`
3. The MCP client loads the Chartifact viewer (`https://microsoft.github.io/chartifact/view/?mcp`)
4. The viewer receives the document via JSON-RPC 2.0 protocol and renders it interactively

## Customization

You can modify `index.js` to:
- Add more tool definitions
- Create custom visualizations
- Connect to your own data sources
- Build domain-specific dashboards

## Examples

### Simple Chart
```
User: Show me a chart of monthly revenue
AI: [calls create_chart with sample data]
```

### Dashboard
```
User: Create a financial dashboard
AI: [calls create_dashboard]
```

## Resources

- [Chartifact Documentation](https://microsoft.github.io/chartifact/)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Vega-Lite Documentation](https://vega.github.io/vega-lite/) (for chart specifications)

## License

MIT
