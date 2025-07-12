---
type: immutable document
title: Migrate from Vue.js to Vanilla JavaScript
status: proposed
decision_date: 2025-01-12
documented_date: 2025-01-12
tags:
  - adr/obsidian-sparql
---

# ADR-002: Migrate from Vue.js to Vanilla JavaScript

## Relations
- decided by :: [[cvasquez]]
- stakeholder :: [[OSG system]]
- relates to :: [[adr-001-simplify-uri-conventions]]

## Status
proposed

## Context

The obsidian-sparql plugin currently uses Vue.js 3.5 for its UI components, including:

1. **DebugPanel.vue** - Side panel showing triplified file content as turtle
2. **SparqlView.vue** - Code block processor for `osg` blocks, rendering SPARQL query results
3. **SimpleTable.vue** - Table renderer for SELECT query results
4. **Term.vue** - Individual RDF term rendering component

This Vue.js setup introduces significant complexity:

- **Build complexity**: Requires Vite + Vue plugin, Vue-specific build configuration
- **Bundle size**: Vue runtime adds ~34KB to the plugin bundle
- **Development overhead**: Vue reactivity system, component lifecycle, dependency injection patterns
- **Maintenance burden**: Vue-specific testing setup, component architecture, template syntax

The plugin's actual UI requirements are simple:
- Render SPARQL query results as markdown tables (SELECT queries)
- Render RDF content as formatted turtle with actionable links (CONSTRUCT queries, debug panel)
- Update debug panel when files are saved
- Process code blocks and generate static content

The current Vue components already generate markdown strings and use Obsidian's `MarkdownRenderer.render()` for final output, making Vue's reactivity largely unnecessary.

## Decision

Migrate the entire plugin from Vue.js to vanilla JavaScript with the following architecture:

### New Component Structure

1. **BindingsTable** (replaces SimpleTable.vue)
   - Function that generates markdown table from SELECT query results
   - Processes bindings and creates actionable links using existing `termAsMarkdown()` utility
   - Returns markdown string for Obsidian rendering

2. **MarkdownTurtle** (replaces PrettyTurtle + DebugPanel turtle logic)
   - Function that generates turtle as markdown with link replacement
   - Scans turtle output for `<uri>` patterns and converts to `[[note-name]]` links using `namedAsMarkdown()`
   - Used by both CONSTRUCT query results and debug panel output

3. **SparqlView** (replaces SparqlView.vue)
   - Code block processor function (not class)
   - Determines query type: SELECT → BindingsTable, CONSTRUCT → MarkdownTurtle
   - Stateless processing of `osg` code blocks

4. **DebugPanel** (replaces DebugPanel.vue)
   - Vanilla JS class managing side panel state
   - Implements per-file triplify queue on save events
   - Uses MarkdownTurtle for output generation
   - Direct callback pattern instead of event system

### Technical Implementation

- **Remove Vue.js entirely**: No reactive components, no build complexity
- **Generate markdown strings**: Leverage Obsidian's existing markdown rendering
- **Eliminate EventEmitter**: Replace with direct function calls and callback pattern
- **Simplify main.js**: Keep tidy by extracting component logic to separate files
- **Maintain current functionality**: Same user experience with reduced complexity

### Triplify Integration

- **Per-file queuing**: Prevent duplicate triplify operations for same file
- **Save event trigger**: Auto-run triplify when files are saved
- **Non-blocking execution**: Async triplify operations with proper error handling
- **Named graph queries**: Use `fileToNamedGraph()` from vault-triplifier for debug panel

## Consequences

### Positive

- **Reduced bundle size**: Remove ~34KB Vue runtime, faster plugin loading
- **Simplified build**: Remove Vite Vue plugin, reduce build configuration complexity
- **Lower maintenance**: No Vue-specific patterns, simpler testing, easier debugging
- **Improved performance**: Direct DOM operations, no reactive overhead
- **Better Obsidian integration**: Native markdown generation, cleaner plugin architecture
- **Code clarity**: Simple functions instead of component hierarchy
- **Easier contribution**: Lower barrier to entry for contributors unfamiliar with Vue

### Negative

- **Migration effort**: Requires rewriting existing Vue components
- **Loss of reactivity**: Manual state management for debug panel updates
- **Test updates**: All Vue-based tests need rewriting
- **Temporary instability**: Functionality may be briefly broken during migration

## Alternatives Considered

### Keep Vue.js with Optimization
- **Why Rejected**: Still maintains build complexity and bundle overhead
- **Testing Results**: Current Vue setup working but over-engineered
- **Issues**: Complexity doesn't match simple plugin requirements

### Use Web Components
- **Why Rejected**: Overkill for static content generation
- **Testing Results**: Not evaluated - unnecessary abstraction
- **Issues**: Would still require custom element registration and lifecycle management

### Use Lit or Other Lightweight Framework
- **Why Rejected**: Plugin needs are too simple to justify any framework
- **Testing Results**: Not evaluated - current markdown generation pattern works well
- **Issues**: Additional dependency without meaningful benefit

### Pure DOM Manipulation
- **Why Rejected**: Less maintainable than markdown generation
- **Testing Results**: Current MarkdownRenderer.render() approach preferred
- **Issues**: Would bypass Obsidian's markdown processing and linking features