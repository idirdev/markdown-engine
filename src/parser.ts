import { Token, TokenType, Node, AST, ParserOptions, Plugin } from './types';

const INLINE_PATTERNS = {
  bold: /\*\*(.+?)\*\*|__(.+?)__/g,
  italic: /\*(.+?)\*|_(.+?)_/g,
  code: /`([^`]+)`/g,
  link: /\[([^\]]+)\]\(([^)]+)\)/g,
  image: /!\[([^\]]*)\]\(([^)]+)\)/g,
  lineBreak: /  \n/g,
};

export class Parser {
  private plugins: Plugin[];

  constructor(options?: ParserOptions) {
    this.plugins = (options && options.plugins) || [];
  }

  parse(tokens: Token[]): AST {
    const ast: AST = {
      type: 'root',
      children: [],
    };

    for (const token of tokens) {
      // Try plugins first
      let pluginNode: Node | null = null;
      for (const plugin of this.plugins) {
        if (plugin.parse) {
          pluginNode = plugin.parse(token);
          if (pluginNode) break;
        }
      }
      if (pluginNode) {
        ast.children.push(pluginNode);
        continue;
      }

      const node = this.parseToken(token);
      if (node) {
        ast.children.push(node);
      }
    }

    return ast;
  }

  private parseToken(token: Token): Node | null {
    switch (token.type) {
      case TokenType.Heading:
        return {
          type: TokenType.Heading,
          children: this.parseInline(token.text || ''),
          props: { depth: token.depth || 1 },
        };

      case TokenType.Paragraph:
        return {
          type: TokenType.Paragraph,
          children: this.parseInline(token.text || ''),
          props: {},
        };

      case TokenType.CodeBlock:
        return {
          type: TokenType.CodeBlock,
          children: [],
          props: { lang: token.lang || null },
          text: token.text || '',
        };

      case TokenType.Blockquote:
        return {
          type: TokenType.Blockquote,
          children: this.parseInline(token.text || ''),
          props: {},
        };

      case TokenType.HorizontalRule:
        return {
          type: TokenType.HorizontalRule,
          children: [],
          props: {},
        };

      case TokenType.List:
        return {
          type: TokenType.List,
          children: (token.items || []).map(item => ({
            type: TokenType.ListItem,
            children: this.parseInline(item.text || ''),
            props: {},
          })),
          props: { ordered: token.ordered || false },
        };

      case TokenType.TaskList:
        return {
          type: TokenType.TaskList,
          children: (token.items || []).map(item => ({
            type: TokenType.ListItem,
            children: this.parseInline(item.text || ''),
            props: { checked: item.checked || false },
          })),
          props: {},
        };

      case TokenType.Table:
        return this.parseTable(token);

      case TokenType.Image:
        return {
          type: TokenType.Image,
          children: [],
          props: { href: token.href || '', alt: token.alt || '' },
        };

      default:
        return null;
    }
  }

  private parseTable(token: Token): Node {
    const headerCells: Node[] = (token.header || []).map((cell, idx) => ({
      type: TokenType.TableHeader,
      children: this.parseInline(cell),
      props: { align: token.align ? token.align[idx] : null },
    }));

    const rows: Node[] = (token.cells || []).map(row => ({
      type: TokenType.TableRow,
      children: row.map((cell, idx) => ({
        type: TokenType.TableCell,
        children: this.parseInline(cell),
        props: { align: token.align ? token.align[idx] : null },
      })),
      props: {},
    }));

    return {
      type: TokenType.Table,
      children: [
        { type: TokenType.TableRow, children: headerCells, props: { header: true } },
        ...rows,
      ],
      props: { align: token.align || [] },
    };
  }

  parseInline(text: string): Node[] {
    const nodes: Node[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      // Image (must be checked before link since it starts with !)
      const imgMatch = /!\[([^\]]*)\]\(([^)]+)\)/.exec(remaining);
      // Link
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(remaining);
      // Bold
      const boldMatch = /\*\*(.+?)\*\*|__(.+?)__/.exec(remaining);
      // Italic (avoid matching bold **)
      const italicMatch = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/.exec(remaining);
      // Inline code
      const codeMatch = /`([^`]+)`/.exec(remaining);

      // Find earliest match
      const matches = [
        imgMatch ? { type: 'image' as const, match: imgMatch } : null,
        linkMatch ? { type: 'link' as const, match: linkMatch } : null,
        boldMatch ? { type: 'bold' as const, match: boldMatch } : null,
        italicMatch ? { type: 'italic' as const, match: italicMatch } : null,
        codeMatch ? { type: 'code' as const, match: codeMatch } : null,
      ].filter((m): m is NonNullable<typeof m> => m !== null);

      if (matches.length === 0) {
        if (remaining.length > 0) {
          nodes.push({ type: TokenType.Text, children: [], props: {}, text: remaining });
        }
        break;
      }

      matches.sort((a, b) => a.match.index! - b.match.index!);
      const earliest = matches[0];
      const idx = earliest.match.index!;

      // Push text before the match
      if (idx > 0) {
        nodes.push({ type: TokenType.Text, children: [], props: {}, text: remaining.slice(0, idx) });
      }

      switch (earliest.type) {
        case 'image':
          nodes.push({
            type: TokenType.Image,
            children: [],
            props: { alt: earliest.match[1], href: earliest.match[2] },
          });
          break;
        case 'link':
          nodes.push({
            type: TokenType.Link,
            children: this.parseInline(earliest.match[1]),
            props: { href: earliest.match[2] },
          });
          break;
        case 'bold':
          nodes.push({
            type: TokenType.Bold,
            children: this.parseInline(earliest.match[1] || earliest.match[2]),
            props: {},
          });
          break;
        case 'italic':
          nodes.push({
            type: TokenType.Italic,
            children: this.parseInline(earliest.match[1] || earliest.match[2]),
            props: {},
          });
          break;
        case 'code':
          nodes.push({
            type: TokenType.Code,
            children: [],
            props: {},
            text: earliest.match[1],
          });
          break;
      }

      remaining = remaining.slice(idx + earliest.match[0].length);
    }

    return nodes;
  }
}
