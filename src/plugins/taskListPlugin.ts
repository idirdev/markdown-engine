import { Plugin, Token, TokenType, Node } from '../types';

export const taskListPlugin: Plugin = {
  name: 'taskList',

  tokenize(line: string, lines: string[], index: number) {
    const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (!taskMatch) return null;

    const items: Token[] = [];
    items.push({
      type: TokenType.ListItem,
      raw: line,
      text: taskMatch[3],
      checked: taskMatch[2].toLowerCase() === 'x',
    });

    let consumed = 1;
    let i = index + 1;
    while (i < lines.length) {
      const nextMatch = lines[i].match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/);
      if (!nextMatch) break;
      items.push({
        type: TokenType.ListItem,
        raw: lines[i],
        text: nextMatch[3],
        checked: nextMatch[2].toLowerCase() === 'x',
      });
      consumed++;
      i++;
    }

    const token: Token = {
      type: TokenType.TaskList,
      raw: line,
      items,
    };

    return { token, consumed };
  },

  render(node: Node) {
    if (node.type !== TokenType.TaskList) return null;

    const items = node.children.map(child => {
      const checked = child.props.checked ? ' checked=""' : '';
      const content = child.text || child.children.map(c => c.text || '').join('');
      return `  <li class="task-list-item"><input type="checkbox" disabled=""${checked}> ${content}</li>`;
    }).join('\n');

    return `<ul class="task-list">\n${items}\n</ul>`;
  },
};
