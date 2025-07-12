# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**obsidian-sparql** is an Obsidian plugin that enables SPARQL queries against the RDF graph representation of your notes. It transforms Obsidian vaults into queryable semantic datasets, allowing complex relationship exploration through structured queries.

## Architecture

### Core Technologies
- **Vue.js 3.5**: Component-based UI architecture
- **RDF/SPARQL Stack**: `rdf-ext`, `sparql-http-client`, `sparqljs`, `vault-triplifier`
- **Vite**: Build system with Vue plugin support
- **Vitest**: Testing framework with Vue component support

### Key Components
- `src/main.js`: Main plugin class (`Prototype_11`) extending Obsidian's Plugin
- `src/components/SparqlView.vue`: Primary SPARQL query interface
- `src/lib/Triplestore.js`: SPARQL endpoint communication layer
- `src/lib/templates.js`: Dynamic query template system with `__THIS_DOC__` placeholders
- `src/lib/uriUtils.js`: URI detection and conversion utilities

### URI Convention System (ADR-001)
The plugin uses a simplified three-URI system:
1. **File resources**: `file:///absolute/path/to/file.md` (filesystem references)
2. **Name resources**: `urn:name:NoteName` (Obsidian note names)
3. **Properties**: `urn:property:propertyName` (RDF predicates)

Internal URI detection distinguishes vault files from external resources for proper link rendering.

## Development Commands

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm test

# Run tests with UI
npm run test:ui
```

## Build System

- **Target**: ES2018 CommonJS for Obsidian compatibility
- **Output**: Builds directly to root (`main.js`, `styles.css`)
- **External**: Obsidian API excluded from bundle
- **Source Maps**: Inline for development, disabled for production

## Testing

- **Location**: `src/lib/__tests__/` and `tests/`
- **Mocks**: Obsidian API mocked in `vitest/src/mocks/obsidian.js`
- **Environment**: happy-dom for browser-like testing
- **Integration**: Full plugin workflow tests in `tests/main.integration.test.js`

## External Dependencies

- **OSG Integration**: Hardcoded path `/home/cvasquez/.local/share/pnpm/osg`
- **SPARQL Endpoint**: Default `http://localhost:7878/query`
- **vault-triplifier**: Converts Obsidian markdown to RDF triples

## Key Patterns

### Code Block Rendering
Plugin handles `osg` and `osg-debug` code blocks as interactive SPARQL queries.

### Template System
Query templates support dynamic variables:
- `__THIS_DOC__`: Current document URI
- `__VAULT_PATH__`: Absolute vault path

### Event Handling
Custom EventEmitter system tracks file changes, saves, renames, and deletions for RDF synchronization.

### Link Rendering
Uses Obsidian's `MarkdownRenderer.render()` for proper wiki-link display and `workspace.openLinkText()` for navigation (see `docs/how-to.md`).

## Plugin Installation

For development, use the symlink script to link built files to vault's `.obsidian/plugins/obsidian-sparql/` directory.