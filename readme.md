# obsidian-sparql

An Obsidian plugin that transforms your vault into a queryable RDF graph, enabling powerful SPARQL queries against your notes and their relationships.

## Features

- **SPARQL Queries**: Run semantic queries directly in your notes using `osg` code blocks
- **Example Panels**: Ready-to-use SPARQL query panels in [example-panels/](./example-panels/)
- **Auto-sync**: Automatic triplestore synchronization on file saves
- **Debug Panel**: Live view of current note's RDF triples
- **Property Placeholders**: Use `__label__`, `__type__` syntax for cleaner queries
- **Wiki Link Integration**: Query relationships between `[[linked notes]]`
- **Configurable**: Customizable SPARQL endpoints and OSG paths

## Quick Start

1. Install the plugin in Obsidian
2. Configure SPARQL endpoint in settings (default: `http://localhost:7878/query`)
3. Set OSG path for triplestore sync
4. Add SPARQL queries to your notes:

```sparql
```osg
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?note ?label WHERE {
  ?note __label__ ?label
  FILTER(CONTAINS(?label, "project"))
}
```
```

## Example Panels

The [example-panels/](./example-panels/) directory contains 7 ready-to-use SPARQL query panels:

- **Backlinks and Links**: Find all notes linking to/from current note
- **Document Triples**: Show all RDF triples for current document
- **Navigation View**: Explore note relationships and connections
- **PIMO**: Personal Information Model queries
- **Stats**: Vault statistics and metrics
- **Synonyms**: Find similar or related terms
- **Tags**: Query notes by tags and categories

Copy these panels to your vault and use them via the debug panel or as `osg` code blocks.

## Template System

- `__THIS__`: Current note name URI
- `__DOC__`: Current note file URI  
- `__property__`: Property placeholders (e.g., `__label__`, `__created__`)
- `[[Note Name]]`: Wiki links to other notes

## Commands

- **Open debug panel**: View current file's RDF graph
- **Insert SPARQL template**: Quick query template insertion
- **Sync current file**: Manual file synchronization
- **Sync with triplestore**: Full vault sync

## Development

```bash
npm install
npm run build
npm test
```

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidelines.
