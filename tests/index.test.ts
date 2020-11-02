import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer';
import { Parser } from '../src/parser';
import { Renderer } from '../src/renderer';
import { render, parse, TokenType } from '../src/index';
import { escapeHtml, unescapeHtml, encodeUrl, decodeUrl } from '../src/utils/escape';

describe('Lexer', () => {
  const lexer = new Lexer();

  it('should tokenize headings', () => {
    const tokens = lexer.tokenize('# Hello World');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.Heading);
    expect(tokens[0].text).toBe('Hello World');
    expect(tokens[0].depth).toBe(1);
  });

  it('should tokenize different heading levels', () => {
    const tokens = lexer.tokenize('## H2\n### H3\n#### H4');
    expect(tokens).toHaveLength(3);
    expect(tokens[0].depth).toBe(2);
    expect(tokens[1].depth).toBe(3);
    expect(tokens[2].depth).toBe(4);
  });

  it('should tokenize paragraphs', () => {
    const tokens = lexer.tokenize('Hello world');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.Paragraph);
    expect(tokens[0].text).toBe('Hello world');
  });

  it('should tokenize fenced code blocks', () => {
    const tokens = lexer.tokenize('```javascript\nconst x = 1;\n```');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.CodeBlock);
    expect(tokens[0].lang).toBe('javascript');
    expect(tokens[0].text).toBe('const x = 1;');
  });

  it('should tokenize horizontal rules', () => {
    const tokens = lexer.tokenize('---');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.HorizontalRule);
  });

  it('should tokenize blockquotes', () => {
    const tokens = lexer.tokenize('> This is a quote');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.Blockquote);
    expect(tokens[0].text).toBe('This is a quote');
  });

  it('should tokenize unordered lists', () => {
    const tokens = lexer.tokenize('- Item 1\n- Item 2\n- Item 3');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.List);
    expect(tokens[0].ordered).toBe(false);
    expect(tokens[0].items).toHaveLength(3);
  });

  it('should tokenize ordered lists', () => {
    const tokens = lexer.tokenize('1. First\n2. Second\n3. Third');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.List);
    expect(tokens[0].ordered).toBe(true);
    expect(tokens[0].items).toHaveLength(3);
  });

  it('should tokenize tables', () => {
    const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
    const tokens = lexer.tokenize(md);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.Table);
    expect(tokens[0].header).toEqual(['A', 'B']);
    expect(tokens[0].cells).toEqual([['1', '2']]);
  });

  it('should tokenize standalone images', () => {
    const tokens = lexer.tokenize('![Alt text](image.png)');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.Image);
    expect(tokens[0].alt).toBe('Alt text');
    expect(tokens[0].href).toBe('image.png');
  });

  it('should skip empty lines', () => {
    const tokens = lexer.tokenize('\n\n# Hello\n\n');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.Heading);
  });

  it('should tokenize task lists', () => {
    const tokens = lexer.tokenize('- [x] Done\n- [ ] Not done');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.TaskList);
    expect(tokens[0].items).toHaveLength(2);
    expect(tokens[0].items![0].checked).toBe(true);
    expect(tokens[0].items![1].checked).toBe(false);
  });
});

describe('Parser', () => {
  const lexer = new Lexer();
  const parser = new Parser();

  it('should parse tokens into AST', () => {
    const tokens = lexer.tokenize('# Hello');
    const ast = parser.parse(tokens);
    expect(ast.type).toBe('root');
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0].type).toBe(TokenType.Heading);
    expect(ast.children[0].props.depth).toBe(1);
  });

  it('should parse inline bold', () => {
    const tokens = lexer.tokenize('**bold text**');
    const ast = parser.parse(tokens);
    const paragraph = ast.children[0];
    const boldNode = paragraph.children.find(n => n.type === TokenType.Bold);
    expect(boldNode).toBeDefined();
  });

  it('should parse inline italic', () => {
    const tokens = lexer.tokenize('*italic text*');
    const ast = parser.parse(tokens);
    const paragraph = ast.children[0];
    const italicNode = paragraph.children.find(n => n.type === TokenType.Italic);
    expect(italicNode).toBeDefined();
  });

  it('should parse inline code', () => {
    const tokens = lexer.tokenize('Use `code` here');
    const ast = parser.parse(tokens);
    const paragraph = ast.children[0];
    const codeNode = paragraph.children.find(n => n.type === TokenType.Code);
    expect(codeNode).toBeDefined();
    expect(codeNode!.text).toBe('code');
  });

  it('should parse inline links', () => {
    const tokens = lexer.tokenize('[Click here](https://example.com)');
    const ast = parser.parse(tokens);
    const paragraph = ast.children[0];
    const linkNode = paragraph.children.find(n => n.type === TokenType.Link);
    expect(linkNode).toBeDefined();
    expect(linkNode!.props.href).toBe('https://example.com');
  });

  it('should parse list items', () => {
    const tokens = lexer.tokenize('- A\n- B');
    const ast = parser.parse(tokens);
    const listNode = ast.children[0];
    expect(listNode.type).toBe(TokenType.List);
    expect(listNode.children).toHaveLength(2);
    expect(listNode.props.ordered).toBe(false);
  });
});

describe('Renderer', () => {
  const renderer = new Renderer();
  const lexer = new Lexer();
  const parser = new Parser();

  function renderMarkdown(md: string): string {
    const tokens = lexer.tokenize(md);
    const ast = parser.parse(tokens);
    return renderer.render(ast);
  }

  it('should render headings', () => {
    const html = renderMarkdown('# Hello');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('</h1>');
  });

  it('should render heading with ID', () => {
    const html = renderMarkdown('# My Title');
    expect(html).toContain('id="my-title"');
  });

  it('should render paragraphs', () => {
    const html = renderMarkdown('Hello world');
    expect(html).toContain('<p>');
    expect(html).toContain('Hello world');
    expect(html).toContain('</p>');
  });

  it('should render bold text', () => {
    const html = renderMarkdown('**bold**');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('should render italic text', () => {
    const html = renderMarkdown('*italic*');
    expect(html).toContain('<em>italic</em>');
  });

  it('should render inline code', () => {
    const html = renderMarkdown('Use `code` here');
    expect(html).toContain('<code>code</code>');
  });

  it('should render code blocks', () => {
    const html = renderMarkdown('```javascript\nconst x = 1;\n```');
    expect(html).toContain('<pre><code class="language-javascript">');
    expect(html).toContain('const x = 1;');
  });

  it('should render links', () => {
    const html = renderMarkdown('[Click](https://example.com)');
    expect(html).toContain('<a href="https://example.com">Click</a>');
  });

  it('should render images', () => {
    const html = renderMarkdown('![Alt](img.png)');
    expect(html).toContain('<img src="img.png" alt="Alt">');
  });

  it('should render unordered lists', () => {
    const html = renderMarkdown('- A\n- B\n- C');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>A</li>');
    expect(html).toContain('</ul>');
  });

  it('should render ordered lists', () => {
    const html = renderMarkdown('1. A\n2. B');
    expect(html).toContain('<ol>');
    expect(html).toContain('</ol>');
  });

  it('should render blockquotes', () => {
    const html = renderMarkdown('> A quote');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('A quote');
  });

  it('should render horizontal rules', () => {
    const html = renderMarkdown('---');
    expect(html).toContain('<hr>');
  });

  it('should render xhtml-style horizontal rules when configured', () => {
    const xhtmlRenderer = new Renderer({ xhtml: true });
    const tokens = lexer.tokenize('---');
    const ast = parser.parse(tokens);
    const html = xhtmlRenderer.render(ast);
    expect(html).toContain('<hr />');
  });
});

describe('render (top-level API)', () => {
  it('should render markdown to HTML', () => {
    const html = render('# Hello\n\nWorld');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('<p>World</p>');
  });

  it('should handle complex documents', () => {
    const md = `# Title

Some **bold** and *italic* text.

- Item 1
- Item 2

\`\`\`js
const x = 1;
\`\`\`

> Blockquote

---`;
    const html = render(md);
    expect(html).toContain('<h1');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<pre><code');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<hr>');
  });
});

describe('parse (top-level API)', () => {
  it('should return an AST', () => {
    const ast = parse('# Hello');
    expect(ast.type).toBe('root');
    expect(ast.children.length).toBeGreaterThan(0);
  });
});

describe('escape utilities', () => {
  it('should escape HTML characters', () => {
    expect(escapeHtml('<div>"Hello" & \'World\'</div>')).toBe(
      '&lt;div&gt;&quot;Hello&quot; &amp; &#39;World&#39;&lt;/div&gt;'
    );
  });

  it('should unescape HTML entities', () => {
    expect(unescapeHtml('&lt;div&gt;&amp;&quot;&#39;&lt;/div&gt;')).toBe(
      '<div>&"\'</div>'
    );
  });

  it('should encode URLs', () => {
    const result = encodeUrl('https://example.com/path?q=hello world');
    expect(result).toContain('hello%20world');
  });

  it('should decode URLs', () => {
    const result = decodeUrl('https://example.com/path?q=hello%20world');
    expect(result).toContain('hello world');
  });
});
