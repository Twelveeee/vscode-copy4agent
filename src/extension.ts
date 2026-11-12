import * as vscode from 'vscode';
import {
  DEFAULT_TEMPLATE,
  TEMPLATE_IDS,
  TemplateId,
  Snippet,
  isTemplateId,
  mergeLineRanges,
  render,
  selectionToLineRange,
} from './core';

const CONFIG_SECTION = 'copy4agent';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('copy4agent.copy', () => copyWith(configuredTemplate())),
    // One command per template: entries of the "Copy for Agent with Template"
    // submenu, and individually bindable to keyboard shortcuts.
    ...TEMPLATE_IDS.map((id) => vscode.commands.registerCommand(`copy4agent.copyAs.${id}`, () => copyWith(id))),
  );
}

export function deactivate(): void {}

function configuredTemplate(): TemplateId {
  const value = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>('template');
  if (value === undefined || isTemplateId(value)) {
    return value ?? DEFAULT_TEMPLATE;
  }
  void vscode.window.showWarningMessage(
    vscode.l10n.t('Unknown template "{0}" in settings. Using the default template instead.', value),
  );
  return DEFAULT_TEMPLATE;
}

/** Collect snippets from the active editor, or explain why we can't. */
function collectSnippets(): Snippet[] | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showWarningMessage(vscode.l10n.t('Open a file in the editor first.'));
    return undefined;
  }
  const doc = editor.document;
  if (doc.uri.scheme !== 'file') {
    void vscode.window.showWarningMessage(vscode.l10n.t('CopyForAgent only works with files saved on disk.'));
    return undefined;
  }

  // Workspace-relative when the file is inside a folder (agents usually run at
  // the workspace root); absolute otherwise. Never prefixed with the folder name
  // in multi-root workspaces, since the agent wouldn't understand that prefix.
  const path = vscode.workspace.getWorkspaceFolder(doc.uri)
    ? vscode.workspace.asRelativePath(doc.uri, false)
    : doc.uri.fsPath;

  const ranges = mergeLineRanges(editor.selections.map(selectionToLineRange));
  return ranges.map((range) => {
    const lines: string[] = [];
    for (let i = range.start; i <= range.end; i++) {
      lines.push(doc.lineAt(i).text);
    }
    return { path, range, code: lines.join('\n'), languageId: doc.languageId };
  });
}

async function copy(id: TemplateId, snippets: Snippet[]): Promise<void> {
  const text = render(id, snippets);
  await vscode.env.clipboard.writeText(text);
  const firstLine = text.split('\n', 1)[0];
  vscode.window.setStatusBarMessage(`$(check) ${vscode.l10n.t('Copied for agent: {0}', firstLine)}`, 3000);
}

async function copyWith(id: TemplateId): Promise<void> {
  const snippets = collectSnippets();
  if (snippets) {
    await copy(id, snippets);
  }
}
