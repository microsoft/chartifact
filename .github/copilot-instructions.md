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
   - **NO HTML elements are allowed** - use only Markdown formatting.
   - No custom JavaScript execution or raw HTML in Markdown.
   - For layouts and styling, use only CSS classes applied to groups and standard Markdown elements.

## Component Capabilities and Constraints

1. **Dropdown Components**:
   - Dropdown options must be strings only, not objects
   - Use simple string arrays for options: `"options": ["Option1", "Option2"]`
   - For data-driven options, use `dynamicOptions` with a data source. See `docs\assets\examples\json\features\7.dropdown.idoc.json`

2. **Chart Components**:
   - Place chart specifications in the `resources.charts` section
   - Reference charts using `{"type": "chart", "chartKey": "yourChartKey"}`

3. **Tabulator Components (Critical)**:
   - **ALWAYS add responsive CSS for grid containers**: Use `min-width: 0` and `overflow: hidden` for grid areas containing tabulators
   - This prevents tabulator measurement errors that cause infinite growth and call stack overflow
   - Example: `"#table { grid-area: table; min-width: 0; overflow: hidden; }"`
   - Also include: `".tabulator { max-width: 100%; overflow: auto; }"` and `".tabulator .tabulator-table { min-width: fit-content; }"`

## Examples

- Source code for examples is in the `packages/web-deploy/json` folder
- Examples in this repo use the json format and are compiled to markdown.
- If you are asked to create an example, do it in the `packages/web-deploy/json` folder, do not modify the destination folder `docs/assets/examples` - this will be populated by a build.
- **IMPORTANT**: NO HTML elements are allowed.
- Validate the json against the TypeScript schema declaration of InteractiveDocumentWithSchema in `docs\schema\idoc_v1.d.ts`
- After you know it validates statically, validate dynamically. See `packages\compiler\test\validate.mjs`


## Smoke Test

- After creating or modifying examples, always run a smoke test to ensure they render correctly.
- Use the `packages\html-wrapper\test\example.mjs` script to generate an HTML file from your JSON example.
- Open the generated HTML file in a browser to verify that:
   - There are no console errors or warnings
   - All components render correctly
   - Interactive elements function as expected
- If issues are found, fix them before finalizing your changes.
- Attach the smoke screenshot to your PR for verification.

## Runtime host

If the agent is run in the cloud:
   - There is a sandboxed runtime that securely renders documents available at https://microsoft.github.io/chartifact/view
   - The url above can accept a `load` parameter to specify the document to render, for example https://microsoft.github.io/chartifact/view/?load=https://raw.githubusercontent.com/microsoft/chartifact/562d086/packages/web-deploy/json/sales-dashboard.idoc.json
   - **ALWAYS provide a preview link when creating or modifying examples** - include the preview link in PR comments and descriptions automatically so examples can be tested immediately without being asked.

If the agent is run locally:
   - the user can preview documents using the VS Code extension.
