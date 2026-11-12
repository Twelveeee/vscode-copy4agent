// Pure formatting logic. Deliberately free of any `vscode` import so it can be
// unit-tested with plain Node.

/** Zero-based position, mirroring vscode.Position. */
export interface Pos {
  line: number;
  character: number;
}

/** Zero-based, start-before-end selection, mirroring vscode.Selection's start/end. */
export interface Sel {
  start: Pos;
  end: Pos;
}

/** Zero-based, inclusive line range. */
export interface LineRange {
  start: number;
  end: number;
}

/**
 * Lines the user actually selected.
 *
 * - Empty selection → the cursor's line.
 * - A non-empty selection ending at column 0 of a later line (what VS Code
 *   produces when drag-selecting or shift-clicking whole lines) does not
 *   include that trailing line: no character on it is selected.
 */
export function selectionToLineRange(sel: Sel): LineRange {
  const start = sel.start.line;
  let end = sel.end.line;
  if (end > start && sel.end.character === 0) {
    end -= 1;
  }
  return { start, end };
}

/** Sort ranges and merge any that overlap or touch. */
export function mergeLineRanges(ranges: readonly LineRange[]): LineRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: LineRange[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end + 1) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
}

/** One contiguous block of the document, ready to be rendered. */
export interface Snippet {
  /** Path as the agent should see it (workspace-relative when possible). */
  path: string;
  /** Zero-based inclusive range. */
  range: LineRange;
  /** Full text of the lines in `range`, joined with '\n'. */
  code: string;
  /** VS Code language id of the document. */
  languageId: string;
}

export const TEMPLATE_IDS = [
  'atPath',
  'atPathWithCode',
  'atPathWithFencedCode',
  'atPathHashL',
  'plainPath',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const DEFAULT_TEMPLATE: TemplateId = 'atPath';

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value);
}

/** `10-30`, or `10` for a single line. One-based, as shown in the gutter. */
function colonLines(r: LineRange): string {
  const a = r.start + 1;
  const b = r.end + 1;
  return a === b ? `${a}` : `${a}-${b}`;
}

/** `L10-30`, or `L10` for a single line. */
function hashLines(r: LineRange): string {
  return `L${colonLines(r)}`;
}

// VS Code language ids that differ from the usual Markdown fence tag.
const FENCE_LANG: Record<string, string> = {
  plaintext: '',
  typescriptreact: 'tsx',
  javascriptreact: 'jsx',
  shellscript: 'bash',
  'objective-c': 'objc',
  'objective-cpp': 'objcpp',
  dockerfile: 'dockerfile',
  jsonc: 'jsonc',
};

function fenceLang(languageId: string): string {
  return languageId in FENCE_LANG ? FENCE_LANG[languageId] : languageId;
}

/** A backtick fence longer than any backtick run inside `code`. */
function fenceFor(code: string): string {
  let longest = 0;
  for (const m of code.matchAll(/`+/g)) {
    longest = Math.max(longest, m[0].length);
  }
  return '`'.repeat(Math.max(3, longest + 1));
}

function renderOne(id: TemplateId, s: Snippet): string {
  switch (id) {
    case 'atPath':
      return `@${s.path}:${colonLines(s.range)}`;
    case 'atPathWithCode':
      return `@${s.path}:${colonLines(s.range)}\n${s.code}`;
    case 'atPathWithFencedCode': {
      const fence = fenceFor(s.code);
      return `@${s.path}:${colonLines(s.range)}\n${fence}${fenceLang(s.languageId)}\n${s.code}\n${fence}`;
    }
    case 'atPathHashL':
      return `@${s.path}#${hashLines(s.range)}`;
    case 'plainPath':
      return `${s.path}:${colonLines(s.range)}`;
  }
}

export function templateIncludesCode(id: TemplateId): boolean {
  return id === 'atPathWithCode' || id === 'atPathWithFencedCode';
}

/**
 * Render one or more snippets (multi-cursor selections) with a template.
 * Reference-only blocks go one per line; blocks with code are separated by a
 * blank line so they stay readable.
 */
export function render(id: TemplateId, snippets: readonly Snippet[]): string {
  const sep = templateIncludesCode(id) ? '\n\n' : '\n';
  return snippets.map((s) => renderOne(id, s)).join(sep);
}
