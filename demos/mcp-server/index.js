#!/usr/bin/env node
/**
 * Example MCP Server for Chartifact
 * 
 * This server demonstrates how to use Chartifact as an MCP App
 * to provide interactive visualizations and dashboards.
 * 
 * Usage:
 *   node index.js
 * 
 * Or add to your MCP client configuration (e.g., Claude Desktop):
 * {
 *   "mcpServers": {
 *     "chartifact-example": {
 *       "command": "node",
 *       "args": ["/path/to/this/index.js"]
 *     }
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Sample data for demonstrations
const sampleSalesData = [
  { month: 'Jan', revenue: 45000, expenses: 32000 },
  { month: 'Feb', revenue: 52000, expenses: 35000 },
  { month: 'Mar', revenue: 48000, expenses: 33000 },
  { month: 'Apr', revenue: 61000, expenses: 38000 },
  { month: 'May', revenue: 55000, expenses: 36000 },
  { month: 'Jun', revenue: 67000, expenses: 40000 },
];

// Create the MCP server
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

// Tool: Create a simple chart
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'create_chart',
        description: 'Create an interactive chart visualization using Chartifact',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title for the chart',
            },
            data: {
              type: 'array',
              description: 'Array of data objects to visualize',
              items: { type: 'object' },
            },
            chartType: {
              type: 'string',
              enum: ['bar', 'line', 'point', 'area'],
              description: 'Type of chart to create',
            },
            xField: {
              type: 'string',
              description: 'Field name for x-axis',
            },
            yField: {
              type: 'string',
              description: 'Field name for y-axis',
            },
          },
          required: ['title', 'data', 'xField', 'yField'],
        },
      },
      {
        name: 'create_dashboard',
        description: 'Create an interactive dashboard with multiple visualizations',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title for the dashboard',
            },
            useSampleData: {
              type: 'boolean',
              description: 'Use sample sales data for demonstration',
              default: true,
            },
          },
          required: ['title'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'create_chart') {
    const { title, data, chartType = 'bar', xField, yField } = args;

    // Create Chartifact markdown with chart specification
    const markdown = `# ${title}

\`\`\`json chartifact
{
  "type": "chart",
  "chartKey": "mainChart"
}
\`\`\`

\`\`\`json chartifact
{
  "type": "resource",
  "resourceType": "charts",
  "resourceKey": "mainChart",
  "spec": {
    "data": { "values": ${JSON.stringify(data)} },
    "mark": "${chartType}",
    "encoding": {
      "x": { "field": "${xField}", "type": "nominal", "axis": { "labelAngle": 0 } },
      "y": { "field": "${yField}", "type": "quantitative" }
    },
    "width": "container",
    "height": 400
  }
}
\`\`\`

Created ${chartType} chart with ${data.length} data points.
`;

    return {
      content: [
        {
          type: 'text',
          text: `Created interactive ${chartType} chart with ${data.length} data points.`,
        },
        {
          type: 'resource',
          resource: {
            uri: 'https://microsoft.github.io/chartifact/view/?mcp',
            mimeType: 'application/x-chartifact+markdown',
            text: markdown,
          },
        },
      ],
    };
  }

  if (name === 'create_dashboard') {
    const { title, useSampleData = true } = args;
    const data = useSampleData ? sampleSalesData : [];

    // Create a comprehensive dashboard
    const markdown = `# ${title}

## Key Metrics

\`\`\`json chartifact
{
  "type": "group",
  "style": "display: grid; grid-template-columns: repeat(3, 1fr); gap: 1em; margin: 1em 0;"
}
\`\`\`

\`\`\`json chartifact
{
  "type": "text",
  "content": "### Total Revenue\\n**$${data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}**"
}
\`\`\`

\`\`\`json chartifact
{
  "type": "text",
  "content": "### Total Expenses\\n**$${data.reduce((sum, d) => sum + d.expenses, 0).toLocaleString()}**"
}
\`\`\`

\`\`\`json chartifact
{
  "type": "text",
  "content": "### Net Profit\\n**$${data.reduce((sum, d) => sum + (d.revenue - d.expenses), 0).toLocaleString()}**"
}
\`\`\`

\`\`\`json chartifact
{
  "type": "endgroup"
}
\`\`\`

## Revenue vs Expenses

\`\`\`json chartifact
{
  "type": "chart",
  "chartKey": "revenueChart"
}
\`\`\`

\`\`\`json chartifact
{
  "type": "resource",
  "resourceType": "charts",
  "resourceKey": "revenueChart",
  "spec": {
    "data": { "values": ${JSON.stringify(data)} },
    "transform": [
      { "fold": ["revenue", "expenses"], "as": ["category", "amount"] }
    ],
    "mark": "bar",
    "encoding": {
      "x": { "field": "month", "type": "nominal", "axis": { "labelAngle": 0 } },
      "y": { "field": "amount", "type": "quantitative", "title": "Amount ($)" },
      "color": { "field": "category", "type": "nominal", "scale": { "range": ["#4CAF50", "#F44336"] } },
      "xOffset": { "field": "category" }
    },
    "width": "container",
    "height": 300
  }
}
\`\`\`

## Monthly Trends

\`\`\`json chartifact
{
  "type": "chart",
  "chartKey": "trendChart"
}
\`\`\`

\`\`\`json chartifact
{
  "type": "resource",
  "resourceType": "charts",
  "resourceKey": "trendChart",
  "spec": {
    "data": { "values": ${JSON.stringify(data)} },
    "transform": [
      { "fold": ["revenue", "expenses"], "as": ["category", "amount"] }
    ],
    "mark": { "type": "line", "point": true },
    "encoding": {
      "x": { "field": "month", "type": "nominal", "axis": { "labelAngle": 0 } },
      "y": { "field": "amount", "type": "quantitative", "title": "Amount ($)" },
      "color": { "field": "category", "type": "nominal", "scale": { "range": ["#4CAF50", "#F44336"] } }
    },
    "width": "container",
    "height": 250
  }
}
\`\`\`

---
*Dashboard generated with Chartifact MCP Apps*
`;

    return {
      content: [
        {
          type: 'text',
          text: `Created interactive dashboard "${title}" with ${data.length} months of data.`,
        },
        {
          type: 'resource',
          resource: {
            uri: 'https://microsoft.github.io/chartifact/view/?mcp',
            mimeType: 'application/x-chartifact+markdown',
            text: markdown,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Chartifact MCP Server started');
