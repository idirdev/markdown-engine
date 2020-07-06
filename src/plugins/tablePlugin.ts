import { Plugin, Token, TokenType, Node } from '../types';
import { escapeHtml } from '../utils/escape';

export const tablePlugin: Plugin = {
  name: 'table',

  tokenize(line: string, lines: string[], index: number) {
    const rowMatch = line.match(/^\|(.+)\|?\s*$/);
    if (!rowMatch || index + 1 >= lines.length) return null;

    const sepLine = lines[index + 1];
    if (!/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(sepLine)) return null;

    const header = rowMatch[1].split('|').map(c => c.trim()).filter(c => c !== '');

    const alignCols = sepLine.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
    const align: Array<'left' | 'center' | 'right' | null> = alignCols.map(col => {
      const left = col.startsWith(':');
      const right = col.endsWith(':');
      if (left && right) return 'center';
      if (right) return 'right';
      if (left) return 'left';
      return null;
    });

    const cells: string[][] = [];
    let consumed = 2;
    let i = index + 2;
    while (i < lines.length) {
      const nextRow = lines[i].match(/^\|(.+)\|?\s*$/);
      if (!nextRow) break;
      const row = nextRow[1].split('|').map(c => c.trim()).filter(c => c !== '');
      // Pad row to match header length
      while (row.length < header.length) row.push('');
      cells.push(row);
      consumed++;
      i++;
    }

    const token: Token = {
      type: TokenType.Table,
      raw: line,
      header,
      cells,
      align,
    };

    return { token, consumed };
  },

  render(node: Node) {
    if (node.type !== TokenType.Table) return null;

    let html = '<table>\n';
    const rows = node.children;

    if (rows.length > 0 && rows[0].props.header) {
      html += '<thead>\n<tr>\n';
      rows[0].children.forEach(cell => {
        const alignAttr = cell.props.align ? ` style="text-align:${cell.props.align}"` : '';
        html += `  <th${alignAttr}>${cell.text || cell.children.map(c => c.text || '').join('')}</th>\n`;
      });
      html += '</tr>\n</thead>\n';
    }

    if (rows.length > 1) {
      html += '<tbody>\n';
      for (let i = 1; i < rows.length; i++) {
        html += '<tr>\n';
        rows[i].children.forEach(cell => {
          const alignAttr = cell.props.align ? ` style="text-align:${cell.props.align}"` : '';
          html += `  <td${alignAttr}>${cell.text || cell.children.map(c => c.text || '').join('')}</td>\n`;
        });
        html += '</tr>\n';
      }
      html += '</tbody>\n';
    }

    html += '</table>';
    return html;
  },
};
