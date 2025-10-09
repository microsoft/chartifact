# MCP Component Research Report for Chartifact

**Date:** October 2025  
**Author:** Research Analysis  
**Status:** Recommendation - Do Not Implement

## Executive Summary

This report evaluates whether Chartifact should implement a Model Context Protocol (MCP) component for creating and editing interactive documents. After thorough analysis of the codebase, document sizes, current editing mechanisms, and implementation requirements, **we recommend NOT implementing an MCP component at this time**.

The JSON format is already well-suited for LLM-based editing, documents are small enough to fit entirely in modern LLM context windows, and the implementation overhead (estimated 2,500-4,000 lines of code) significantly outweighs the marginal benefits.

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

## MCP Implementation Requirements

To implement a functional MCP server for Chartifact, we would need:

### 1. Server Infrastructure (~500-1,000 lines)

- Node.js/TypeScript MCP server
- Protocol handling (stdio or HTTP transport)
- Connection management and lifecycle
- Error handling and logging
- Configuration and deployment

### 2. MCP Tools (~600-1,200 lines)

Would need to implement tools such as:

- `create_document` - Create new interactive document
- `read_document` - Read document content
- `update_title` - Update document title
- `update_layout_css` - Update CSS styling
- `add_group` - Add new group to document
- `delete_group` - Delete group from document
- `update_group` - Update group properties
- `add_element` - Add element to group
- `delete_element` - Delete element from group
- `update_element` - Update element content
- `add_variable` - Add reactive variable
- `update_variable` - Update variable definition
- `add_data_loader` - Add data source
- `update_data_loader` - Update data source configuration
- `validate_document` - Validate against schema

Each tool requires:
- JSON schema for parameters
- Input validation
- Implementation logic
- Error handling
- Documentation

### 3. Transaction System (~300-500 lines)

- Transaction ID generation and tracking
- Optimistic concurrency control
- Conflict detection and resolution
- Rollback/undo support
- State management across operations

### 4. File System Integration (~200-400 lines)

- File watching for external changes
- Atomic write operations
- Concurrent access handling
- Backup and recovery
- Path resolution and validation

### 5. Testing & Documentation (~1,000+ lines)

- Unit tests for each tool
- Integration tests for workflows
- User documentation
- API reference documentation
- Example usage patterns

**Total Estimated Implementation:** 2,500-4,000 lines of code + comprehensive documentation

**Maintenance Burden:** Ongoing updates as document schema evolves, bug fixes, feature additions

## Use Case Analysis

### Scenario 1: LLM Creating a New Document

**WITHOUT MCP (Current Approach):**
```
User: "Create a sales dashboard"
LLM: [Reads schema and examples]
     [Generates complete JSON document]
     [Returns document to user]
User: [Saves to file or pastes into tool]
Result: Document created in 1 step
```

**WITH MCP:**
```
User: "Create a sales dashboard"
LLM: [Calls create_document]
     [Calls update_title]
     [Calls update_layout_css]
     [Calls add_group multiple times]
     [Calls add_element for each element]
     [Calls add_data_loader for each data source]
     [Calls add_variable for each variable]
Result: Document created in 10+ steps
```

**Analysis:** MCP adds significant overhead with multiple tool calls, more complexity, and no clear benefit. JSON generation is faster and more natural for LLMs.

### Scenario 2: LLM Editing an Existing Document

**WITHOUT MCP (Current Approach):**
```
LLM: [Reads document JSON from file - ~3,000 tokens]
     [Understands structure]
     [Makes surgical edit]
     [Returns updated JSON]
User: [Saves updated file]
Result: Document edited, 1 read + 1 write
```

**WITH MCP:**
```
LLM: [Calls read_document - returns ~3,000 tokens]
     [Understands structure]
     [Calls update_element with changes]
MCP: [Applies change atomically]
     [Returns confirmation]
Result: Document edited, 1 read + 1 tool call
```

**Analysis:** Token usage is identical. MCP adds network/protocol overhead without meaningful benefit. The atomic operation is nice but unnecessary for single-user editing.

### Scenario 3: Complex Multi-Step Edit

**WITHOUT MCP:**
```
LLM: [Reads full document]
     [Plans multiple changes]
     [Applies all changes to JSON in memory]
     [Returns updated document]
Result: All changes applied atomically in one operation
```

**WITH MCP:**
```
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

### Implementation Costs

| Category | Estimated Effort | Details |
|----------|-----------------|---------|
| Development | 3-4 weeks | Server infrastructure, tool implementation, transaction system |
| Testing | 1-2 weeks | Unit tests, integration tests, edge cases |
| Documentation | 1 week | User guide, API reference, examples |
| **Total Initial** | **5-7 weeks** | Full-time developer equivalent |
| Maintenance | Ongoing | Schema updates, bug fixes, feature additions |

### Operational Costs

- Additional deployment complexity (MCP server + main app)
- Version compatibility between server and clients
- Debugging more complex than direct file operations
- User learning curve for MCP-based workflow
- Network latency for each tool call

### Benefits

| Benefit | Value | Current Need |
|---------|-------|--------------|
| Atomic operations | Low | Documents are small, single-user editing |
| Transaction support | Low | No collaborative editing requirement |
| Structured API | Low | JSON schema already provides structure |
| Type safety | None | TypeScript + JSON Schema sufficient |
| Partial document access | None | Documents fit in full context |
| Conflict resolution | None | Not a current use case |
| External tool integration | Low | No external tools need integration |

### Verdict

**Costs significantly outweigh benefits** at the current scale and requirements of the project.

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

### Primary Recommendation: DO NOT IMPLEMENT MCP COMPONENT

**Rationale:**

1. **JSON Format is Sufficient**
   - Well-structured and LLM-friendly
   - Documents fit entirely in context windows
   - LLMs can read, understand, and edit directly
   - No need for abstraction layer

2. **Editor is Incomplete**
   - Current editor sends full documents (not deltas)
   - No transaction system implemented yet
   - Adding MCP before completing basic functionality is premature
   - Should finish editor first, then evaluate needs

3. **No Current Pain Points**
   - No reports of LLMs struggling with JSON editing
   - No collaborative editing requirement
   - No external tools needing integration
   - Documents aren't too large for context

4. **Implementation Burden**
   - 5-7 weeks of development time
   - 2,500-4,000 lines of code to maintain
   - Ongoing maintenance as schema evolves
   - Added deployment and debugging complexity

5. **Premature Optimization**
   - Solving problems that don't exist yet
   - Can add later if needs emerge
   - Easier to add than to remove
   - Focus should be on core functionality

### Alternative Approaches

Instead of implementing MCP, consider:

#### 1. Document JSON Editing Patterns for LLMs

Create documentation showing LLMs how to effectively edit Chartifact documents:

```markdown
# Editing Chartifact Documents with LLMs

## Reading Documents
Load the .idoc.json file into context...

## Making Surgical Edits
To update a specific element, find it by path...

## Adding Components
To add a new chart, update the groups array...

## Validation
Use the JSON schema at docs/schema/idoc_v1.json...
```

#### 2. Improve JSON Schema and Examples

- Enhance JSON Schema with better descriptions
- Add more inline examples
- Create "how-to" example documents
- Document common patterns

#### 3. Complete the Editor Package

Focus on finishing the basic editor:
- Implement proper undo/redo
- Add more editing operations
- Improve UI/UX
- Add validation feedback

#### 4. Create Optional JSON Patch Library

If surgical editing becomes important:

```typescript
// Lightweight library, no protocol overhead
import { applyPatch } from '@chartifact/document-patches';

const patch = [
  { op: 'replace', path: '/groups/0/elements/1', value: 'New text' }
];
const updated = applyPatch(document, patch);
```

Benefits:
- Reusable in editor and other tools
- No server to maintain
- No protocol overhead
- Can expose via MCP later if needed
- Only 200-300 lines of code

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

After comprehensive analysis of the Chartifact codebase, document characteristics, and MCP implementation requirements, **we recommend NOT implementing an MCP component at this time**.

The JSON format is well-suited for direct LLM manipulation, documents are small enough to fit entirely in context, and the implementation overhead (5-7 weeks, 2,500-4,000 lines) significantly outweighs the marginal benefits.

Instead, focus should remain on:
1. Completing the core editor functionality
2. Improving documentation and examples for LLM-based editing
3. Waiting for real user pain points to emerge

MCP can be reconsidered in the future if collaborative editing becomes important, external tools need integration, or documents grow significantly larger. The phased approach outlined above provides a clear path forward should these needs emerge.

---

**Review Status:** Ready for review  
**Next Steps:** Share with team for feedback and decision
