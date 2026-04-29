# Track My Application — Claude Guidelines

## Markdown files

All `.md` files must pass markdownlint with zero warnings. Apply these rules whenever generating or editing markdown:

- **Table separators** — always use `| --- |` style (space-dash-space) in every separator row. Never use `|---|` or `|-----|`.
- **Lists** — always place a blank line before the first list item and after the last list item when the list is preceded or followed by non-list content.
- **Headings** — always place a blank line before and after every heading. Never place a heading directly adjacent to a list or paragraph without a blank line between them.
- **Bold as headings** — never use `**bold text**` as a standalone paragraph to serve as a section heading. Use the appropriate heading level (`####`, `#####`, etc.) instead.
- **Inline bold** — bold (`**text**`) is fine when it appears inside a sentence alongside other text, but never as the sole content of a paragraph.
