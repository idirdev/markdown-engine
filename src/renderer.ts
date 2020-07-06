import { Node, AST, TokenType, RendererOptions, Plugin } from './types';
import { escapeHtml } from './utils/escape';

export class Renderer {
  private options: RendererOptions;
  private plugins: Plugin[];

  constructor(options?: RendererOptions & { plugins?: Plugin[] }) {
    this.options = {
      sanitize: (options && options.sanitize) || false,
      xhtml: (options && options.xhtml) || false,
    };
    this.plugins = (options && options.plugins) || [];
  }

  render(ast: AST): string {
    return ast.children.map(node => this.renderNode(node)).join('\n');
  }

  private renderNode(node: Node): string {
    // Try plugins first
    for (const plugin of this.plugins) {
      if (plugin.render) {
        const result = plugin.render(node);
        if (result !== null) return result;
      }
    }

    switch (node.type) {
      case TokenType.Heading:
        return this.renderHeading(node);
      case TokenType.Paragraph:
        return this.renderParagraph(node);
      case TokenType.Bold:
        return `<strong>${this.renderChildren(node)}</strong>`;
      case TokenType.Italic:
        return `<em>${this.renderChildren(node)}</em>`;
      case TokenType.Code:
        return `<code>${escapeHtml(node.text || '')}</code>`;
      case TokenType.CodeBlock:
        return this.renderCodeBlock(node);
      case TokenType.Link:
        return this.renderLink(node);
      case TokenType.Image:
        return this.renderImage(node);
      case TokenType.List:
        return this.renderList(node);
      case TokenType.ListItem:
        return `<li>${this.renderChildren(node)}</li>`;
      case TokenType.TaskList:
        return this.renderTaskList(node);
      case TokenType.Blockquote:
        return `<blockquote>\n<p>${this.renderChildren(node)}</p>\n</blockquote>`;
      case TokenType.HorizontalRule:
        return this.options.xhtml ? '<hr />' : '<hr>';
      case TokenType.Table:
        return this.renderTable(node);
      case TokenType.Text:
        return this.options.sanitize ? escapeHtml(node.text || '') : (node.text || '');
      case TokenType.LineBreak:
        return this.options.xhtml ? '<br />' : '<br>';
      default:
        return this.renderChildren(node);
    }
  }

  private renderChildren(node: Node): string {
    return node.children.map(child => this.renderNode(child)).join('');
  }

  private renderHeading(node: Node): string {
    const depth = node.props.depth || 1;
    const id = (node.text || this.getTextContent(node))
      .toLowerCase()
      .replace(/[^\w]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `<h${depth} id="${id}">${this.renderChildren(node)}</h${depth}>`;
  }

  private renderParagraph(node: Node): string {
    return `<p>${this.renderChildren(node)}</p>`;
  }

  private renderCodeBlock(node: Node): string {
    const lang = node.props.lang;
    const code = escapeHtml(node.text || '');
    if (lang) {
      return `<pre><code class="language-${escapeHtml(lang)}">${code}</code></pre>`;
    }
    return `<pre><code>${code}</code></pre>`;
  }

  private renderLink(node: Node): string {
    const href = this.options.sanitize ? escapeHtml(node.props.href || '') : (node.props.href || '');
    return `<a href="${href}">${this.renderChildren(node)}</a>`;
  }

  private renderImage(node: Node): string {
    const src = node.props.href || '';
    const alt = escapeHtml(node.props.alt || '');
    if (this.options.xhtml) {
      return `<img src="${src}" alt="${alt}" />`;
    }
    return `<img src="${src}" alt="${alt}">`;
  }

  private renderList(node: Node): string {
    const tag = node.props.ordered ? 'ol' : 'ul';
    const items = node.children.map(child => `  <li>${this.renderChildren(child)}</li>`).join('\n');
    return `<${tag}>\n${items}\n</${tag}>`;
  }

  private renderTaskList(node: Node): string {
    const items = node.children.map(child => {
      const checked = child.props.checked ? ' checked=""' : '';
      const checkbox = `<input type="checkbox" disabled=""${checked}> `;
      return `  <li class="task-list-item">${checkbox}${this.renderChildren(child)}</li>`;
    }).join('\n');
    return `<ul class="task-list">\n${items}\n</ul>`;
  }

  private renderTable(node: Node): string {
    const rows = node.children;
    let html = '<table>\n';

    if (rows.length > 0 && rows[0].props.header) {
      html += '<thead>\n<tr>\n';
      rows[0].children.forEach(cell => {
        const align = cell.props.align ? ` align="${cell.props.align}"` : '';
        html += `<th${align}>${this.renderChildren(cell)}</th>\n`;
      });
      html += '</tr>\n</thead>\n';
    }

    html += '<tbody>\n';
    for (let i = 1; i < rows.length; i++) {
      html += '<tr>\n';
      rows[i].children.forEach(cell => {
        const align = cell.props.align ? ` align="${cell.props.align}"` : '';
        html += `<td${align}>${this.renderChildren(cell)}</td>\n`;
      });
      html += '</tr>\n';
    }
    html += '</tbody>\n</table>';

    return html;
  }

  private getTextContent(node: Node): string {
    if (node.text) return node.text;
    return node.children.map(child => this.getTextContent(child)).join('');
  }
}
