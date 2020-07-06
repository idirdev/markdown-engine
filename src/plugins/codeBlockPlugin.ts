import { Plugin, Token, TokenType, Node } from '../types';
import { escapeHtml } from '../utils/escape';

export const codeBlockPlugin: Plugin = {
  name: 'codeBlock',

  tokenize(line: string, lines: string[], index: number) {
    const fenceMatch = line.match(/^(`{3,}|~{3,})(\w*)\s*$/);
    if (!fenceMatch) return null;

    const fenceChar = fenceMatch[1].charAt(0);
    const fenceLen = fenceMatch[1].length;
    const lang = fenceMatch[2] || '';
    const codeLines: string[] = [];
    let consumed = 1;
    let i = index + 1;

    while (i < lines.length) {
      const closingFence = new RegExp(`^${escapeRegexChars(fenceChar)}{${fenceLen},}\\s*$`);
      if (closingFence.test(lines[i])) {
        consumed++;
        break;
      }
      codeLines.push(lines[i]);
      consumed++;
      i++;
    }

    const token: Token = {
      type: TokenType.CodeBlock,
      raw: codeLines.join('\n'),
      text: codeLines.join('\n'),
      lang: lang || undefined,
    };

    return { token, consumed };
  },

  render(node: Node) {
    if (node.type !== TokenType.CodeBlock) return null;

    const lang = node.props.lang;
    const escaped = escapeHtml(node.text || '');

    if (lang) {
      return `<pre><code class="language-${escapeHtml(lang)}">${escaped}</code></pre>`;
    }
    return `<pre><code>${escaped}</code></pre>`;
  },
};

function escapeRegexChars(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
