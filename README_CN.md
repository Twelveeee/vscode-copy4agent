<p align="center">
  <img src="resources/icon.png" width="128" height="128" alt="CopyForAgent 图标">
</p>

# CopyForAgent

把选中的代码复制成文件引用，直接粘贴给 AI Agent（Claude Code、Codex、DSH、Cursor 等）。

```
@src/app.py:10-30
```

[English](README.md)

## 使用

在编辑器中右键：

| 命令 | 作用 |
| --- | --- |
| **复制给 Agent** | 使用设置中选定的模板复制，日常使用这个。 |
| **复制给 Agent（选择模板）** ▸ | 子菜单列出所有模板，选中后仅本次使用该模板，不会修改设置。 |

命令只出现在编辑器右键菜单中，不在命令面板里。可通过 `copy4agent.contextMenu.showCopyWithTemplate` 隐藏子菜单。

默认不绑定快捷键。在设置中 **Template** 下点击 **设置快捷键** 链接，会打开已筛选出本扩展命令的键盘快捷方式页面。为 `copy4agent.copy` 绑定快捷键即使用默认模板；为 `copy4agent.copyAs.<模板>`（例如 `copy4agent.copyAs.atPathWithCode`）绑定则使用指定模板。

### 复制规则

- 有选区就用选区，否则用光标所在行。
- 行号与编辑器左侧行号一致。拖选整行时，VS Code 会把选区终点放在下一行第 0 列，这一行不会被算进去。
- 只选中了一行中的一部分时，仍按整行引用；带代码的模板也会复制整行，保证代码与行号对应。
- 多光标时每个选区各生成一条引用，重叠或相邻的选区会合并。
- 路径相对于文件所在的工作区文件夹；不在任何工作区文件夹内的文件使用绝对路径。
- 仅支持磁盘上的本地文件（`file://`），不支持未保存的新文件、远程虚拟文件等。

## 模板

在 **设置 → 扩展 → CopyForAgent → Template**（`copy4agent.template`）中选择。模板集合是固定的，不支持自定义模板字符串。

| 设置值 | 输出 | 适用场景 |
| --- | --- | --- |
| `atPath`（默认） | `@src/app.py:10-30` | Claude Code、Codex、Cursor 以及大多数支持 `@` 文件引用的 Agent，由 Agent 自行读取代码。 |
| `atPathWithCode` | `@src/app.py:10-30`<br>`<选中的代码>` | 终端 Agent，需要把代码片段原文带进对话时。 |
| `atPathWithFencedCode` | `@src/app.py:10-30`<br>` ```python `<br>`<选中的代码>`<br>` ``` ` | 会渲染 Markdown 的聊天界面。 |
| `atPathHashL` | `@src/app.py#L10-30` | 与 Claude Code 自带 IDE 集成插入的格式一致。 |
| `plainPath` | `src/app.py:10-30` | 输入 `@` 会弹出文件选择器或不识别 `@` 的场景。在 VS Code 终端中也可 Cmd/Ctrl+点击跳转。 |

单行时不写范围，例如 `@src/app.py:12`。

## 语言

支持 English、简体中文、繁體中文，跟随 VS Code 的显示语言（**Configure Display Language**）。使用 VS Code 官方本地化机制：清单文本在 `package.nls.*.json`，运行时文本通过 `vscode.l10n` 读取 `l10n/bundle.l10n.*.json`。

## 开发

```sh
npm install
npm test          # 编译 + 单元测试
npm run package   # 打包 .vsix
npm run icon      # 从 resources/icon.svg 重新导出 resources/icon.png（需要 rsvg-convert）
```

在 VS Code 中按 F5 启动扩展开发宿主；第二个启动配置以中文界面启动。

图标设计源文件是 [`resources/icon.svg`](resources/icon.svg)。vsce 不接受 SVG 作为清单 `icon`，也不接受 README 中的 SVG 图片，因此两处都使用导出的 `resources/icon.png`（256×256）。

### 发布

每次推送到 `main` 或提交 PR 都会运行测试并打包（`.github/workflows/ci.yml`）。

在 GitHub 上发布 Release 时会自动发布到 Marketplace（`.github/workflows/release.yml`）：

1. 修改 `package.json` 中的 `version`，在 `CHANGELOG.md` 中补充记录，提交并推送。
2. 创建标签为 `v` 加版本号的 Release，例如 `gh release create v0.2.0 --generate-notes`。
3. 工作流会运行测试、检查标签与 `package.json` 版本一致、用 vsce 发布，并把 `.vsix` 附加到该 Release。

GitHub 预发布（pre-release）不会触发发布。

一次性配置：工作流通过 [Trusted Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)（GitHub OIDC）登录，不需要令牌或 Secret。在 <https://marketplace.visualstudio.com/manage> 打开 `Twelveeee` 发布者，进入 **Trusted Publishing → Create**，填写：

| 字段 | 值 |
| --- | --- |
| Repository owner | `Twelveeee` |
| Repository | `vscode-copy4agent` |
| Workflow | `release.yml` |
| Environment | *（留空）* |

## 许可证

[MIT](LICENSE)
