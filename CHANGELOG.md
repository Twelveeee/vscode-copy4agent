# Changelog

## 0.2.0

- Display name is now **CopyForAgent**. The extension ID stays `copy4agent`.
- **Copy for Agent with Template** is now a context-menu submenu listing the templates, replacing the pop-up picker.
- New setting `copy4agent.contextMenu.showCopyWithTemplate` hides that submenu.
- Each template has its own command (`copy4agent.copyAs.<template>`), so you can bind a shortcut to it. A link in Settings opens Keyboard Shortcuts filtered to these commands.

## 0.1.0

- Initial release: **Copy for Agent** and **Copy for Agent with Template…** in the editor context menu.
- Five built-in templates: `@ reference`, `@ reference + code`, `@ reference + fenced code`, `@ reference, #L style`, `Plain path`.
- English, Simplified Chinese and Traditional Chinese.
