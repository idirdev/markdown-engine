# markdown-engine

[![npm](https://img.shields.io/npm/v/markdown-engine.svg)](https://www.npmjs.com/package/markdown-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-3.7+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A markdown parser and renderer built from scratch in TypeScript. Zero dependencies. Full control over the AST.

## Supported Syntax

| Element        | Syntax                          | Status |
|----------------|---------------------------------|--------|
| Headings       | `# H1` through `###### H6`     | Yes    |
| Bold           | `**text**` or `__text__`        | Yes    |
| Italic         | `*text*` or `_text_`            | Yes    |
| Inline code    | `` `code` ``                    | Yes    |
| Code blocks    | ```` ``` ```` or `~~~`          | Yes    |
| Links          | `[text](url)`                   | Yes    |
| Images         | `![alt](url)`                   | Yes    |
| Unordered list | `- item` or `* item`            | Yes    |
| Ordered list   | `1. item`                       | Yes    |
| Blockquote     | `> text`                        | Yes    |
| Horizontal rule| `---` or `***` or `___`         | Yes    |
| Tables         | `| col | col |` with alignment  | Yes    |
| Task lists     | `- [x] done` / `- [ ] todo`    | Yes    |

## Installation

```bash
npm install markdown-engine
```

## Quick Start

```typescript
import { render } from 'markdown-engine';

const html = render('# Hello **World**');
// <h1 id="hello-world">Hello <strong>World</strong></h1>
```

## API

### `render(markdown: string, options?: MarkdownOptions): string`

Parses and renders markdown to HTML in a single call.

### `parse(markdown: string, options?: MarkdownOptions): AST`

Parses markdown into an AST without rendering. Useful for custom transformations.

### Classes

- **`Lexer`** -- Tokenizes raw markdown text into a flat token array.
- **`Parser`** -- Transforms tokens into a nested AST with inline element parsing.
- **`Renderer`** -- Walks the AST and produces an HTML string.

```typescript
import { Lexer, Parser, Renderer } from 'markdown-engine';

const lexer = new Lexer();
const parser = new Parser();
const renderer = new Renderer({ xhtml: true });

const tokens = lexer.tokenize('**bold** and *italic*');
const ast = parser.parse(tokens);
const html = renderer.render(ast);
```

## Plugin System

Plugins can hook into tokenization, parsing, and rendering stages.

```typescript
import { render, tablePlugin, codeBlockPlugin, taskListPlugin } from 'markdown-engine';

const html = render(source, {
  plugins: [tablePlugin, codeBlockPlugin, taskListPlugin],
});
```

Each plugin implements the `Plugin` interface:

```typescript
interface Plugin {
  name: string;
  tokenize?(line: string, lines: string[], index: number): { token: Token; consumed: number } | null;
  parse?(token: Token): Node | null;
  render?(node: Node): string | null;
}
```

## Comparison

| Feature          | markdown-engine | marked  | markdown-it |
|------------------|-----------------|---------|-------------|
| Zero deps        | Yes             | Yes     | No          |
| TypeScript       | Native          | Partial | No          |
| Plugin system    | Yes             | Limited | Yes         |
| AST access       | Yes             | No      | Yes         |
| Bundle size      | ~8 KB           | ~28 KB  | ~56 KB      |

## License

MIT

---

## 🇫🇷 Documentation en français

### Description
`markdown-engine` est un parseur et moteur de rendu Markdown construit from scratch en TypeScript, sans aucune dépendance externe. Il offre un accès complet à l'AST (arbre syntaxique abstrait) et un système de plugins pour personnaliser la tokenisation, le parsing et le rendu.

### Installation
```bash
npm install markdown-engine
```

### Utilisation
```typescript
import { render } from 'markdown-engine';

const html = render('# Bonjour **le monde**');
// <h1 id="bonjour-le-monde">Bonjour <strong>le monde</strong></h1>
```

Consultez la documentation anglaise ci-dessus pour l'API complète (Lexer, Parser, Renderer) et le système de plugins.