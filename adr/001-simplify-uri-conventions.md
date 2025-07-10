---
type: immutable document
title: Simplify URI Conventions to File and Name Resources Only
status: proposed
decision_date: 2025-01-10
documented_date: 2025-01-10
tags:
  - adr/obsidian-sparql
---

# ADR-001: Simplify URI Conventions to File and Name Resources Only

## Relations
- decided by :: [[cvasquez]]
- stakeholder :: [[OSG system]]
- relates to :: [[vault-triplifier]]

## Status
proposed

## Context

The obsidian-sparql plugin was experiencing significant issues with URI detection and link rendering. The codebase had evolved to support multiple URI schemes:

1. `urn:resource:` URIs (purpose unclear, inconsistent implementation)
2. `file://` URIs for file system paths
3. `urn:name:` URIs for note names
4. `urn:property:` URIs for properties
5. References to `vault://` URIs in tests but no implementation

This complexity led to:
- Internal URI detection failing at runtime
- Inconsistent handling between absolute and relative paths
- Confusion about which vault-triplifier functions to use
- Links not appearing as clickable in SPARQL query results
- Test failures due to string vs Term object mismatches

The primary issue was that the URI detection logic couldn't reliably determine which URIs belonged to the current vault, causing vault files to be rendered as plain text instead of clickable internal links.

## Decision

Simplify the URI system to only three well-defined types:

### 1. File Resources (Absolute Paths)
- **Format**: `file:///absolute/path/to/file.md`
- **Purpose**: Reference actual files on the filesystem
- **Detection**: Internal if absolute path starts with vault base path
- **Example**: `file:///home/user/vault/Journal/2025-07-10.md`

### 2. Name Resources (Note Names)
- **Format**: `urn:name:NoteName`
- **Purpose**: Reference notes by their Obsidian display name
- **Detection**: Always treated as internal (resolved or unresolved)
- **Name Extraction**: Standard Obsidian logic (filename without .md extension)
- **Example**: `urn:name:2025-07-10`

### 3. Properties (Unchanged)
- **Format**: `urn:property:propertyName`
- **Purpose**: Metadata properties/predicates
- **Rendering**: Plain text property names

### Internal Detection Logic
- **File URIs**: Use `isFileInVault(absolutePath, app)` to check if path starts with vault base path
- **Name URIs**: Always honor them, distinguish between resolved (file exists in vault) and unresolved (file doesn't exist in current vault)
- **Cross-vault navigation**: Planned for future development

## Consequences

### Positive
- **Cleaner codebase**: Remove confusing `urn:resource:` handling
- **Reliable URI detection**: Clear rules for what constitutes an internal URI
- **Obsidian compatibility**: Name-based URIs work with Obsidian's internal search
- **OSG system integration**: Consistent with synchronization conventions
- **Future extensibility**: Foundation for cross-vault navigation
- **Better separation of concerns**: obsidianUtils for vault-specific logic, uriUtils for stateless URI processing

### Negative
- **Breaking change**: Requires updates to all URI-handling code
- **Test updates**: All existing tests need to be updated for new conventions
- **vault-triplifier dependency**: Must ensure vault-triplifier produces URIs in expected formats

## Alternatives Considered

### Keep Complex Multi-Scheme System
- **Why Rejected**: Was causing bugs and confusion in the codebase
- **Testing Results**: URI detection failing, links not working
- **Issues**: Unclear semantics, inconsistent implementation

### Use vault:// URIs
- **Why Rejected**: Would require extensive changes to vault-triplifier
- **Testing Results**: Mentioned in tests but no implementation found
- **Issues**: Not supported by existing tooling

### Relative Path URIs
- **Why Rejected**: Obsidian and vault-triplifier work better with absolute paths and names
- **Testing Results**: Template system already moved to absolute paths
- **Issues**: Inconsistent with OSG system conventions