export enum TokenType {
  Heading = 'heading',
  Paragraph = 'paragraph',
  Bold = 'bold',
  Italic = 'italic',
  Code = 'code',
  CodeBlock = 'codeblock',
  Link = 'link',
  Image = 'image',
  List = 'list',
  ListItem = 'listitem',
  Blockquote = 'blockquote',
  HorizontalRule = 'hr',
  Table = 'table',
  TaskList = 'tasklist',
  LineBreak = 'linebreak',
  Text = 'text',
  TableRow = 'tablerow',
  TableCell = 'tablecell',
  TableHeader = 'tableheader',
}

export interface Token {
  type: TokenType;
  raw: string;
  text?: string;
  depth?: number;           // heading level (1-6)
  lang?: string;            // code block language
  href?: string;            // link/image url
  alt?: string;             // image alt text
  items?: Token[];          // list items
  ordered?: boolean;        // ordered vs unordered list
  checked?: boolean;        // task list checkbox
  cells?: string[][];       // table cells
  header?: string[];        // table header
  align?: Array<'left' | 'center' | 'right' | null>; // table column alignment
}

export interface Node {
  type: TokenType;
  children: Node[];
  props: Record<string, any>;
  text?: string;
}

export interface AST {
  type: 'root';
  children: Node[];
}

export interface Plugin {
  name: string;
  tokenize?(line: string, lines: string[], index: number): { token: Token; consumed: number } | null;
  parse?(token: Token): Node | null;
  render?(node: Node): string | null;
}

export interface RendererOptions {
  sanitize?: boolean;
  xhtml?: boolean;
}

export interface ParserOptions {
  plugins?: Plugin[];
}

export interface LexerOptions {
  plugins?: Plugin[];
}
