# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin that allows querying the knowledge graph of your notes using SPARQL. It converts Obsidian notes into RDF triples and provides a SPARQL interface to query the resulting knowledge graph.

## Core Architecture

### Plugin Structure
- **Main Plugin Class**: `Prototype_11` in `src/main.js` - Entry point that extends Obsidian's Plugin class
- **Triplestore Integration**: `src/lib/Triplestore.js` - Wrapper around SPARQL HTTP client for RDF operations
- **Vue Components**: Located in `src/components/` - UI components for SPARQL query interface
- **RDF Namespace Management**: `src/namespaces.js` - Centralized namespace definitions using rdf-ext

### Key Components
- **VaultTriplifier**: Converts Obsidian notes to RDF triples (from vault-triplifier package)
- **SPARQL Client**: Uses `sparql-http-client` for communicating with triplestore endpoints
- **Event System**: Custom EventEmitter for handling file changes and updates
- **Vue Integration**: Vue 3 apps for reactive UI components

### Code Block Processors
- `osg`: Executes SPARQL queries in markdown code blocks
- `osg-debug`: Shows debug information for SPARQL queries

## Development Commands

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

## Build System

The project uses Vite for building with Vue support:
- **Entry Point**: `src/main.js`
- **Output**: Builds to `dist/main.js` and copies to root `main.js` for Obsidian
- **Target**: ES2018 for Obsidian compatibility
- **External Dependencies**: `obsidian` is treated as external
- **Vue Integration**: Uses `@vitejs/plugin-vue` for Vue SFC compilation

## Testing

Uses Vitest with Vue Test Utils:
- **Test Environment**: `happy-dom` for DOM simulation
- **Configuration**: `vitest.config.js` with Vue plugin
- **Test Files**: Located alongside components (e.g., `src/components/App.test.js`)

## Key Dependencies

### Core Dependencies
- `obsidian-community-lib`: Obsidian API helpers
- `rdf-ext`: RDF data model and utilities
- `sparql-http-client`: SPARQL endpoint communication
- `sparqljs`: SPARQL query parsing and manipulation
- `vault-triplifier`: Converts Obsidian notes to RDF

### Development Dependencies
- `vite`: Build tool
- `vue`: UI framework
- `vitest`: Testing framework
- `@vitejs/plugin-vue`: Vue support for Vite

## Plugin Configuration

Default settings include:
- SPARQL endpoint: `http://localhost:7878/query`
- Update endpoint: `http://localhost:7878/update`
- Sync command: Configurable shell command for triplestore synchronization
- Update permissions: Toggle for allowing SPARQL updates

## File Structure Conventions

- `src/main.js`: Plugin entry point and Obsidian integration
- `src/components/`: Vue components for UI
- `src/lib/`: Core business logic and utilities
- `src/namespaces.js`: RDF namespace definitions
- `manifest.json`: Obsidian plugin manifest
- `main.js`: Built plugin file (generated, not edited directly)

## Development Notes

- The plugin registers markdown code block processors for SPARQL queries
- Uses Vue 3 with composition API for reactive components
- Integrates with Obsidian's file system events for automatic RDF updates
- Supports both query and update operations via SPARQL endpoints
- Provides a side panel view for interactive SPARQL querying

## CRITICAL ISSUE: Internal URI Detection Not Working

**Problem**: The internal URI detection logic is failing at runtime, preventing vault files from being rendered as clickable internal links.

**Symptoms**:
- SPARQL query results show URIs like `file:///path/to/file.md` and `urn:name:Note Name` 
- These URIs are being rendered as plain text instead of clickable `[[Note Name]]` links
- The `shrink()` function is being applied to all URIs instead of only external ones

**Root Cause**: The `isClickableInternalUri()` function in `src/lib/uriUtils.js` is not properly detecting vault URIs from Term objects.

**Investigation Done**:
1. Confirmed that SPARQL results contain proper RDF Term objects (NamedNode, Literal, BlankNode)
2. Added debug logging that shows URIs are being checked correctly
3. Verified the `vault-triplifier` functions (`pathFromUri`, `nameFromUri`) are available
4. Updated all components to work with Term objects instead of strings

**Files Modified**:
- `src/lib/uriUtils.js` - Core URI detection logic using vault-triplifier
- `src/components/SimpleTable.vue` - Updated to use Term objects for rendering
- `src/components/helpers/InternalLink.vue` - Updated prop types from String to Object
- `tests/` - Partially updated tests to use Term objects

**Expected Behavior**:
- `file:///path/to/file.md` URIs should render as clickable file links
- `urn:name:Note Name` URIs should render as clickable `[[Note Name]]` links
- `urn:property:propertyName` URIs should render as plain text property names
- External URIs should be shortened using `shrink()`

**Current Status**: 
- The URI detection functions are implemented but not working at runtime
- Tests are failing due to string vs Term object mismatches
- The core functionality needs debugging to understand why vault-triplifier functions aren't detecting vault URIs properly

**Next Steps**:
1. Debug the `vault-triplifier` functions to see what they return for actual vault URIs
2. Verify the URI format expectations vs actual data from SPARQL results
3. Fix the detection logic to properly identify vault resources
4. Update all remaining tests to use Term objects consistently