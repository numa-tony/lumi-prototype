---
name: lumi-screen
description: Fetches a Lumi Figma screen by name or node ID — returns screenshot + design specs ready for implementation
---

# /lumi-screen [screen-name-or-node-id]

Fetches design specs and screenshot from the Lumi Vision Figma file.

## Figma file

File key: `XAzcIpXCZYGvMwsNYWNUZg`

## Known screen → node ID map

| Name | Node ID |
|------|---------|
| `fab` | 6747-429 |
| `chat-idle` | 6747-495 |
| `chat-keyboard` | 6747-465 |
| `explore` | (fetch from file) |
| `trips` | (fetch from file) |
| `trip-detail` | (fetch from file) |
| `messages-inbox` | (fetch from file) |
| `profile` | (fetch from file) |

## Steps

1. If the argument is a screen name, look it up in the table above to get the node ID.
   If it's already a node ID (format `NNNN-NNNNN`), use it directly.
   If the node ID is unknown ("fetch from file"), use the Figma MCP `get_metadata` tool
   to browse the file and locate the correct node.

2. Call Figma MCP:
   - `get_screenshot` with the node ID → visual reference
   - `get_design_context` with the node ID → spacing, colors, typography, component names

3. Output:
   - The screenshot
   - A concise spec: dimensions, colors (mapped to DS tokens from `app/globals.css`),
     typography (TWK Lausanne weight + size), spacing, any component names
   - Note any DS tokens that apply (e.g. `text-text`, `border-line`, `radius-l`)

4. If implementing: reference `docs/project/decisions.md` for established patterns
   (gradient borders, icon approach, sheet animations, etc.) before writing new code.
