```
    A     I
C H A   T
C H A R T
    A R T I F A C T
C H A R T I F A C T
```
# Chartifact

**Declarative, interactive data documents**

Chartifact is a low-code document format for creating interactive, data-driven pages such as reports, dashboards, and presentations. It travels like a document and works like a mini app. Designed for use with your LLM to produce a shareable artifact of your analytic conversations.

&bull; [Examples](https://microsoft.github.io/chartifact/examples) &bull; [Try with Copilot in VsCode](https://marketplace.visualstudio.com/items?itemName=msrvida.chartifact)

## Ecosystem

The Chartifact GitHub repo has source code for these interoperating modules:

* A **document schema** that defines plugins and components that communicate together with reactive variables:

  * **Text** – Markdown with dynamic placeholders
  * **Inputs** – Textboxes, checkboxes, sliders, dropdowns
  * **Tables** – Sortable, selectable, and editable data grids
  * **Charts** – [Vega](https://vega.github.io/vega/) and [Vega-Lite](https://vega.github.io/vega-lite/) visualizations
  * **Diagrams** – [Mermaid](https://mermaid-js.github.io/mermaid/) diagrams (flowcharts, networks, and more) via the mermaid plugin, including tabular data-driven diagram generation
  * **Images** – Dynamic image URLs based on variables
  * **Presets** – Named sets of variable values for quick scenario switching

* A **sandboxed runtime** that securely renders documents.

* A [set of examples](https://microsoft.github.io/chartifact/examples) that your LLM can understand and remix for your scenario.

* A [VS Code extension](https://marketplace.visualstudio.com/items?itemName=msrvida.chartifact) for editing, previewing, and exporting documents.

* A [web-based viewer and editor](https://microsoft.github.io/chartifact/view/) for viewing, quick edits and sharing.

* Tools to **export standalone HTML** documents you can share or embed anywhere.

## Authoring Formats

Chartifact documents can be written in two formats:

* **Markdown** – Human-readable, easy to write and review. Interactive elements are embedded as fenced JSON blocks.
* **JSON** – Structured and precise. Ideal for programmatic generation or when working directly with the document schema.

Both formats are functionally equivalent and supported across all tooling.

## AI Support

The format is designed with AI assistance in mind:

* Structured syntax makes documents easy to edit and generate with LLMs
* In-editor tools like Ctrl+I and agent mode available in VS Code
* HTML exports retain semantic structure for downstream AI tools

This enables both authoring and remixing workflows with language models and agent-based tooling.

## Data Flow

The document runtime is reactive. Components stay in sync through a shared set of variables:

* **Reactive variables** update elements and data sources automatically
* **Dynamic bindings** let variables appear in chart specs, text, URLs, and API calls
* **REST integration** supports fetching data from external sources
* **Vega transforms** provide built-in tools for reshaping data
* **Signal bus** coordinates state across all components

## Styling

Styling is done using standard CSS. Examples provided to style documents as articles, dashboards, or slides.

## Security

Chartifact is designed to be safe by default:

* Rendered in sandboxed iframes to isolate execution
* No custom JavaScript execution
* No raw HTML in Markdown
* XSS-Defensive CSS parsing
