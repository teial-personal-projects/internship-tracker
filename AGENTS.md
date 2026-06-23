# Track My Application — Codex Guidelines

## Markdown files

All `.md` files must pass markdownlint with zero warnings. Apply these rules whenever generating or editing markdown:

- **Table separators** — always use `| --- |` style (space-dash-space) in every separator row. Never use `|---|` or `|-----|`.
- **Lists** — always place a blank line before the first list item and after the last list item when the list is preceded or followed by non-list content.
- **Headings** — always place a blank line before and after every heading. Never place a heading directly adjacent to a list or paragraph without a blank line between them.
- **Bold as headings** — never use `**bold text**` as a standalone paragraph to serve as a section heading. Use the appropriate heading level (`####`, `#####`, etc.) instead.
- **Inline bold** — bold (`**text**`) is fine when it appears inside a sentence alongside other text, but never as the sole content of a paragraph.

## Implementation plans

Implementation plans should use simple two-level numbered checklists:

- Use top-level sections like `## Step 1 — Data Model`.
- Under each step, number tasks as `1.1 [ ]`, `1.2 [ ]`, `2.1 [ ]`, and so on.
- Do not use deeper nested numbering such as `1.2.3`.
- Keep the `[ ]` marker directly beside the numbered task so the item is easy to mark complete.
