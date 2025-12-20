# MCP Component Research Report for Chartifact

**Date:** October 2025  
**Author:** Research Analysis  
**Status:** Revised Recommendation - Implement Lightweight Version

## Executive Summary

This report evaluates whether Chartifact should implement a Model Context Protocol (MCP) component for creating and editing interactive documents. After thorough analysis and feedback, **we recommend implementing a lightweight transactional builder with an MCP wrapper**.

**Revised Analysis:** While the JSON format is well-suited for LLM-based editing, a simple transactional builder (1-2 days effort) would provide value by:
1. Offering structured operations that help LLMs avoid schema mistakes
2. Supporting multi-turn conversations where token accumulation matters
3. Serving as a foundation for completing the editor package
4. Enabling a thin MCP wrapper for standardized tool access

## Table of Contents

1. [Background](#background)
2. [What is MCP?](#what-is-mcp)
3. [Current State Analysis](#current-state-analysis)
4. [MCP Implementation Requirements](#mcp-implementation-requirements)
5. [Use Case Analysis](#use-case-analysis)
6. [Cost-Benefit Analysis](#cost-benefit-analysis)
7. [Comparison to Similar Projects](#comparison-to-similar-projects)
8. [Recommendation](#recommendation)
9. [Future Considerations](#future-considerations)

## Background

The problem statement raised the question:

> "It is unclear if there is a need for an mcp component to create/edit documents since the json format can be mutated by an LLM in context. Note that the editor package (although incomplete) sends delta documents instead of transactions."

This research investigates whether an MCP server would provide value for Chartifact document manipulation.

## What is MCP?

Model Context Protocol (MCP) is an open protocol developed by Anthropic that enables standardized integration between LLM applications and external data sources/tools. MCP servers expose:

1. **Resources**: Files, database records, API responses
2. **Tools**: Functions that can be called by the LLM
3. **Prompts**: Templated messages for common tasks

MCP provides a standardized way for AI models to securely access and manipulate external systems.

## Current State Analysis

### Document Size Analysis

Analysis of example documents in `packages/web-deploy/json/`:

| Document Type | Lines | Approximate Tokens |
|--------------|-------|-------------------|
| Simple (grocery-list) | 230 | ~700-1,000 |
| Medium (activity-rings) | 500 | ~1,500-2,500 |
| Complex (habit-tracker) | 741 | ~2,200-3,700 |

**Key Finding:** Even the largest Chartifact documents are under 1,000 lines and ~5,000 tokens. Modern LLMs (GPT-4, Claude) have 100K+ token context windows, so **all documents fit entirely in context with significant room for conversation**.

**Multi-Turn Consideration:** However, in a conversation with many editing turns (e.g., creating a "masterpiece" iteratively), token usage accumulates:
- 10 editing turns × 5,000 tokens per full document = 50,000 tokens
- 20 turns would exceed typical context windows
- A transactional approach (sending only changes) reduces this significantly

### Current Editor Implementation

Examined code in `packages/editor/src/editor.tsx`:

```typescript
const sendEditToApp = (newPage: InteractiveDocument) => {
    const pageMessage: EditorPageMessage = {
        type: 'editorPage',
        page: newPage,
        sender: 'editor'
    };
    postMessageTarget.postMessage(pageMessage, '*');
};
```

**Key Findings:**

1. **No Delta/Patch System:** Despite the problem statement mentioning "delta documents," the code shows the editor sends **entire documents** via `EditorPageMessage`
2. **Simple Operations:** Only basic operations implemented: `deleteElement`, `deleteGroup`
3. **No Transactions:** No transaction IDs, optimistic locking, or conflict resolution
4. **PostMessage Architecture:** Uses browser postMessage API between editor and host

### VSCode Extension

From `packages/vscode/src/web/command-edit.ts`:

- Reads `.idoc.json` and `.idoc.md` files directly
- Sends complete documents to editor webview
- No sophisticated transaction system
- Uses standard file system operations

### JSON Format Characteristics

The `InteractiveDocument` schema (see `docs/schema/idoc_v1.d.ts`):

- Well-structured, predictable schema
- Clear hierarchy: document → groups → elements
- Strongly typed with TypeScript definitions
- JSON Schema available for validation
- Designed to be human-readable and LLM-friendly

**Schema Clarity in Practice:** While the schema is clear, real-world usage shows LLMs can miss schema details, especially in complex documents. A transactional builder with well-defined operations (e.g., `addGroup`, `addElement`) would provide:
- Type-safe operations that prevent schema violations
- Starting point with sensible defaults
- Clearer API surface than raw JSON manipulation
- Better error messages when operations fail

## MCP Implementation Requirements

### Original (Over-Engineered) Estimate

Initial analysis suggested a comprehensive implementation requiring 2,500-4,000 lines of code over 5-7 weeks. This included full transaction systems, conflict resolution, file watching, and extensive tooling.

### Revised (Lightweight) Approach

**Realistic Implementation: 1-2 focused days**

The key insight is to start minimal and iterate:

#### 1. Transactional Builder (~200-300 lines)

A simple builder class with core operations:
- `create()` - Initialize document with sensible defaults
- `addGroup(id, props?)` - Add group to document
- `addElement(groupId, element)` - Add element to group
- `deleteGroup(groupId)` - Remove group
- `deleteElement(groupId, elementIndex)` - Remove element
- `setTitle(title)` - Update document title
- `setCss(css)` - Update layout CSS
- `toJSON()` - Export current state

Benefits:
- Type-safe operations
- Validation at each step
- Immutable updates (returns new state)
- Small, focused API surface

#### 2. MCP Wrapper (~100-200 lines)

A thin shim that exposes the builder via MCP protocol:
- Tool definitions for each builder method
- Parameter schemas (auto-generated from TypeScript)
- Error handling and validation
- State management (one document per session)

The MCP server scaffolding is straightforward:
- Use existing MCP SDK
- Map tool calls to builder methods
- Return results in MCP format

#### 3. File Integration (~50-100 lines)

Basic file operations:
- Load from `.idoc.json`
- Save to `.idoc.json`
- Simple error handling

**Total Realistic Implementation:** 350-600 lines of focused code

**Timeline:** 1-2 days with proper focus, not 5-7 weeks

**Maintenance:** Minimal - builder operations map 1:1 to schema, MCP wrapper is thin

## Use Case Analysis

### Scenario 1: Single Document Creation

**WITHOUT Builder:**
```
LLM: [Generates complete JSON document]
Result: Document created in 1 step, ~500 tokens
```

**WITH Builder:**
```
LLM: [Calls create_document with defaults]
     [Calls addGroup, addElement as needed]
Result: Document created in 3-5 operations, clearer structure
```

**Analysis:** Builder provides sensible defaults and prevents schema violations. Slight overhead but better guardrails.

### Scenario 2: Multi-Turn Editing Session (Critical Case)

**WITHOUT Builder (Full Document Each Time):**
```
Turn 1: LLM reads doc (5K tokens) → edits → returns doc (5K tokens)
Turn 2: LLM reads doc (5K tokens) → edits → returns doc (5K tokens)
Turn 3: LLM reads doc (5K tokens) → edits → returns doc (5K tokens)
...
Turn 20: Context exhausted at 100K tokens
```

**WITH Builder (Transactional Operations):**
```
Turn 1: LLM reads doc (5K tokens) → calls addElement (50 tokens)
Turn 2: Calls updateTitle (30 tokens)
Turn 3: Calls deleteGroup (20 tokens)
...
Turn 20: Still have 40K tokens of context remaining
```

**Analysis:** This is where the builder shines. Multi-turn conversations benefit significantly from transactional operations vs. sending full documents repeatedly.

### Scenario 3: Schema Mistakes

**WITHOUT Builder:**
```
LLM: [Generates JSON with subtle schema violation]
     [e.g., wrong property name, missing required field]
System: [Fails at render time or silently breaks]
User: [Has to debug and fix manually]
```

**WITH Builder:**
```
LLM: [Calls builder.addElement with invalid params]
Builder: [Validation fails immediately]
        [Returns clear error: "element must have 'type' property"]
LLM: [Corrects and retries]
```

**Analysis:** Builder catches errors at operation time, not render time. Better DX and prevents broken documents.
LLM: [Reads full document]
     [Plans multiple changes]
     [Calls update_element multiple times]
     [Calls add_variable]
     [Calls update_css]
Result: Changes applied in 5+ tool calls, each a network round-trip
```

**Analysis:** MCP is actually SLOWER for multi-step edits due to multiple round-trips. Without MCP, LLM can apply all changes in one operation.

### Scenario 4: Collaborative Editing (Future)

**WITHOUT MCP:**
```
User A: [Makes edit, saves file]
User B: [Makes edit to same file]
Result: Last write wins, potential data loss
```

**WITH MCP:**
```
User A: [Calls update_element]
MCP: [Applies with transaction ID]
User B: [Calls update_element on same element]
MCP: [Detects conflict, resolves or rejects]
Result: Conflict handled gracefully
```

**Analysis:** MCP provides value for collaborative editing. However, this is not a current requirement, and the editor package doesn't support this scenario yet.

## Cost-Benefit Analysis

### Revised Implementation Costs

| Category | Estimated Effort | Details |
|----------|-----------------|---------|
| Transactional Builder | 1 day | Core operations, type-safe API, validation |
| MCP Wrapper | 0.5 days | Thin shim over builder, tool definitions |
| File Integration | 0.5 days | Load/save, basic error handling |
| **Total Initial** | **1-2 days** | Focused development time |
| Testing | Included | Test builder operations as developed |
| Documentation | Minimal | API is self-documenting, add examples |
| Maintenance | Low | Builder maps to schema, MCP is thin wrapper |

### Operational Benefits

- **Reduced token usage in multi-turn conversations**: Transactional operations vs. full document resends
- **Schema validation**: Type-safe operations prevent common mistakes
- **Editor foundation**: Builder can be reused by editor package
- **Sensible defaults**: Starting with working skeleton vs. blank document
- **Clear API**: Well-defined operations vs. raw JSON manipulation
- **Future-proof**: Easy to extend with new operations

### Benefits (Revised)

| Benefit | Value | Notes |
|---------|-------|-------|
| Structured operations | **High** | Helps LLMs avoid schema mistakes |
| Token efficiency | **Medium** | Matters in multi-turn editing sessions |
| Editor foundation | **High** | Builder simplifies editor completion |
| Type safety | **Medium** | Runtime validation catches errors early |
| Sensible defaults | **High** | Better starting point than blank slate |
| External tool integration | **Medium** | MCP provides standardized access |

### Verdict

**Benefits outweigh costs** with the lightweight approach. 1-2 days of work provides significant value, especially for:
1. Multi-turn editing conversations
2. Completing the editor package
3. Preventing schema violations
4. Standardized tool access via MCP

## Comparison to Similar Projects

### Projects WITH MCP Servers

**Jupyter Notebooks:**
- Complex structure (code cells + output + metadata)
- Need to execute code server-side
- State management between cells
- Multiple kernel types
- Justification: Complexity requires abstraction

**Database Systems:**
- Large data sets don't fit in context
- Need optimized query execution
- ACID transactions required
- Security and access control
- Justification: Scale requires protocol

### Projects WITHOUT MCP Servers

**Markdown Editors:**
- LLMs edit markdown directly
- Full file fits in context
- No special protocol needed
- Works well in practice

**Configuration Files (JSON/YAML):**
- Tools edit directly via file system
- Schema validation via JSON Schema
- No MCP servers exist
- Chartifact is similar to this category

**Conclusion:** Projects with simple, structured formats (like Chartifact) don't typically use MCP for editing. The protocol adds unnecessary complexity.

## Recommendation

### Revised Recommendation: IMPLEMENT LIGHTWEIGHT TRANSACTIONAL BUILDER WITH MCP WRAPPER

**Rationale:**

1. **Multi-Turn Conversations Benefit from Transactions**
   - Editing a complex document across 20+ turns accumulates significant tokens
   - Transactional operations send only changes, not full documents
   - Reduces token usage and context window pressure
   - Enables longer, more iterative editing sessions

2. **LLMs Can Miss Schema Details**
   - While the schema is clear, LLMs sometimes violate it in practice
   - Transactional builder provides type-safe operations
   - Validation at each step catches errors early
   - Sensible defaults help LLMs start with working documents

3. **Editor Completion is Easier WITH Transactional Builder**
   - **Previous assumption was backwards**: The editor would be simpler to complete if built on a transactional foundation
   - Builder provides ready-made operations (add, delete, update)
   - Editor UI can directly call builder methods
   - Shared validation and state management logic
   - Undo/redo becomes easier with transaction history

4. **Minimal Implementation Burden**
   - **1-2 days**, not 5-7 weeks (original estimate was way off)
   - ~350-600 lines of focused code
   - Transactional builder is small API surface
   - MCP wrapper is thin shim over builder
   - Low maintenance - builder maps directly to schema

5. **Multiple Benefits from Small Investment**
   - Token efficiency in conversations
   - Schema validation and error prevention
   - Foundation for editor package
   - Standardized MCP tool access
   - Starting point with defaults vs. blank slate

### Implementation Approach

#### Step 1: Build Transactional Builder (Day 1)

Create a simple, immutable document builder:

```typescript
class ChartifactBuilder {
  private doc: InteractiveDocument;
  
  constructor(initial?: Partial<InteractiveDocument>) {
    this.doc = this.createDefault(initial);
  }
  
  private createDefault(partial?: Partial<InteractiveDocument>): InteractiveDocument {
    // Return document with sensible defaults
    return {
      title: partial?.title || "New Document",
      layout: { css: partial?.layout?.css || "" },
      groups: partial?.groups || [],
      variables: partial?.variables || [],
      dataLoaders: partial?.dataLoaders || [],
      ...partial
    };
  }
  
  addGroup(groupId: string, elements: Element[] = []): ChartifactBuilder {
    // Immutable operation, returns new builder
  }
  
  addElement(groupId: string, element: Element): ChartifactBuilder {
    // Find group, add element, return new builder
  }
  
  deleteGroup(groupId: string): ChartifactBuilder {
    // Remove group, return new builder
  }
  
  toJSON(): InteractiveDocument {
    return this.doc;
  }
}
```

Benefits:
- Immutable operations (no mutation bugs)
- Type-safe (TypeScript catches errors)
- Chainable API (fluent interface)
- Sensible defaults included

#### Step 2: Add MCP Wrapper (Day 1-2)

Expose builder via MCP protocol:

```typescript
// Define MCP tools
const tools = [
  {
    name: "create_document",
    description: "Create new document with optional properties",
    inputSchema: { /* JSON schema */ }
  },
  {
    name: "add_group",
    description: "Add a group to the document",
    inputSchema: { /* JSON schema */ }
  },
  // ... more tools
];

// Handle tool calls
async function handleToolCall(name: string, args: any) {
  switch (name) {
    case "create_document":
      builder = new ChartifactBuilder(args);
      return builder.toJSON();
    case "add_group":
      builder = builder.addGroup(args.groupId, args.elements);
      return builder.toJSON();
    // ... more handlers
  }
}
```

#### Step 3: File Integration (Day 2)

Add simple file operations:
- Load from filesystem
- Save to filesystem
- Basic error handling

#### Step 4: Use in Editor Package

Refactor editor to use builder:
- Replace manual document manipulation with builder calls
- Implement undo/redo using builder's immutable operations
- Add more editing operations easily

Total effort: **1-2 focused days**

## Future Considerations

### When to Reconsider MCP

Implement MCP if any of these conditions occur:

#### Trigger 1: Documents Exceed Context Windows
- **Threshold:** Documents regularly exceed 50K tokens
- **Likelihood:** Low (current max is ~5K tokens)
- **Timeline:** Not expected in near future

#### Trigger 2: Collaborative Editing Requirement
- **Threshold:** Users request real-time multi-user editing
- **Likelihood:** Medium (useful for teams)
- **Timeline:** Could emerge with product growth

#### Trigger 3: External Tool Ecosystem
- **Threshold:** 3+ external tools need document manipulation
- **Likelihood:** Low (currently only VSCode + web viewer)
- **Timeline:** Depends on adoption

#### Trigger 4: Editor Implements Transactions
- **Threshold:** Editor package has working transaction system
- **Likelihood:** High (natural evolution)
- **Timeline:** Could be next phase of editor development

### Phased Approach Recommendation

**Phase 1 (Current): Direct JSON Editing** ✅
- LLMs edit JSON directly
- VSCode extension reads/writes files
- Web viewer uses postMessage
- Status: Working well, no issues

**Phase 2 (If Needed): Transaction Library**
- Create JSON patch/transaction library
- Implement in editor package
- Share between VSCode and web viewer
- No MCP server yet
- Trigger: Need for undo/redo or collaborative editing

**Phase 3 (If Needed): MCP Server**
- Wrap transaction library in MCP protocol
- Expose as standardized tools
- Deploy for external integrations
- Trigger: External tools need integration

## Conclusion

After comprehensive analysis and feedback review, **we recommend implementing a lightweight transactional builder with an MCP wrapper**.

### Key Insights from Feedback

1. **Time estimate was way off**: A simple transactional builder + MCP wrapper is 1-2 days, not 5-7 weeks
2. **Multi-turn conversations matter**: Token accumulation across many editing turns makes transactional operations valuable
3. **LLMs miss schema details**: While the schema is clear, a structured API helps prevent mistakes
4. **Editor completion is easier with builder**: The builder provides a foundation for the editor, not the other way around

### Revised Assessment

The lightweight approach provides significant value with minimal cost:

**Benefits:**
- Reduces token usage in multi-turn editing conversations
- Provides type-safe operations that prevent schema violations
- Serves as foundation for completing editor package
- Offers sensible defaults for starting documents
- Enables standardized MCP tool access

**Costs:**
- 1-2 days of focused development
- ~350-600 lines of maintainable code
- Minimal ongoing maintenance

**Verdict:** Benefits clearly outweigh costs with the lightweight approach.

### Next Steps

1. Implement transactional builder (Day 1)
2. Add MCP wrapper over builder (Day 1-2)
3. Basic file integration (Day 2)
4. Refactor editor to use builder foundation
5. Document usage patterns

This provides immediate value while keeping implementation simple and maintainable.

---

**Review Status:** Ready for review  
**Next Steps:** Share with team for feedback and decision
