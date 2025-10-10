# Chartifact Document Builder API Sketch

**Date:** October 2025  
**Status:** API Design Proposal

## Overview

This document sketches out the API for a lightweight transactional builder for Chartifact interactive documents. The builder provides:

1. **Immutable operations** - Each operation returns a new builder instance
2. **Type safety** - TypeScript types prevent schema violations
3. **Sensible defaults** - Documents start with working structure
4. **Chainable API** - Fluent interface for ergonomic usage
5. **Validation** - Errors caught at operation time, not render time

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

  /**
   * Load a document from a file path
   */
  static async fromFile(path: string): Promise<ChartifactBuilder> {
    // Implementation would use fs.readFile
    throw new Error('Not implemented');
  }

  /**
   * Save the current document to a file path
   */
  async toFile(path: string): Promise<void> {
    // Implementation would use fs.writeFile
    throw new Error('Not implemented');
  }

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
   * Set the document title
   */
  setTitle(title: string): ChartifactBuilder {
    return this.clone({ title });
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

  /**
   * Get a group by ID (for inspection)
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
}
```

## Element Operations

```typescript
class ChartifactBuilder {
  // ... previous code ...

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

  /**
   * Add markdown text as an element
   */
  addMarkdown(groupId: string, markdown: string): ChartifactBuilder {
    return this.addElement(groupId, markdown);
  }

  /**
   * Add a chart element
   */
  addChart(groupId: string, chartKey: string): ChartifactBuilder {
    return this.addElement(groupId, {
      type: 'chart',
      chartKey
    });
  }

  /**
   * Add a checkbox element
   */
  addCheckbox(
    groupId: string, 
    variableId: string, 
    options?: { label?: string }
  ): ChartifactBuilder {
    return this.addElement(groupId, {
      type: 'checkbox',
      variableId,
      ...options
    });
  }

  /**
   * Add a dropdown element
   */
  addDropdown(
    groupId: string,
    variableId: string,
    options: string[] | { dataSourceName: string; fieldName: string },
    config?: { label?: string; multiple?: boolean; size?: number }
  ): ChartifactBuilder {
    const element: DropdownElement = {
      type: 'dropdown',
      variableId,
      ...(Array.isArray(options) 
        ? { options }
        : { dynamicOptions: options }
      ),
      ...config
    };
    return this.addElement(groupId, element);
  }

  /**
   * Add a slider element
   */
  addSlider(
    groupId: string,
    variableId: string,
    min: number,
    max: number,
    step: number,
    options?: { label?: string }
  ): ChartifactBuilder {
    return this.addElement(groupId, {
      type: 'slider',
      variableId,
      min,
      max,
      step,
      ...options
    });
  }

  /**
   * Add a textbox element
   */
  addTextbox(
    groupId: string,
    variableId: string,
    options?: { label?: string; multiline?: boolean; placeholder?: string }
  ): ChartifactBuilder {
    return this.addElement(groupId, {
      type: 'textbox',
      variableId,
      ...options
    });
  }

  /**
   * Add a number input element
   */
  addNumber(
    groupId: string,
    variableId: string,
    options?: { label?: string; min?: number; max?: number; step?: number; placeholder?: string }
  ): ChartifactBuilder {
    return this.addElement(groupId, {
      type: 'number',
      variableId,
      ...options
    });
  }

  /**
   * Add a tabulator (table) element
   */
  addTable(
    groupId: string,
    dataSourceName: string,
    options?: { 
      variableId?: string; 
      editable?: boolean; 
      tabulatorOptions?: object 
    }
  ): ChartifactBuilder {
    return this.addElement(groupId, {
      type: 'tabulator',
      dataSourceName,
      ...options
    });
  }

  /**
   * Add an image element
   */
  addImage(
    groupId: string,
    url: string,
    options?: { alt?: string; height?: number; width?: number }
  ): ChartifactBuilder {
    return this.addElement(groupId, {
      type: 'image',
      url,
      ...options
    });
  }

  /**
   * Add a mermaid diagram element
   */
  addMermaid(
    groupId: string,
    diagramText: string,
    options?: { variableId?: string }
  ): ChartifactBuilder {
    return this.addElement(groupId, {
      type: 'mermaid',
      diagramText,
      ...options
    });
  }
}
```

## Data & Variable Operations

```typescript
class ChartifactBuilder {
  // ... previous code ...

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
   * Add an inline data source
   */
  addInlineData(
    dataSourceName: string,
    content: object[] | string | string[],
    options?: { format?: 'json' | 'csv' | 'tsv' | 'dsv'; delimiter?: string }
  ): ChartifactBuilder {
    return this.addDataLoader({
      type: 'inline',
      dataSourceName,
      content,
      ...options
    });
  }

  /**
   * Add a URL-based data source
   */
  addURLData(
    dataSourceName: string,
    url: string,
    options?: { format?: 'json' | 'csv' | 'tsv' | 'dsv' }
  ): ChartifactBuilder {
    return this.addDataLoader({
      type: 'url',
      dataSourceName,
      url,
      ...options
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

## Chart Resources Operations

```typescript
class ChartifactBuilder {
  // ... previous code ...

  /**
   * Add a chart specification to resources
   */
  addChartSpec(chartKey: string, spec: object): ChartifactBuilder {
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
   * Update an existing chart specification
   */
  updateChartSpec(chartKey: string, spec: object): ChartifactBuilder {
    if (!this.doc.resources?.charts?.[chartKey]) {
      throw new Error(`Chart '${chartKey}' not found`);
    }

    return this.addChartSpec(chartKey, spec);
  }

  /**
   * Remove a chart specification
   */
  deleteChartSpec(chartKey: string): ChartifactBuilder {
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
  .addMarkdown('main', '# Sales Dashboard\n\nView key metrics below.')
  .addInlineData('sales', [
    { month: 'Jan', revenue: 10000, profit: 2000 },
    { month: 'Feb', revenue: 12000, profit: 2400 },
    { month: 'Mar', revenue: 15000, profit: 3000 }
  ])
  .addChartSpec('revenueChart', {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'sales' },
    mark: 'bar',
    encoding: {
      x: { field: 'month', type: 'ordinal' },
      y: { field: 'revenue', type: 'quantitative' }
    }
  })
  .addChart('main', 'revenueChart');

// Save to file
await builder.toFile('./sales-dashboard.idoc.json');
```

### Example 2: Add Interactive Controls

```typescript
const builder = ChartifactBuilder.fromDocument(existingDoc)
  .addGroup('controls', [])
  .addMarkdown('controls', '## Settings')
  .addVariable({
    variableId: 'yearFilter',
    type: 'number',
    initialValue: 2024
  })
  .addSlider('controls', 'yearFilter', 2020, 2024, 1, {
    label: 'Select Year'
  })
  .addVariable({
    variableId: 'showDetails',
    type: 'boolean',
    initialValue: false
  })
  .addCheckbox('controls', 'showDetails', {
    label: 'Show detailed view'
  });
```

### Example 3: Modify Existing Document

```typescript
// Load from file
const builder = await ChartifactBuilder.fromFile('./document.idoc.json');

// Make modifications
const updated = builder
  .setTitle('Updated Title')
  .deleteElement('main', 0)
  .addMarkdown('main', '# New Header')
  .addGroup('footer', ['Built with Chartifact'])
  .addNote('Updated on ' + new Date().toISOString());

// Save back
await updated.toFile('./document.idoc.json');
```

### Example 4: Chaining Operations

```typescript
const doc = new ChartifactBuilder({ title: 'My Report' })
  .addGroup('header')
  .addMarkdown('header', '# Annual Report 2024')
  .addMarkdown('header', 'Executive Summary')
  .addGroup('metrics')
  .addInlineData('kpis', [
    { name: 'Revenue', value: 1000000 },
    { name: 'Growth', value: 15 }
  ])
  .addTable('metrics', 'kpis', { editable: false })
  .addGroup('charts')
  .addChartSpec('trend', { /* vega spec */ })
  .addChart('charts', 'trend')
  .setCSS('.header { text-align: center; }')
  .toJSON();
```

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

Each builder method maps naturally to an MCP tool:

| MCP Tool | Builder Method | Parameters |
|----------|---------------|------------|
| `create_document` | `new ChartifactBuilder()` | `{ title?, groups?, ... }` |
| `set_title` | `.setTitle()` | `{ title }` |
| `set_css` | `.setCSS()` | `{ css }` |
| `add_group` | `.addGroup()` | `{ groupId, elements? }` |
| `delete_group` | `.deleteGroup()` | `{ groupId }` |
| `add_element` | `.addElement()` | `{ groupId, element }` |
| `add_markdown` | `.addMarkdown()` | `{ groupId, markdown }` |
| `add_chart` | `.addChart()` | `{ groupId, chartKey }` |
| `add_variable` | `.addVariable()` | `{ variable }` |
| `add_data_loader` | `.addDataLoader()` | `{ dataLoader }` |
| `add_chart_spec` | `.addChartSpec()` | `{ chartKey, spec }` |
| `to_json` | `.toJSON()` | `{}` |
| `save_file` | `.toFile()` | `{ path }` |
| `load_file` | `ChartifactBuilder.fromFile()` | `{ path }` |

## Implementation Notes

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

### Performance
- Shallow copying for immutability
- JSON serialization only when needed
- Validation is O(n) or better
- No deep cloning unless necessary

### Extension Points
The builder can be extended:
- Custom validators
- Plugin operations
- Custom element types
- Lifecycle hooks

## Next Steps

1. **Implement core builder** (~1 day)
   - Document operations
   - Group operations
   - Element operations
   - Validation

2. **Add file I/O** (~0.5 day)
   - Load from filesystem
   - Save to filesystem
   - Error handling

3. **Create MCP wrapper** (~0.5 day)
   - Tool definitions
   - Parameter schemas
   - Error mapping
   - State management

4. **Testing & Documentation** (ongoing)
   - Unit tests for each operation
   - Integration examples
   - API documentation
   - Usage patterns

Total estimated effort: **1-2 days**
