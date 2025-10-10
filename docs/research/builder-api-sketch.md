# Chartifact Document Builder API Sketch

**Date:** October 2025 (Revised)  
**Status:** API Design Proposal - Svelte Version

## Overview

This document sketches out the API for a lightweight transactional builder for Chartifact interactive documents. The builder provides:

1. **Immutable operations** - Each operation returns a new builder instance
2. **Type safety** - TypeScript types prevent schema violations
3. **Sensible defaults** - Documents start with working structure
4. **Chainable API** - Fluent interface for ergonomic usage
5. **Validation** - Errors caught at operation time, not render time
6. **Minimal surface area** - Generic operations only, no type-specific helpers to reduce maintenance overhead

## Core Builder Class

```typescript
import { 
  InteractiveDocument, 
  ElementGroup, 
  PageElement,
  InteractiveElement,
  DataLoader,
  Variable,
  PageStyle
} from '@microsoft/chartifact-schema';

/**
 * Immutable builder for creating and modifying Chartifact documents.
 * Each operation returns a new builder instance with the updated document.
 */
class ChartifactBuilder {
  private readonly doc: InteractiveDocument;

  constructor(initial?: Partial<InteractiveDocument>) {
    this.doc = this.createDefault(initial);
  }

  /**
   * Get the current document as a plain object
   */
  toJSON(): InteractiveDocument {
    return JSON.parse(JSON.stringify(this.doc));
  }

  /**
   * Get the current document as a JSON string
   */
  toString(): string {
    return JSON.stringify(this.doc, null, 2);
  }

  /**
   * Create a new builder from an existing document
   */
  static fromDocument(doc: InteractiveDocument): ChartifactBuilder {
    return new ChartifactBuilder(doc);
  }

  /**
   * Create a new builder from a JSON string
   */
  static fromJSON(json: string): ChartifactBuilder {
    return new ChartifactBuilder(JSON.parse(json));
  }

  // Note: File I/O operations (fromFile, toFile) are intentionally omitted.
  // These should be handled by a dedicated I/O MCP server or external utilities.
  // To save: write builder.toString() or builder.toJSON() to file
  // To load: read file and use ChartifactBuilder.fromJSON() or fromDocument()

  // Private helper to create default document structure
  private createDefault(partial?: Partial<InteractiveDocument>): InteractiveDocument {
    return {
      title: partial?.title || "New Document",
      groups: partial?.groups || [{
        groupId: 'main',
        elements: ['# Welcome\n\nStart building your interactive document.']
      }],
      dataLoaders: partial?.dataLoaders || [],
      variables: partial?.variables || [],
      style: partial?.style,
      resources: partial?.resources,
      notes: partial?.notes,
      ...partial
    };
  }

  // Private helper for immutable updates
  private clone(updates: Partial<InteractiveDocument>): ChartifactBuilder {
    return new ChartifactBuilder({
      ...this.doc,
      ...updates
    });
  }
}
```

## Document-Level Operations

```typescript
class ChartifactBuilder {
  // ... previous code ...

  /**
   * Get the document title
   */
  getTitle(): string {
    return this.doc.title;
  }

  /**
   * Set the document title
   */
  setTitle(title: string): ChartifactBuilder {
    return this.clone({ title });
  }

  /**
   * Get the CSS styles
   */
  getCSS(): string | string[] | undefined {
    return this.doc.style?.css;
  }

  /**
   * Set or update the CSS styles
   */
  setCSS(css: string | string[]): ChartifactBuilder {
    return this.clone({
      style: {
        ...this.doc.style,
        css
      }
    });
  }

  /**
   * Add CSS to existing styles
   */
  addCSS(css: string): ChartifactBuilder {
    const existingCSS = this.doc.style?.css || '';
    const newCSS = Array.isArray(existingCSS) 
      ? [...existingCSS, css]
      : [existingCSS, css];
    return this.setCSS(newCSS);
  }

  /**
   * Get Google Fonts configuration
   */
  getGoogleFonts(): GoogleFontsSpec | undefined {
    return this.doc.style?.googleFonts;
  }

  /**
   * Set Google Fonts configuration
   */
  setGoogleFonts(config: GoogleFontsSpec): ChartifactBuilder {
    return this.clone({
      style: {
        ...this.doc.style,
        css: this.doc.style?.css || '',
        googleFonts: config
      }
    });
  }

  /**
   * Get all notes
   */
  getNotes(): string[] {
    return this.doc.notes || [];
  }

  /**
   * Add a note to the document
   */
  addNote(note: string): ChartifactBuilder {
    return this.clone({
      notes: [...(this.doc.notes || []), note]
    });
  }

  /**
   * Clear all notes
   */
  clearNotes(): ChartifactBuilder {
    return this.clone({ notes: [] });
  }
}
```

## Group Operations

```typescript
class ChartifactBuilder {
  // ... previous code ...

  /**
   * Get all groups
   */
  getGroups(): ElementGroup[] {
    return [...this.doc.groups];
  }

  /**
   * Get a group by ID
   */
  getGroup(groupId: string): ElementGroup | undefined {
    return this.doc.groups.find(g => g.groupId === groupId);
  }

  /**
   * Check if a group exists
   */
  hasGroup(groupId: string): boolean {
    return this.doc.groups.some(g => g.groupId === groupId);
  }

  /**
   * Add a new group to the document
   */
  addGroup(groupId: string, elements: PageElement[] = []): ChartifactBuilder {
    // Validate groupId doesn't already exist
    if (this.doc.groups.some(g => g.groupId === groupId)) {
      throw new Error(`Group '${groupId}' already exists`);
    }

    return this.clone({
      groups: [
        ...this.doc.groups,
        { groupId, elements }
      ]
    });
  }

  /**
   * Insert a group at a specific index
   */
  insertGroup(index: number, groupId: string, elements: PageElement[] = []): ChartifactBuilder {
    if (this.doc.groups.some(g => g.groupId === groupId)) {
      throw new Error(`Group '${groupId}' already exists`);
    }

    const groups = [...this.doc.groups];
    groups.splice(index, 0, { groupId, elements });

    return this.clone({ groups });
  }

  /**
   * Remove a group by ID
   */
  deleteGroup(groupId: string): ChartifactBuilder {
    const groups = this.doc.groups.filter(g => g.groupId !== groupId);
    
    if (groups.length === this.doc.groups.length) {
      throw new Error(`Group '${groupId}' not found`);
    }

    return this.clone({ groups });
  }

  /**
   * Rename a group
   */
  renameGroup(oldGroupId: string, newGroupId: string): ChartifactBuilder {
    if (this.doc.groups.some(g => g.groupId === newGroupId)) {
      throw new Error(`Group '${newGroupId}' already exists`);
    }

    const groups = this.doc.groups.map(g => 
      g.groupId === oldGroupId 
        ? { ...g, groupId: newGroupId }
        : g
    );

    if (groups.every(g => g.groupId !== newGroupId)) {
      throw new Error(`Group '${oldGroupId}' not found`);
    }

    return this.clone({ groups });
  }

  /**
   * Move a group to a new position
   */
  moveGroup(groupId: string, toIndex: number): ChartifactBuilder {
    const fromIndex = this.doc.groups.findIndex(g => g.groupId === groupId);
    
    if (fromIndex === -1) {
      throw new Error(`Group '${groupId}' not found`);
    }

    const groups = [...this.doc.groups];
    const [group] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, group);

    return this.clone({ groups });
  }
}
```

## Element Operations

**Philosophy: Keep it svelte.** We provide only generic element operations. 
Type-specific helpers (addMarkdown, addChart, etc.) are intentionally omitted to minimize maintenance overhead.
Users should construct element objects directly and use the generic operations.

```typescript
class ChartifactBuilder {
  // ... previous code ...

  /**
   * Get all elements from a group
   */
  getElements(groupId: string): PageElement[] {
    const group = this.doc.groups.find(g => g.groupId === groupId);
    if (!group) {
      throw new Error(`Group '${groupId}' not found`);
    }
    return [...group.elements];
  }

  /**
   * Get a single element by index from a group
   */
  getElement(groupId: string, elementIndex: number): PageElement {
    const group = this.doc.groups.find(g => g.groupId === groupId);
    if (!group) {
      throw new Error(`Group '${groupId}' not found`);
    }
    if (elementIndex < 0 || elementIndex >= group.elements.length) {
      throw new Error(`Element index ${elementIndex} out of bounds in group '${groupId}'`);
    }
    return group.elements[elementIndex];
  }

  /**
   * Add an element to a group
   */
  addElement(groupId: string, element: PageElement): ChartifactBuilder {
    const groups = this.doc.groups.map(g => 
      g.groupId === groupId
        ? { ...g, elements: [...g.elements, element] }
        : g
    );

    if (groups === this.doc.groups) {
      throw new Error(`Group '${groupId}' not found`);
    }

    return this.clone({ groups });
  }

  /**
   * Add multiple elements to a group
   */
  addElements(groupId: string, elements: PageElement[]): ChartifactBuilder {
    const groups = this.doc.groups.map(g => 
      g.groupId === groupId
        ? { ...g, elements: [...g.elements, ...elements] }
        : g
    );

    if (groups === this.doc.groups) {
      throw new Error(`Group '${groupId}' not found`);
    }

    return this.clone({ groups });
  }

  /**
   * Insert an element at a specific index in a group
   */
  insertElement(groupId: string, index: number, element: PageElement): ChartifactBuilder {
    const groups = this.doc.groups.map(g => {
      if (g.groupId === groupId) {
        const elements = [...g.elements];
        elements.splice(index, 0, element);
        return { ...g, elements };
      }
      return g;
    });

    if (groups === this.doc.groups) {
      throw new Error(`Group '${groupId}' not found`);
    }

    return this.clone({ groups });
  }

  /**
   * Remove an element by index from a group
   */
  deleteElement(groupId: string, elementIndex: number): ChartifactBuilder {
    const groups = this.doc.groups.map(g => {
      if (g.groupId === groupId) {
        if (elementIndex < 0 || elementIndex >= g.elements.length) {
          throw new Error(`Element index ${elementIndex} out of bounds in group '${groupId}'`);
        }
        const elements = g.elements.filter((_, i) => i !== elementIndex);
        return { ...g, elements };
      }
      return g;
    });

    if (groups === this.doc.groups) {
      throw new Error(`Group '${groupId}' not found`);
    }

    return this.clone({ groups });
  }

  /**
   * Update an element at a specific index
   */
  updateElement(groupId: string, elementIndex: number, element: PageElement): ChartifactBuilder {
    const groups = this.doc.groups.map(g => {
      if (g.groupId === groupId) {
        if (elementIndex < 0 || elementIndex >= g.elements.length) {
          throw new Error(`Element index ${elementIndex} out of bounds in group '${groupId}'`);
        }
        const elements = [...g.elements];
        elements[elementIndex] = element;
        return { ...g, elements };
      }
      return g;
    });

    if (groups === this.doc.groups) {
      throw new Error(`Group '${groupId}' not found`);
    }

    return this.clone({ groups });
  }

  /**
   * Clear all elements from a group
   */
  clearElements(groupId: string): ChartifactBuilder {
    const groups = this.doc.groups.map(g => 
      g.groupId === groupId
        ? { ...g, elements: [] }
        : g
    );

    if (groups === this.doc.groups) {
      throw new Error(`Group '${groupId}' not found`);
    }

    return this.clone({ groups });
  }
}

// Example usage with generic operations:
// For markdown (string):
builder.addElement('main', '# Hello World')

// For a chart:
builder.addElement('main', { type: 'chart', chartKey: 'myChart' })

// For a checkbox:
builder.addElement('main', { type: 'checkbox', variableId: 'showDetails', label: 'Show Details' })

// For a slider:
builder.addElement('main', { type: 'slider', variableId: 'year', min: 2020, max: 2024, step: 1 })
```

## Data & Variable Operations

```typescript
class ChartifactBuilder {
  // ... previous code ...

  /**
   * Get all variables
   */
  getVariables(): Variable[] {
    return [...(this.doc.variables || [])];
  }

  /**
   * Get a specific variable by ID
   */
  getVariable(variableId: string): Variable | undefined {
    return this.doc.variables?.find(v => v.variableId === variableId);
  }

  /**
   * Add a variable to the document
   */
  addVariable(variable: Variable): ChartifactBuilder {
    // Validate variable ID doesn't already exist
    if (this.doc.variables?.some(v => v.variableId === variable.variableId)) {
      throw new Error(`Variable '${variable.variableId}' already exists`);
    }

    return this.clone({
      variables: [...(this.doc.variables || []), variable]
    });
  }

  /**
   * Update an existing variable
   */
  updateVariable(variableId: string, updates: Partial<Variable>): ChartifactBuilder {
    const variables = (this.doc.variables || []).map(v =>
      v.variableId === variableId
        ? { ...v, ...updates }
        : v
    );

    if (variables === this.doc.variables) {
      throw new Error(`Variable '${variableId}' not found`);
    }

    return this.clone({ variables });
  }

  /**
   * Remove a variable
   */
  deleteVariable(variableId: string): ChartifactBuilder {
    const variables = (this.doc.variables || []).filter(
      v => v.variableId !== variableId
    );

    if (variables.length === this.doc.variables?.length) {
      throw new Error(`Variable '${variableId}' not found`);
    }

    return this.clone({ variables });
  }

  /**
   * Get all data loaders
   */
  getDataLoaders(): DataLoader[] {
    return [...(this.doc.dataLoaders || [])];
  }

  /**
   * Get a specific data loader by name
   */
  getDataLoader(dataSourceName: string): DataLoader | undefined {
    return this.doc.dataLoaders?.find(
      dl => 'dataSourceName' in dl && dl.dataSourceName === dataSourceName
    );
  }

  /**
   * Add a data loader
   */
  addDataLoader(dataLoader: DataLoader): ChartifactBuilder {
    // Validate dataSourceName doesn't already exist
    const name = 'dataSourceName' in dataLoader ? dataLoader.dataSourceName : undefined;
    if (name && this.doc.dataLoaders?.some(dl => 'dataSourceName' in dl && dl.dataSourceName === name)) {
      throw new Error(`Data loader '${name}' already exists`);
    }

    return this.clone({
      dataLoaders: [...(this.doc.dataLoaders || []), dataLoader]
    });
  }

  /**
   * Remove a data loader
   */
  deleteDataLoader(dataSourceName: string): ChartifactBuilder {
    const dataLoaders = (this.doc.dataLoaders || []).filter(
      dl => !('dataSourceName' in dl) || dl.dataSourceName !== dataSourceName
    );

    if (dataLoaders.length === this.doc.dataLoaders?.length) {
      throw new Error(`Data loader '${dataSourceName}' not found`);
    }

    return this.clone({ dataLoaders });
  }
}
```

## Resources Operations

**Note:** Renamed from "Chart Resources" to just "Resources" for generality.
Resources can contain charts and potentially other types in the future.

```typescript
class ChartifactBuilder {
  // ... previous code ...

  /**
   * Get all resources
   */
  getResources(): InteractiveDocument['resources'] {
    return this.doc.resources ? { ...this.doc.resources } : undefined;
  }

  /**
   * Get all chart specifications
   */
  getCharts(): Record<string, object> {
    return { ...(this.doc.resources?.charts || {}) };
  }

  /**
   * Get a specific chart specification
   */
  getChart(chartKey: string): object | undefined {
    return this.doc.resources?.charts?.[chartKey];
  }

  /**
   * Add or update a chart specification in resources
   */
  setChart(chartKey: string, spec: object): ChartifactBuilder {
    const charts = {
      ...(this.doc.resources?.charts || {}),
      [chartKey]: spec
    };

    return this.clone({
      resources: {
        ...this.doc.resources,
        charts
      }
    });
  }

  /**
   * Remove a chart specification from resources
   */
  deleteChart(chartKey: string): ChartifactBuilder {
    if (!this.doc.resources?.charts?.[chartKey]) {
      throw new Error(`Chart '${chartKey}' not found`);
    }

    const { [chartKey]: _, ...charts } = this.doc.resources.charts;

    return this.clone({
      resources: {
        ...this.doc.resources,
        charts
      }
    });
  }
}
```

## Usage Examples

### Example 1: Create a Simple Dashboard

```typescript
const builder = new ChartifactBuilder()
  .setTitle('Sales Dashboard')
  .setCSS(`
    body { font-family: sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; }
  `)
  .addElement('main', '# Sales Dashboard\n\nView key metrics below.')
  .addDataLoader({
    type: 'inline',
    dataSourceName: 'sales',
    content: [
      { month: 'Jan', revenue: 10000, profit: 2000 },
      { month: 'Feb', revenue: 12000, profit: 2400 },
      { month: 'Mar', revenue: 15000, profit: 3000 }
    ]
  })
  .setChart('revenueChart', {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'sales' },
    mark: 'bar',
    encoding: {
      x: { field: 'month', type: 'ordinal' },
      y: { field: 'revenue', type: 'quantitative' }
    }
  })
  .addElement('main', { type: 'chart', chartKey: 'revenueChart' });

// Export to JSON string for saving (use external I/O utility)
const json = builder.toString();
// Or get as object: const doc = builder.toJSON();
```

### Example 2: Add Interactive Controls

```typescript
const builder = ChartifactBuilder.fromDocument(existingDoc)
  .addGroup('controls', [])
  .addElement('controls', '## Settings')
  .addVariable({
    variableId: 'yearFilter',
    type: 'number',
    initialValue: 2024
  })
  .addElement('controls', {
    type: 'slider',
    variableId: 'yearFilter',
    min: 2020,
    max: 2024,
    step: 1,
    label: 'Select Year'
  })
  .addVariable({
    variableId: 'showDetails',
    type: 'boolean',
    initialValue: false
  })
  .addElement('controls', {
    type: 'checkbox',
    variableId: 'showDetails',
    label: 'Show detailed view'
  });
```

### Example 3: Modify Existing Document

```typescript
// Load from JSON string (external I/O handled separately)
const jsonString = readFileSync('./document.idoc.json', 'utf-8');
const builder = ChartifactBuilder.fromJSON(jsonString);

// Make modifications
const updated = builder
  .setTitle('Updated Title')
  .deleteElement('main', 0)
  .addElement('main', '# New Header')
  .addGroup('footer', ['Built with Chartifact'])
  .addNote('Updated on ' + new Date().toISOString());

// Export (external I/O handled separately)
const updatedJson = updated.toString();
// writeFileSync('./document.idoc.json', updatedJson);
```

### Example 4: Chaining Operations

```typescript
const doc = new ChartifactBuilder({ title: 'My Report' })
  .addGroup('header')
  .addElement('header', '# Annual Report 2024')
  .addElement('header', 'Executive Summary')
  .addGroup('metrics')
  .addDataLoader({
    type: 'inline',
    dataSourceName: 'kpis',
    content: [
      { name: 'Revenue', value: 1000000 },
      { name: 'Growth', value: 15 }
    ]
  })
  .addElement('metrics', {
    type: 'tabulator',
    dataSourceName: 'kpis',
    editable: false
  })
  .addGroup('charts')
  .setChart('trend', { /* vega spec */ })
  .addElement('charts', { type: 'chart', chartKey: 'trend' })
  .setCSS('.header { text-align: center; }')
  .toJSON();
```

## Getter Strategy

**Strategy:** Provide getters for inspection without mutation.

- **For simple values:** Return the value directly (e.g., `getTitle()` returns string)
- **For collections:** Return a shallow copy to prevent external mutation (e.g., `getGroups()` returns `[...groups]`)
- **For nested objects:** Return a shallow copy of the top-level object
- **Primary access:** Use `toJSON()` to get complete document when MCP needs full state

**Getter Categories:**
1. **Document-level:** `getTitle()`, `getCSS()`, `getGoogleFonts()`, `getNotes()`
2. **Groups:** `getGroups()`, `getGroup(id)`, `hasGroup(id)`
3. **Elements:** `getElements(groupId)`, `getElement(groupId, index)`
4. **Variables:** `getVariables()`, `getVariable(id)`
5. **Data:** `getDataLoaders()`, `getDataLoader(name)`
6. **Resources:** `getResources()`, `getCharts()`, `getChart(key)`
7. **Complete document:** `toJSON()` - returns full InteractiveDocument

**MCP Usage:** MCP tools can call `toJSON()` after any operation to return the complete updated document to the LLM.

## Validation & Error Handling

The builder includes validation at each operation:

```typescript
// Validation examples
try {
  builder
    .addGroup('main', [])  // Error: 'main' already exists
    .deleteGroup('nonexistent')  // Error: Group not found
    .deleteElement('main', 999)  // Error: Index out of bounds
    .addVariable({ /* duplicate variableId */ });  // Error: Variable exists
} catch (error) {
  console.error('Builder operation failed:', error.message);
}
```

## MCP Tool Mapping

Each builder method maps naturally to an MCP tool. Note the svelte approach - generic operations only:

| MCP Tool | Builder Method | Parameters |
|----------|---------------|------------|
| `create_document` | `new ChartifactBuilder()` | `{ title?, groups?, ... }` |
| `from_json` | `ChartifactBuilder.fromJSON()` | `{ json }` |
| `to_json` | `.toJSON()` | `{}` |
| `get_title` | `.getTitle()` | `{}` |
| `set_title` | `.setTitle()` | `{ title }` |
| `get_css` | `.getCSS()` | `{}` |
| `set_css` | `.setCSS()` | `{ css }` |
| `add_css` | `.addCSS()` | `{ css }` |
| `get_groups` | `.getGroups()` | `{}` |
| `get_group` | `.getGroup()` | `{ groupId }` |
| `add_group` | `.addGroup()` | `{ groupId, elements? }` |
| `delete_group` | `.deleteGroup()` | `{ groupId }` |
| `rename_group` | `.renameGroup()` | `{ oldGroupId, newGroupId }` |
| `get_elements` | `.getElements()` | `{ groupId }` |
| `add_element` | `.addElement()` | `{ groupId, element }` |
| `delete_element` | `.deleteElement()` | `{ groupId, elementIndex }` |
| `update_element` | `.updateElement()` | `{ groupId, elementIndex, element }` |
| `get_variables` | `.getVariables()` | `{}` |
| `add_variable` | `.addVariable()` | `{ variable }` |
| `delete_variable` | `.deleteVariable()` | `{ variableId }` |
| `get_data_loaders` | `.getDataLoaders()` | `{}` |
| `add_data_loader` | `.addDataLoader()` | `{ dataLoader }` |
| `delete_data_loader` | `.deleteDataLoader()` | `{ dataSourceName }` |
| `get_chart` | `.getChart()` | `{ chartKey }` |
| `set_chart` | `.setChart()` | `{ chartKey, spec }` |
| `delete_chart` | `.deleteChart()` | `{ chartKey }` |

**Note on I/O:** File operations (save, load) are handled by a dedicated I/O MCP server, not the builder.

## Implementation Notes

### Svelte Philosophy
**Keep maintenance overhead minimal:**
- Generic operations only (no type-specific helpers like `addMarkdown`, `addChart`, etc.)
- Users construct element objects directly
- Reduces API surface area
- Less code to maintain as schema evolves

### Immutability
All operations return new builder instances. This enables:
- Undo/redo by keeping history
- Safe concurrent operations
- Easier testing and debugging

### Type Safety
TypeScript types ensure:
- Valid element types
- Required properties present
- Correct data structures
- IDE autocomplete support

### Getter Strategy
- Getters return copies to prevent external mutation
- `toJSON()` provides complete document snapshot
- MCP can call `toJSON()` after operations to get updated state
- No need for complex getter/setter parity

### Performance
- Shallow copying for immutability
- JSON serialization only when needed
- Validation is O(n) or better
- No deep cloning unless necessary

### I/O Separation
- Builder focuses on document manipulation
- File I/O handled by dedicated utilities or MCP server
- Cleaner separation of concerns
- Easier to test builder in isolation

### Extension Points
The builder can be extended:
- Custom validators
- Plugin operations (if needed)
- Lifecycle hooks (if needed)

## Next Steps

1. **Implement core builder** (~1 day)
   - Document operations (with getters)
   - Group operations (with getters)
   - Element operations (generic only)
   - Variable operations (with getters)
   - Data loader operations (with getters)
   - Resources operations (with getters)
   - Validation

2. **Create MCP wrapper** (~0.5-1 day)
   - Tool definitions for each operation
   - Parameter schemas (auto-generated from TypeScript)
   - Error mapping
   - State management (builder instance per session)
   - Return updated document via `toJSON()` after each operation

3. **Testing & Documentation** (ongoing)
   - Unit tests for each operation
   - Integration examples
   - API documentation
   - Usage patterns

**Note:** File I/O intentionally omitted - handled by separate I/O MCP server or external utilities.

Total estimated effort: **1-2 days**
