# Copilot Instructions for Chartifact

Welcome to the Chartifact codebase! This document provides essential guidance for AI coding agents to be productive in this repository. Chartifact is a low-code framework for creating interactive, data-driven documents such as dashboards, reports, and presentations. Below are the key aspects to understand:

## Big Picture Architecture

Chartifact consists of several interoperating modules:

1. **Document Schema**: Defines plugins and components that communicate via reactive variables. Key components include:
   - **Text**: Markdown with dynamic placeholders.
   - **Inputs**: Textboxes, checkboxes, sliders, dropdowns.
   - **Tables**: Sortable, selectable, and editable data grids.
   - **Charts**: Vega and Vega-Lite visualizations.
   - **Diagrams**: Mermaid diagrams, including data-driven generation.
   - **Images**: Dynamic image URLs based on variables.
   - **Presets**: Named sets of variable values for quick scenario switching.

2. **Sandboxed Runtime**: Securely renders documents in isolated environments.

3. **VS Code Extension**: Provides tools for editing, previewing, and exporting documents.

4. **Web-Based Viewer and Editor**: Enables quick edits and sharing.

5. **Export Tools**: Generate standalone HTML documents for sharing or embedding.

## Developer Workflows

### Build
- For now, don't build. We can add this later.

### Testing
- Currently we don't have much test coverage. We can add this later.

## Project-Specific Conventions

1. **File Formats**:
   - `.idoc.md`: Markdown format for human-readable documents.
   - `.idoc.json`: JSON format for structured, programmatic generation. This is compiled to markdown.

3. **Styling**:
   - Use standard CSS for styling documents. Examples are provided for articles, dashboards, and slides.

4. **Security**:
   - Documents are rendered in sandboxed iframes.
   - No custom JavaScript execution or raw HTML in Markdown.

## Examples

- Source code for examples is in the packages/web-deploy/json folder
- Examples in this repo use the json format and are compiled to markdown.
- If you are asked to create an example, do it in the packages/web-deploy/json folder, do not modify the destination folder docs/assets/examples - this will be populated by a build.
- The examples are built manually for now.

## Runtime host

- There is a sandboxed runtime that securely renders documents available at https://microsoft.github.io/chartifact/view
- The url above can accept a `load` parameter to specify the document to render, for example https://microsoft.github.io/chartifact/view/?load=https://raw.githubusercontent.com/microsoft/chartifact/562d086/packages/web-deploy/json/sales-dashboard.idoc.json
- If you are asked to create an example, please provide a link in the PR comments so it can be previewed.
