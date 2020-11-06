import { Lexer } from './lexer';
import { Parser } from './parser';
import { Renderer } from './renderer';
import { Plugin, RendererOptions, AST } from './types';

export { Lexer } from './lexer';
export { Parser } from './parser';
export { Renderer } from './renderer';
export { TokenType, Token, Node, AST, Plugin, RendererOptions, ParserOptions, LexerOptions } from './types';
export { escapeHtml, unescapeHtml, encodeUrl, decodeUrl } from './utils/escape';
export { tablePlugin } from './plugins/tablePlugin';
export { codeBlockPlugin } from './plugins/codeBlockPlugin';
export { taskListPlugin } from './plugins/taskListPlugin';

export interface MarkdownOptions extends RendererOptions {
  plugins?: Plugin[];
}

export function parse(markdown: string, options?: MarkdownOptions): AST {
  const plugins = (options && options.plugins) || [];
  const lexer = new Lexer({ plugins });
  const parser = new Parser({ plugins });
  const tokens = lexer.tokenize(markdown);
  return parser.parse(tokens);
}

export function render(markdown: string, options?: MarkdownOptions): string {
  const plugins = (options && options.plugins) || [];
  const ast = parse(markdown, options);
  const renderer = new Renderer({ ...options, plugins });
  return renderer.render(ast);
}
