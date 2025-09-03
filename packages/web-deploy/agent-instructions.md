# Agent Instructions for Chartifact Examples

## Overview

This folder is a collection of data-driven documentation and visualization examples, organized for use with the Chartifact system. The files are structured to demonstrate features, data sources, and visualization patterns using both JSON and Markdown formats.

## Key Directories

- `chartifact-examples/json/`: Source data and configuration files for Chartifact, using `.idoc.json` format.
- `chartifact-examples/markdown/`: Human-readable documentation and examples, mirroring the JSON files, using `.idoc.md` format.
- `chartifact-examples/schema/`: Contains the JSON schema (`idoc_v1.json`) and TypeScript definitions (`idoc_v1.d.ts`) for the `.idoc` document format.

## Patterns and Conventions

- Each example or feature is represented in both JSON and Markdown, with matching filenames and directory structure.
- Features are grouped under `features/`, and scenario-based examples (e.g., `seattle-weather/`) are grouped by topic.
- The `.idoc.json` files conform to the schema in `schema/idoc_v1.json`. Validate new or edited JSON files against this schema.
- Markdown files (`.idoc.md`) are intended for human consumption and may include narrative, code snippets, and visualization descriptions.

## Developer Workflows

- The `chartifact-examples` directory is intended to be a read-only reference for developers working with the Chartifact system.
- Developers should not modify files directly in this directory; instead, they should use these as examples to give to the agent.

## Key tips

Plugins: these are markdown blocks denoted by triple backticks. In Chartifact, some of these these have both a serialization format (like json or yaml) followed by a plugin name. For example: 

```json vega
{
    "description": "Having 'vega' in the plugin block is critical, otherwise it is simply json which will not be interactive."
}
```
