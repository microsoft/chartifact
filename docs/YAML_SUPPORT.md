# YAML Support

The chartifact markdown package now supports YAML as an alternative to JSON in all plugin blocks.

## Quick Start

Instead of using `json` prefix, you can now use `yaml`:

```yaml vega-lite
$schema: "https://vega.github.io/schema/vega-lite/v5.json"
description: "A simple bar chart"
data:
  values:
    - category: "A"
      amount: 28
    - category: "B" 
      amount: 55
mark: "bar"
encoding:
  x:
    field: "category"
    type: "nominal"
  y:
    field: "amount"
    type: "quantitative"
```

## Supported Formats

All plugins support both JSON and YAML:
- `yaml vega` / `json vega`
- `yaml vega-lite` / `json vega-lite`  
- `yaml textbox` / `json textbox`
- `yaml slider` / `json slider`
- `yaml dropdown` / `json dropdown`
- `yaml checkbox` / `json checkbox`
- And all other plugins...

## Benefits

- More readable and concise syntax
- Better for complex nested structures
- Familiar format for configuration files
- Full backward compatibility with JSON

See the [full documentation](./yaml-support-docs.md) for detailed examples and migration guide.