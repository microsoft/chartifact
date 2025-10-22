# Variable.loader Migration Guide

This document explains the new `Variable.loader` property and how to migrate from the deprecated `dataLoaders` array.

## Overview

The `dataLoaders` array is now deprecated in favor of the `Variable.loader` property. This change makes the schema more consistent - data is now loaded directly into variables, which is how it works at runtime anyway.

## Key Changes

### Before (Deprecated)
```json
{
  "dataLoaders": [
    {
      "dataSourceName": "myData",
      "type": "inline",
      "format": "csv",
      "content": ["..."],
      "dataFrameTransformations": [...]
    }
  ],
  "variables": []
}
```

### After (New Pattern)
```json
{
  "variables": [
    {
      "variableId": "myData",
      "type": "object",
      "isArray": true,
      "initialValue": [],
      "loader": {
        "type": "inline",
        "format": "csv",
        "content": ["..."]
      },
      "calculation": {
        "dataSourceNames": ["myData"],
        "dataFrameTransformations": [...]
      }
    }
  ]
}
```

## Benefits of the New Pattern

1. **Clearer Semantics**: Data loading is now directly associated with the variable
2. **Separation of Concerns**: The loader handles data loading, calculations handle transformations
3. **Consistency**: Variables are the runtime entities, so loading data into them is more intuitive
4. **Less Duplication**: No need to specify both a dataSourceName and create a variable

## Loader Types

The `Variable.loader` property supports three types (note: no `spec` type):

### 1. Inline Data (`LoaderInline`)
```json
{
  "variableId": "products",
  "type": "object",
  "isArray": true,
  "initialValue": [],
  "loader": {
    "type": "inline",
    "format": "csv",  // or "json", "tsv", "dsv"
    "content": [
      "name,price,stock",
      "Widget,10.99,100",
      "Gadget,24.99,50"
    ]
  }
}
```

### 2. URL-based Data (`LoaderByDynamicURL`)
```json
{
  "variableId": "apiData",
  "type": "object",
  "isArray": true,
  "initialValue": [],
  "loader": {
    "type": "url",
    "format": "json",
    "url": "https://api.example.com/data"
  }
}
```

Dynamic URLs with template variables:
```json
{
  "variableId": "filteredData",
  "type": "object",
  "isArray": true,
  "initialValue": [],
  "loader": {
    "type": "url",
    "format": "json",
    "url": "https://api.example.com/data?category={{selectedCategory}}"
  }
}
```

### 3. File Upload (`LoaderByFile`)
```json
{
  "variableId": "uploadedData",
  "type": "object",
  "isArray": true,
  "initialValue": [],
  "loader": {
    "type": "file",
    "format": "csv",
    "filename": "data.csv",
    "content": "..."
  }
}
```

## Important: Transforms Go in Calculations

**Key Difference**: The `loader` property does NOT support `dataFrameTransformations`. Transforms must be specified in the variable's `calculation` property instead.

### Example: Variable with Loader and Transforms

```json
{
  "variables": [
    {
      "variableId": "rawSales",
      "type": "object",
      "isArray": true,
      "initialValue": [],
      "loader": {
        "type": "inline",
        "format": "csv",
        "content": ["product,revenue\nWidget,1000\nGadget,500"]
      }
    },
    {
      "variableId": "highRevenueSales",
      "type": "object",
      "isArray": true,
      "initialValue": [],
      "calculation": {
        "dataSourceNames": ["rawSales"],
        "dataFrameTransformations": [
          {
            "type": "filter",
            "expr": "datum.revenue > 750"
          }
        ]
      }
    }
  ]
}
```

## Migration Steps

1. **For each dataLoader:**
   - Create a new Variable with the same name as the `dataSourceName`
   - Set `type: "object"` and `isArray: true`
   - Set `initialValue: []`
   
2. **Move the loader content:**
   - Copy all properties EXCEPT `dataSourceName` and `dataFrameTransformations`
   - Place them in the variable's `loader` property

3. **Move transforms (if any):**
   - If the dataLoader had `dataFrameTransformations`, create a `calculation` object
   - Set `dataSourceNames` to reference the same variable
   - Move the transforms to `calculation.dataFrameTransformations`

4. **Remove the dataLoader** from the `dataLoaders` array

## Validation Rules

Variables with loaders must:
- Have `type: "object"` and `isArray: true`
- Have a valid loader type (`inline`, `url`, or `file`)
- NOT have `dataFrameTransformations` on the loader itself
- Use `Variable.calculation.dataFrameTransformations` for any transforms

## Examples

See the test examples in `packages/web-deploy/json/`:
- `test-variable-loader.idoc.json` - Basic example with inline CSV
- `test-variable-loader-transforms.idoc.json` - Example with transforms in calculation

## Backward Compatibility

The old `dataLoaders` array is still supported for backward compatibility but is marked as `@deprecated`. It will be removed in a future version. We recommend migrating to the new pattern as soon as possible.

## Questions?

If you have questions about the migration, please file an issue on the GitHub repository.
