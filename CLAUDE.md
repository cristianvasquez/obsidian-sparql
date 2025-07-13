# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**obsidian-sparql** is an Obsidian plugin that enables SPARQL queries against the RDF graph representation of your notes. It transforms Obsidian vaults into queryable semantic datasets, allowing complex relationship exploration through structured queries.

## Architecture

### Core Technologies
- **Vanilla JavaScript**: Simplified architecture without framework overhead (migrated from Vue.js - see ADR-002)
- **RDF/SPARQL Stack**: `rdf-ext`, `sparql-http-client`, `sparqljs`, `vault-triplifier`
- **Vite**: Build system for ES modules
- **Vitest**: Testing framework with happy-dom environment

### Key Components
- `src/main.js`: Main plugin class (`Prototype_11`) extending Obsidian's Plugin (95 lines, refactored)
- `src/components/SparqlView.js`: Primary SPARQL query interface (vanilla JS)
- `src/components/DebugPanel.js`: Simple debug panel rendering hardcoded SPARQL queries
- `src/lib/Triplestore.js`: SPARQL endpoint communication layer
- `src/lib/templates.js`: Dynamic query template system with property placeholders
- `src/lib/settings.js`: Settings management and UI (`SparqlSettingTab`)
- `src/lib/sync.js`: File synchronization with OSG triplestore (`SyncManager`)
- `src/lib/commands.js`: Command and event registration (`CommandManager`)
- `src/views/CurrentFileView.js`: Side panel view management
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

- **Location**: `src/lib/__tests__/` for unit tests
- **Framework**: Vitest with `--run` flag for CI/automation
- **Coverage**: Template system functions (`replacePropertyPlaceholders`, `replaceInternalLinks`, etc.)
- **Mocks**: Obsidian API mocked in `vitest/src/mocks/obsidian.js`
- **Environment**: happy-dom for browser-like testing
- **Integration**: Run with `npm test -- --run` for single execution

## External Dependencies

- **OSG Integration**: Configurable path (default: `/home/cvasquez/.local/share/pnpm/osg`)
- **SPARQL Endpoint**: Configurable endpoint (default: `http://localhost:7878/query`)
- **vault-triplifier**: Converts Obsidian markdown to RDF triples

## Key Patterns

### Code Block Rendering
Plugin handles `osg` and `osg-debug` code blocks as interactive SPARQL queries.

### Template System
Query templates support dynamic variables and property placeholders:
- `__THIS__`: Current document name URI (`urn:name:NoteName`)
- `__DOC__`: Current document file URI (`file:///absolute/path`)
- `__property__`: Property placeholders (e.g., `__label__` → `<urn:property:label>`)
- `[[WikiLinks]]`: Internal links to name URIs

### Event Handling
Direct function calls replace EventEmitter pattern. File modification events trigger automatic sync and debug panel updates.

### Component Architecture
- **MarkdownRenderer-first**: All components output markdown and use `MarkdownRenderer.render()`
- **S-P-O Table Format**: CONSTRUCT results displayed as Subject-Predicate-Object tables with subject grouping
- **Auto-sync**: File saves trigger automatic triplestore synchronization
- **Modular Design**: Separated concerns into focused modules (settings, sync, commands, views)

### Link Rendering
Uses Obsidian's `MarkdownRenderer.render()` for proper wiki-link display and `workspace.openLinkText()` for navigation (see `docs/how-to.md`).

## Configuration

### Plugin Settings
Access via Obsidian Settings → Community Plugins → SPARQL:

- **Endpoint URL**: SPARQL query endpoint (default: `http://localhost:7878/query`)
- **Update URL**: SPARQL update endpoint (default: `http://localhost:7878/update`) 
- **User/Password**: Optional authentication credentials
- **OSG Path**: Path to OSG executable (default: `/home/cvasquez/.local/share/pnpm/osg`)
- **Allow Updates**: Enable SPARQL UPDATE operations in code blocks

### Commands
- **Open debug panel**: Show current file's RDF triples in side panel
- **Insert SPARQL template**: Insert query template at cursor
- **Sync current file**: Manually sync active file with triplestore
- **Sync with triplestore**: Full vault synchronization

## Plugin Installation

For development, use the symlink script to link built files to vault's `.obsidian/plugins/obsidian-sparql/` directory.