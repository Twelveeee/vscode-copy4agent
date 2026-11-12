<p align="center">
  <img src="resources/icon.png" width="128" height="128" alt="CopyForAgent icon">
</p>

# CopyForAgent

Copy the code you selected as a file reference, ready to paste into an AI agent conversation: Claude Code, Codex, DSH, Cursor and others.

```
@src/app.py:10-30
```

[中文说明](README_CN.md)

## Usage

Right-click in the editor:

| Command | What it does |
| --- | --- |
| **Copy for Agent** | Copies using the template chosen in settings. This is the everyday path. |
| **Copy for Agent with Template** ▸ | A submenu listing every template. Pick one to use it for this copy only. Your setting stays the same. |

The commands are only in the editor context menu, not in the Command Palette. You can hide the submenu with `copy4agent.contextMenu.showCopyWithTemplate`.

No keyboard shortcuts are bound by default. In Settings, the **Set keyboard shortcuts** link under **Template** opens Keyboard Shortcuts filtered to this extension. Bind `copy4agent.copy` for the default template, or `copy4agent.copyAs.<template>` (for example `copy4agent.copyAs.atPathWithCode`) for a specific one.

### What gets copied

- If text is selected, the selected lines are copied. Otherwise the current line is copied.
- Line numbers are the ones shown in the editor gutter. When you drag-select whole lines, VS Code puts the selection end at column 0 of the next line. That line is not included.
- If only part of a line is selected, the whole line is still referenced, and copied when the template includes code, so the code matches the line numbers.
- With multiple cursors, each selection becomes its own reference. Overlapping or adjacent selections are merged.
- Paths are relative to the workspace folder that contains the file. Files outside any workspace folder get an absolute path.
- Only files on disk (`file://`) are supported. Untitled, remote virtual and other non-file documents are not.

## Templates

Choose one under **Settings → Extensions → CopyForAgent → Template** (`copy4agent.template`). The set is fixed, so you can't write your own template strings.

| Setting value | Output | Use it for |
| --- | --- | --- |
| `atPath` (default) | `@src/app.py:10-30` | Claude Code, Codex, Cursor and most agents that resolve `@` file mentions. The agent reads the lines itself. |
| `atPathWithCode` | `@src/app.py:10-30`<br>`<selected code>` | Terminal agents, when you want the exact snippet in the conversation. |
| `atPathWithFencedCode` | `@src/app.py:10-30`<br>` ```python `<br>`<selected code>`<br>` ``` ` | Chat UIs that render Markdown. |
| `atPathHashL` | `@src/app.py#L10-30` | The format Claude Code's own IDE integration inserts. |
| `plainPath` | `src/app.py:10-30` | Inputs where `@` opens a picker or isn't understood. Cmd/Ctrl-click also works on it in the VS Code terminal. |

A single line is written without a range, for example `@src/app.py:12`.

## Languages

English, 简体中文 and 繁體中文. The extension follows VS Code's display language (**Configure Display Language**). It uses VS Code's built-in localization: `package.nls.*.json` for the manifest and `l10n/bundle.l10n.*.json` with `vscode.l10n` for runtime text.

## Development

```sh
npm install
npm test          # compile + unit tests
npm run package   # build a .vsix
npm run icon      # re-export resources/icon.png from resources/icon.svg (needs rsvg-convert)
```

Press F5 in VS Code to launch an Extension Development Host. The second launch configuration starts it in Chinese.

The icon is designed as SVG in [`resources/icon.svg`](resources/icon.svg). vsce rejects SVG both as the manifest `icon` and as images in the README, so both use the exported `resources/icon.png` (256×256).

### Releasing

Every push to `main` and every pull request runs the tests and packages the extension (`.github/workflows/ci.yml`).

Publishing a GitHub release publishes to the Marketplace (`.github/workflows/release.yml`):

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry. Commit and push.
2. Create a release whose tag is `v` plus that version, for example `gh release create v0.2.0 --generate-notes`.
3. The workflow tests, checks that the tag matches `package.json`, publishes with vsce, and attaches the `.vsix` to the release.

GitHub pre-releases are skipped.

One-time setup: the workflow signs in with [Trusted Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) (GitHub OIDC), so no token or secret is needed. At <https://marketplace.visualstudio.com/manage>, open the `Twelveeee` publisher, go to **Trusted Publishing → Create**, and enter:

| Field | Value |
| --- | --- |
| Repository owner | `Twelveeee` |
| Repository | `vscode-copy4agent` |
| Workflow | `release.yml` |
| Environment | *(leave empty)* |

## License

[MIT](LICENSE)

