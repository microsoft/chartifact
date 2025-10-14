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
   * Add a new group to the document with optional initial elements.
   * This is the preferred way to create groups with content in bulk.
   * 
   * @param groupId - Unique identifier for the group
   * @param elements - Array of elements to initialize the group with (default: empty array)
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
   * Replace all elements in a group with a new array.
   * This is the preferred way to update group content in bulk rather than 
   * tracking individual element additions/deletions.
   * 
   * @param groupId - The group to update
   * @param elements - New array of elements to replace existing content
   */
  setGroupElements(groupId: string, elements: PageElement[]): ChartifactBuilder {
    const groups = this.doc.groups.map(g => 
      g.groupId === groupId
        ? { ...g, elements }
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

// Bulk operations (preferred for group content management):
// Create group with initial elements
builder.addGroup('dashboard', [
  '# Sales Dashboard',
  '## Key Metrics',
  { type: 'chart', chartKey: 'revenue' }
])

// Replace entire group content
builder.setGroupElements('dashboard', [
  '# Updated Dashboard',
  { type: 'chart', chartKey: 'newChart' }
])
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
   * Add or update a resource in the resources section.
   * This includes charts (stored in resources.charts) and potentially other resource types in the future.
   * 
   * @param resourceType - The type of resource (e.g., 'charts')
   * @param resourceKey - The key/name for this resource
   * @param spec - The resource specification (e.g., Vega/Vega-Lite spec for charts)
   */
  setResource(resourceType: string, resourceKey: string, spec: object): ChartifactBuilder {
    const resources = {
      ...(this.doc.resources?.[resourceType] || {}),
      [resourceKey]: spec
    };

    return this.clone({
      resources: {
        ...this.doc.resources,
        [resourceType]: resources
      }
    });
  }

  /**
   * Remove a resource from the resources section
   * 
   * @param resourceType - The type of resource (e.g., 'charts')
   * @param resourceKey - The key/name for this resource
   */
  deleteResource(resourceType: string, resourceKey: string): ChartifactBuilder {
    if (!this.doc.resources?.[resourceType]?.[resourceKey]) {
      throw new Error(`Resource '${resourceKey}' not found in '${resourceType}'`);
    }

    const { [resourceKey]: _, ...resources } = this.doc.resources[resourceType];

    return this.clone({
      resources: {
        ...this.doc.resources,
        [resourceType]: resources
      }
    });
  }
}

// Convenience methods for charts (most common resource type)
// Example usage:
// builder.setResource('charts', 'myChart', vegaSpec)
// builder.deleteResource('charts', 'myChart')
```

## Usage Examples

### Example 1: Create a Dashboard with Bulk Group Operations (Recommended)

```typescript
// Preferred approach: Use bulk operations for group content
const builder = new ChartifactBuilder()
  .setTitle('Sales Dashboard')
  .setCSS(`
    body { font-family: sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; }
  `)
  .addDataLoader({
    type: 'inline',
    dataSourceName: 'sales',
    content: [
      { month: 'Jan', revenue: 10000, profit: 2000 },
      { month: 'Feb', revenue: 12000, profit: 2400 },
      { month: 'Mar', revenue: 15000, profit: 3000 }
    ]
  })
  .setResource('charts', 'revenueChart', {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'sales' },
    mark: 'bar',
    encoding: {
      x: { field: 'month', type: 'ordinal' },
      y: { field: 'revenue', type: 'quantitative' }
    }
  })
  // Create group with all elements at once (recommended pattern)
  .addGroup('main', [
    '# Sales Dashboard',
    '\n\nView key metrics below.\n',
    { type: 'chart', chartKey: 'revenueChart' }
  ]);

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
  .setResource('charts', 'trend', { /* vega spec */ })
  .addElement('charts', { type: 'chart', chartKey: 'trend' })
  .setCSS('.header { text-align: center; }')
  .toJSON();
```

## Reading State Strategy

**Strategy:** Since the builder wraps a simple JSON object, the LLM can access the document directly when needed.

- **Primary access:** Use `toJSON()` to get the complete document
- **No individual getters:** Avoid maintenance overhead of getter methods for every property
- **Direct inspection:** The LLM can read any part of the returned JSON object as needed

**Usage:**
```typescript
const doc = builder.toJSON();
// Access any property directly from the JSON:
const title = doc.title;
const groups = doc.groups;
const firstGroup = doc.groups[0];
const css = doc.style?.css;
const variables = doc.variables;
// etc.
```

**MCP Usage:** MCP tools call `toJSON()` after operations to return the updated document. The LLM can then inspect any part of the document it needs.

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

Each builder method maps naturally to an MCP tool. Note the svelte approach - generic operations only, no individual getters:

| MCP Tool | Builder Method | Parameters |
|----------|---------------|------------|
| `create_document` | `new ChartifactBuilder()` | `{ title?, groups?, ... }` |
| `from_json` | `ChartifactBuilder.fromJSON()` | `{ json }` |
| `to_json` | `.toJSON()` | `{}` |
| `set_title` | `.setTitle()` | `{ title }` |
| `set_css` | `.setCSS()` | `{ css }` |
| `add_css` | `.addCSS()` | `{ css }` |
| `add_group` | `.addGroup()` | `{ groupId, elements? }` |
| `insert_group` | `.insertGroup()` | `{ index, groupId, elements? }` |
| `delete_group` | `.deleteGroup()` | `{ groupId }` |
| `rename_group` | `.renameGroup()` | `{ oldGroupId, newGroupId }` |
| `move_group` | `.moveGroup()` | `{ groupId, toIndex }` |
| `add_element` | `.addElement()` | `{ groupId, element }` |
| `add_elements` | `.addElements()` | `{ groupId, elements }` |
| `insert_element` | `.insertElement()` | `{ groupId, index, element }` |
| `delete_element` | `.deleteElement()` | `{ groupId, elementIndex }` |
| `update_element` | `.updateElement()` | `{ groupId, elementIndex, element }` |
| `clear_elements` | `.clearElements()` | `{ groupId }` |
| `set_group_elements` | `.setGroupElements()` | `{ groupId, elements }` |
| `add_variable` | `.addVariable()` | `{ variable }` |
| `update_variable` | `.updateVariable()` | `{ variableId, updates }` |
| `delete_variable` | `.deleteVariable()` | `{ variableId }` |
| `add_data_loader` | `.addDataLoader()` | `{ dataLoader }` |
| `delete_data_loader` | `.deleteDataLoader()` | `{ dataSourceName }` |
| `set_resource` | `.setResource()` | `{ resourceType, resourceKey, spec }` |
| `delete_resource` | `.deleteResource()` | `{ resourceType, resourceKey }` |
| `add_note` | `.addNote()` | `{ note }` |
| `clear_notes` | `.clearNotes()` | `{}` |

**Reading state:** MCP tools call `toJSON()` to get the complete document. The LLM can then inspect any part of the JSON directly.

**Note on I/O:** File operations (save, load) are handled by a dedicated I/O MCP server, not the builder.

## Transactional API for MCP

**Question:** Can MCP take advantage of chainability?

**Answer:** MCP tools operate one at a time, so direct chainability isn't available. However, we can provide a transactional API that accepts an array of operations to apply atomically.

### Transaction Types

```typescript
type Transaction = 
  | { op: 'setTitle', title: string }
  | { op: 'setCSS', css: string | string[] }
  | { op: 'addCSS', css: string }
  | { op: 'setGoogleFonts', config: GoogleFontsSpec }
  | { op: 'addNote', note: string }
  | { op: 'clearNotes' }
  | { op: 'addGroup', groupId: string, elements?: PageElement[] }
  | { op: 'insertGroup', index: number, groupId: string, elements?: PageElement[] }
  | { op: 'deleteGroup', groupId: string }
  | { op: 'renameGroup', oldGroupId: string, newGroupId: string }
  | { op: 'moveGroup', groupId: string, toIndex: number }
  | { op: 'addElement', groupId: string, element: PageElement }
  | { op: 'addElements', groupId: string, elements: PageElement[] }
  | { op: 'insertElement', groupId: string, index: number, element: PageElement }
  | { op: 'deleteElement', groupId: string, elementIndex: number }
  | { op: 'updateElement', groupId: string, elementIndex: number, element: PageElement }
  | { op: 'clearElements', groupId: string }
  | { op: 'setGroupElements', groupId: string, elements: PageElement[] }
  | { op: 'addVariable', variable: Variable }
  | { op: 'updateVariable', variableId: string, updates: Partial<Variable> }
  | { op: 'deleteVariable', variableId: string }
  | { op: 'addDataLoader', dataLoader: DataLoader }
  | { op: 'deleteDataLoader', dataSourceName: string }
  | { op: 'setResource', resourceType: string, resourceKey: string, spec: object }
  | { op: 'deleteResource', resourceType: string, resourceKey: string };
```

### Apply Transactions Method

```typescript
class ChartifactBuilder {
  // ... previous code ...

  /**
   * Apply an array of transactions atomically.
   * This is useful for MCP where chainability isn't available,
   * allowing multiple operations to be applied in a single call.
   * 
   * @param transactions - Array of transaction objects to apply
   * @returns New builder instance with all transactions applied
   */
  applyTransactions(transactions: Transaction[]): ChartifactBuilder {
    let builder: ChartifactBuilder = this;
    
    for (const tx of transactions) {
      switch (tx.op) {
        case 'setTitle':
          builder = builder.setTitle(tx.title);
          break;
        case 'setCSS':
          builder = builder.setCSS(tx.css);
          break;
        case 'addCSS':
          builder = builder.addCSS(tx.css);
          break;
        case 'setGoogleFonts':
          builder = builder.setGoogleFonts(tx.config);
          break;
        case 'addNote':
          builder = builder.addNote(tx.note);
          break;
        case 'clearNotes':
          builder = builder.clearNotes();
          break;
        case 'addGroup':
          builder = builder.addGroup(tx.groupId, tx.elements);
          break;
        case 'insertGroup':
          builder = builder.insertGroup(tx.index, tx.groupId, tx.elements);
          break;
        case 'deleteGroup':
          builder = builder.deleteGroup(tx.groupId);
          break;
        case 'renameGroup':
          builder = builder.renameGroup(tx.oldGroupId, tx.newGroupId);
          break;
        case 'moveGroup':
          builder = builder.moveGroup(tx.groupId, tx.toIndex);
          break;
        case 'addElement':
          builder = builder.addElement(tx.groupId, tx.element);
          break;
        case 'addElements':
          builder = builder.addElements(tx.groupId, tx.elements);
          break;
        case 'insertElement':
          builder = builder.insertElement(tx.groupId, tx.index, tx.element);
          break;
        case 'deleteElement':
          builder = builder.deleteElement(tx.groupId, tx.elementIndex);
          break;
        case 'updateElement':
          builder = builder.updateElement(tx.groupId, tx.elementIndex, tx.element);
          break;
        case 'clearElements':
          builder = builder.clearElements(tx.groupId);
          break;
        case 'setGroupElements':
          builder = builder.setGroupElements(tx.groupId, tx.elements);
          break;
        case 'addVariable':
          builder = builder.addVariable(tx.variable);
          break;
        case 'updateVariable':
          builder = builder.updateVariable(tx.variableId, tx.updates);
          break;
        case 'deleteVariable':
          builder = builder.deleteVariable(tx.variableId);
          break;
        case 'addDataLoader':
          builder = builder.addDataLoader(tx.dataLoader);
          break;
        case 'deleteDataLoader':
          builder = builder.deleteDataLoader(tx.dataSourceName);
          break;
        case 'setResource':
          builder = builder.setResource(tx.resourceType, tx.resourceKey, tx.spec);
          break;
        case 'deleteResource':
          builder = builder.deleteResource(tx.resourceType, tx.resourceKey);
          break;
      }
    }
    
    return builder;
  }
}
```

### Transactional Usage Example

```typescript
// Instead of chaining (not available in MCP):
// builder.setTitle('Dashboard').addGroup('main').addElement('main', '# Hello')

// Use transactions (available in MCP):
const updated = builder.applyTransactions([
  { op: 'setTitle', title: 'Dashboard' },
  { op: 'addGroup', groupId: 'main', elements: [] },
  { op: 'addElement', groupId: 'main', element: '# Hello' },
  { op: 'setResource', resourceType: 'charts', resourceKey: 'myChart', spec: { /* ... */ } },
  { op: 'addElement', groupId: 'main', element: { type: 'chart', chartKey: 'myChart' } }
]);

// Preferred: Use bulk element operations for group content management
const updatedBulk = builder.applyTransactions([
  { op: 'setTitle', title: 'Sales Dashboard' },
  { 
    op: 'addGroup', 
    groupId: 'header', 
    elements: [
      '# Sales Dashboard',
      '## Q4 2024 Performance'
    ]
  },
  {
    op: 'addGroup',
    groupId: 'charts',
    elements: [
      { type: 'chart', chartKey: 'revenue' },
      { type: 'chart', chartKey: 'profit' }
    ]
  }
]);

// Update entire group content at once (typical pattern)
const replaced = builder.applyTransactions([
  {
    op: 'setGroupElements',
    groupId: 'dashboard',
    elements: [
      '# Updated Dashboard',
      '## New Content',
      { type: 'chart', chartKey: 'newChart' },
      { type: 'tabulator', dataSourceName: 'metrics' }
    ]
  }
]);

const doc = updated.toJSON();
```

### MCP Tool for Transactions

```typescript
// MCP tool definition
{
  name: "apply_transactions",
  description: "Apply multiple document operations atomically",
  inputSchema: {
    type: "object",
    properties: {
      transactions: {
        type: "array",
        items: {
          // Transaction union type schema
        }
      }
    }
  }
}
```

**Benefits of Transactional API:**
- **Atomic operations** - All transactions succeed or fail together
- **Efficient** - Single MCP call instead of multiple round-trips
- **Flexible** - LLM can batch multiple edits
- **Compatible with chainable API** - Both patterns coexist

**MCP Usage:** The LLM can either call individual tools (one operation at a time) or use `apply_transactions` (multiple operations at once).

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

### Reading State Strategy
- **No individual getters** - Avoids maintenance overhead
- **Use `toJSON()` for all reads** - Returns complete document as plain JSON
- **LLM inspects JSON directly** - Can access any property from the returned object
- **Simple and flexible** - No need to add getters as schema evolves

### Bulk Operations Pattern (Recommended)
- **Group-level management** - Prefer `addGroup(id, elements[])` and `setGroupElements(id, elements[])` over individual element operations
- **Less granular tracking** - Individual element add/delete/update operations available but typically too granular
- **Simpler mental model** - Think of groups as content units rather than managing elements individually
- **Better for MCP** - Fewer transactions needed, more atomic updates
- **Typical workflow**: Create group with initial content, then use `setGroupElements()` to replace content when needed

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
   - Document operations
   - Group operations
   - Element operations (generic only)
   - Variable operations
   - Data loader operations
   - Resources operations
   - Validation
   - Single `toJSON()` method for reading state

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
