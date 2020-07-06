import { Token, TokenType, LexerOptions, Plugin } from './types';

const PATTERNS = {
  heading: /^(#{1,6})\s+(.+)$/,
  hr: /^(\*{3,}|-{3,}|_{3,})\s*$/,
  blockquote: /^>\s?(.*)$/,
  unorderedList: /^(\s*)[-*+]\s+(.+)$/,
  orderedList: /^(\s*)\d+\.\s+(.+)$/,
  taskList: /^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/,
  codeFenceStart: /^(`{3,}|~{3,})(\w*)\s*$/,
  tableSeparator: /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/,
  tableRow: /^\|(.+)\|?\s*$/,
  image: /^!\[([^\]]*)\]\(([^)]+)\)\s*$/,
  link: /^\[([^\]]+)\]\(([^)]+)\)\s*$/,
  empty: /^\s*$/,
};

export class Lexer {
  private plugins: Plugin[];

  constructor(options?: LexerOptions) {
    this.plugins = (options && options.plugins) || [];
  }

  tokenize(markdown: string): Token[] {
    const tokens: Token[] = [];
    const lines = markdown.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Try plugins first
      let pluginHandled = false;
      for (const plugin of this.plugins) {
        if (plugin.tokenize) {
          const result = plugin.tokenize(line, lines, i);
          if (result) {
            tokens.push(result.token);
            i += result.consumed;
            pluginHandled = true;
            break;
          }
        }
      }
      if (pluginHandled) continue;

      // Empty line
      if (PATTERNS.empty.test(line)) {
        i++;
        continue;
      }

      // Fenced code block
      const fenceMatch = line.match(PATTERNS.codeFenceStart);
      if (fenceMatch) {
        const fence = fenceMatch[1];
        const lang = fenceMatch[2] || '';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length) {
          if (lines[i].startsWith(fence.charAt(0).repeat(fence.length))) {
            i++;
            break;
          }
          codeLines.push(lines[i]);
          i++;
        }
        tokens.push({
          type: TokenType.CodeBlock,
          raw: codeLines.join('\n'),
          text: codeLines.join('\n'),
          lang: lang || undefined,
        });
        continue;
      }

      // Heading
      const headingMatch = line.match(PATTERNS.heading);
      if (headingMatch) {
        tokens.push({
          type: TokenType.Heading,
          raw: line,
          text: headingMatch[2].trim(),
          depth: headingMatch[1].length,
        });
        i++;
        continue;
      }

      // Horizontal rule
      if (PATTERNS.hr.test(line)) {
        tokens.push({
          type: TokenType.HorizontalRule,
          raw: line,
        });
        i++;
        continue;
      }

      // Table detection: current line is a table row and next line is a separator
      const tableRowMatch = line.match(PATTERNS.tableRow);
      if (tableRowMatch && i + 1 < lines.length && PATTERNS.tableSeparator.test(lines[i + 1])) {
        const header = tableRowMatch[1].split('|').map(c => c.trim()).filter(c => c !== '');
        const sepLine = lines[i + 1];
        const alignCols = sepLine.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
        const align: Array<'left' | 'center' | 'right' | null> = alignCols.map(col => {
          if (col.startsWith(':') && col.endsWith(':')) return 'center';
          if (col.endsWith(':')) return 'right';
          if (col.startsWith(':')) return 'left';
          return null;
        });

        const cells: string[][] = [];
        i += 2;
        while (i < lines.length) {
          const rowMatch = lines[i].match(PATTERNS.tableRow);
          if (!rowMatch) break;
          const row = rowMatch[1].split('|').map(c => c.trim()).filter(c => c !== '');
          cells.push(row);
          i++;
        }

        tokens.push({
          type: TokenType.Table,
          raw: line,
          header,
          cells,
          align,
        });
        continue;
      }

      // Blockquote
      const bqMatch = line.match(PATTERNS.blockquote);
      if (bqMatch) {
        const bqLines: string[] = [bqMatch[1]];
        i++;
        while (i < lines.length) {
          const nextBq = lines[i].match(PATTERNS.blockquote);
          if (nextBq) {
            bqLines.push(nextBq[1]);
            i++;
          } else {
            break;
          }
        }
        tokens.push({
          type: TokenType.Blockquote,
          raw: bqLines.join('\n'),
          text: bqLines.join('\n'),
        });
        continue;
      }

      // Task list
      const taskMatch = line.match(PATTERNS.taskList);
      if (taskMatch) {
        const items: Token[] = [];
        items.push({
          type: TokenType.ListItem,
          raw: line,
          text: taskMatch[3],
          checked: taskMatch[2].toLowerCase() === 'x',
        });
        i++;
        while (i < lines.length) {
          const nextTask = lines[i].match(PATTERNS.taskList);
          if (nextTask) {
            items.push({
              type: TokenType.ListItem,
              raw: lines[i],
              text: nextTask[3],
              checked: nextTask[2].toLowerCase() === 'x',
            });
            i++;
          } else {
            break;
          }
        }
        tokens.push({
          type: TokenType.TaskList,
          raw: line,
          items,
        });
        continue;
      }

      // Unordered list
      const ulMatch = line.match(PATTERNS.unorderedList);
      if (ulMatch) {
        const items: Token[] = [];
        items.push({ type: TokenType.ListItem, raw: line, text: ulMatch[2] });
        i++;
        while (i < lines.length) {
          const nextUl = lines[i].match(PATTERNS.unorderedList);
          if (nextUl) {
            items.push({ type: TokenType.ListItem, raw: lines[i], text: nextUl[2] });
            i++;
          } else {
            break;
          }
        }
        tokens.push({
          type: TokenType.List,
          raw: line,
          items,
          ordered: false,
        });
        continue;
      }

      // Ordered list
      const olMatch = line.match(PATTERNS.orderedList);
      if (olMatch) {
        const items: Token[] = [];
        items.push({ type: TokenType.ListItem, raw: line, text: olMatch[2] });
        i++;
        while (i < lines.length) {
          const nextOl = lines[i].match(PATTERNS.orderedList);
          if (nextOl) {
            items.push({ type: TokenType.ListItem, raw: lines[i], text: nextOl[2] });
            i++;
          } else {
            break;
          }
        }
        tokens.push({
          type: TokenType.List,
          raw: line,
          items,
          ordered: true,
        });
        continue;
      }

      // Standalone image
      const imgMatch = line.match(PATTERNS.image);
      if (imgMatch) {
        tokens.push({
          type: TokenType.Image,
          raw: line,
          alt: imgMatch[1],
          href: imgMatch[2],
        });
        i++;
        continue;
      }

      // Paragraph (default)
      const paraLines: string[] = [line];
      i++;
      while (i < lines.length && !PATTERNS.empty.test(lines[i]) && !PATTERNS.heading.test(lines[i])
        && !PATTERNS.hr.test(lines[i]) && !PATTERNS.codeFenceStart.test(lines[i])
        && !PATTERNS.blockquote.test(lines[i])) {
        paraLines.push(lines[i]);
        i++;
      }
      tokens.push({
        type: TokenType.Paragraph,
        raw: paraLines.join('\n'),
        text: paraLines.join(' '),
      });
    }

    return tokens;
  }
}
