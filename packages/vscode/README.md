# Chartifact

**Declarative, interactive data documents**

Chartifact is a low-code document format for creating interactive, data-driven pages such as reports, dashboards, and presentations. It travels like a document and works like an app. Designed for use with your LLM to produce a shareable artifact of your analytic conversations.

## Features

This extension works with two file formats: `*.idoc.md` and `*.idoc.json`.

### Unzip samples
- **Explorer View**: Right-click on a folder and select "Create Chartifact Examples Folder". This will create a folder of examples that you and your agent can use for reference when creating your own document.

### Create Documents
- **Explorer View**: Right-click on a folder and select "New Chartifact Interactive Document (JSON)" or "New Chartifact Interactive Document (Markdown)".

### Preview Documents
- **Explorer View**: Right-click on a `*.idoc.md` or `*.idoc.json` file and select "Preview Chartifact Interactive Document".
- **Editor Title Bar**: Open a document and select "Preview Chartifact Interactive Document (Split View)" for side-by-side editing and previewing.

### Convert Documents
- **Explorer View**: Convert between formats:
  - "Convert to HTML" for sharing standalone files.
  - "Convert to Markdown" for easier collaboration.

These features make it simple to create, preview, edit, and share interactive documents directly within VS Code.

## AI Assist

Chartifact documents are a natural fit for Copilot to help you with creating, remixing and editing. Try these ways of leveraging AI:
* CTRL + I : Inside a document with a chart, ask Copilot to `make this bar chart into a pie chart`.
* Agent mode: Add some Python code to your context, then ask Copilot to `Look at this REST API and make an interactive document to explore the functionality`.