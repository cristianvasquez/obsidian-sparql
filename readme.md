# obsidian-sparql

A SPARQL alternative to Dataview for Obsidian. Query your markdown notes using standard RDF/SPARQL, with support for
cross-vault and cross-repository querying through shared triplestores.

## What it does

Your markdown files are indexed as RDF triples
using [vault-triplifier](https://github.com/cristianvasquez/vault-triplifier) and stored in a triplestore. You can then:

- **Run SPARQL queries** in `osg` code blocks within your notes
- **View contextual panels** showing query results for the current file you're viewing
- **Query across multiple vaults** when using a shared triplestore

Unlike Dataview's custom query language, this uses standard SPARQL, making your queries interoperable with other RDF
tools and enabling external systems (like MCP servers) to query your knowledge base.

## Features

- **In-memory triplestore**: Start immediately without external setup
- **Cross-vault querying**: Query across multiple Obsidian vaults from a shared triplestore
- **Contextual panels**: Automatic query results for the file you're currently viewing
- **Agent integration**: External tools can query your knowledge base via SPARQL endpoints
- **RDF ecosystem**: Leverage existing SPARQL tools and semantic web technologies

## Installation

Download zip archive from GitHub releases page. Extract the archive into <vault>/.obsidian/plugins.

Or install the plugin via [BRAT](https://tfthacker.com/BRAT) using this repository URL

## Quick start

1. Enable the plugin.  (uses in-memory triplestore by default)
2. Run the index command
3. Query your notes using `osg` code blocks:

```osg
SELECT ?p ?o WHERE {
  ?s ?p ?o .
} LIMIT 5
```

It will display 5 random 'triples'.

To narrow down to the current note, you can use the name of the note as subject.

```osg
SELECT ?p ?o WHERE {
  [[Current Note]] ?p ?o .
}
```

- For external triplestore: Configure endpoint in settings
- Open the panel to view contextual queries for your current file

## Template system

SPARQL queries will overwrite special tokens before querying

- `__THIS__`: Current note name URI (`urn:name:NoteName`)
- `__DOC__`: Current note file URI (`file:///absolute/path`)
- `__property__`: Property placeholders (e.g., `__label__` → `<urn:property:label>`)
- `[[Note Name]]`: Converts to name URIs in queries

## Example queries

See [example-panels/](./example-panels/) for ready-to-use SPARQL queries covering backlinks, stats, navigation, etc.

## Commands

- **Open panel**: View current file's RDF triples
- **Insert SPARQL template**: Add query template at cursor
- **Sync current file**: Sync active file with triplestore
- **Sync with triplestore**: Full vault synchronization

## Development

```bash
npm run dev    # Development with hot reload
npm run build  # Production build
npm test       # Run tests
```

See [CLAUDE.md](./CLAUDE.md) for architecture details
and [vault-triplifier](https://github.com/cristianvasquez/vault-triplifier) for RDF conversion examples.
