<p align="center">
  <img src="assets/icons/icon-128-display.png" alt="EnvMate logo" width="96" height="96">
</p>

<h1 align="center">EnvMate</h1>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/envmate/mccdmjfnlkkjmcioapnehkmpgkblhiei">
    <img src="https://img.shields.io/chrome-web-store/users/mccdmjfnlkkjmcioapnehkmpgkblhiei?logo=googlechrome&amp;label=Chrome%20users" alt="Chrome Web Store users">
  </a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/enighdiiommdnommodoninagjanhiogb">
    <img src="https://img.shields.io/badge/Edge%20Add--ons-0078D7?logo=microsoftedge&amp;logoColor=white" alt="Microsoft Edge Add-ons">
  </a>
  <a href="https://addons.mozilla.org/addon/envmate/">
    <img src="https://img.shields.io/amo/users/envmate?logo=firefoxbrowser&amp;logoColor=white&amp;label=Firefox%20users" alt="Firefox Add-on users">
  </a>
</p>

<p align="center">
  A browser extension that works for Chrome, Edge, and Firefox, built for teams that switch between development, testing, staging, and production environments all day.
</p>

<p align="center">
  EnvMate makes the active environment obvious, keeps test accounts close at hand, and helps reduce mistakes caused by visually similar systems.
</p>

## Highlights

- Detect environments by URL rules.
- Show a badge, watermark, or both on matched pages.
- Optionally prefix the page title with the environment label.
- Manage grouped environments from a dedicated options page.
- Store multiple test accounts per environment and fill them on demand.
- Show the matched environment directly in the extension popup.
- Add an environment homepage URL so the popup can jump straight to grouped environment entries.

## Install from Chrome Web Store

[Install EnvMate from the Chrome Web Store](https://chromewebstore.google.com/detail/envmate/mccdmjfnlkkjmcioapnehkmpgkblhiei)

## Install from Microsoft Edge Add-ons

[Install EnvMate from Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/enighdiiommdnommodoninagjanhiogb)

## Install from Firefox Add-ons

[Install EnvMate from Firefox Add-ons](https://addons.mozilla.org/addon/envmate/)

## Why EnvMate

Many internal systems look nearly identical across dev, test, pre-release, and production. EnvMate adds lightweight visual signals so you can tell where you are before you click, edit, or submit anything important.

## Changelog / 更新

- 2026-08-12 · v0.5.1: Fixed Quick Access expansion causing the popup window to become wider.
- 2026-08-12 · v0.5.1：修复展开快速访问后弹窗宽度异常变大的问题。
- 2026-08-05 · v0.5.0: Added in-page text editing, making temporary copy checks and screenshots easier.
- 2026-08-05 · v0.5.0：新增页面文字编辑功能，方便临时修改文案进行核对和截图。
- 2026-07-31 · v0.4.0: Added a breathing edge-glow marker and fixed import/export modals to adapt to expandable selection trees.
- 2026-07-31 · v0.4.0：新增呼吸灯标记，并修复导入和导出弹框在展开环境树时的自适应布局。
- 2026-07-20 · v0.3.0: Added URL-based configuration import with saved import scopes and one-click re-import.
- 2026-07-20 · v0.3.0：新增通过 URL 导入配置，支持保存导入范围和一键重新导入。
- 2026-07-10 · v0.2.4: Added optional test-account export with a password-security notice.
- 2026-07-10 · v0.2.4：导出时可选择包含测试账号，并增加密码安全提示。
- 2026-07-06 · v0.2.3: Quick Access now follows the configured environment order instead of recent visits.
- 2026-07-06 · v0.2.3：快速访问改为按配置中的环境顺序排列，不再按最近访问排序。
- 2026-06-18 · v0.2.1: Improved drag reordering for environments in grouped settings.
- 2026-06-18 · v0.2.1：优化配置分组内环境的拖拽排序。
- 2026-06-17 · v0.2.0: Added Quick Access.
- 2026-06-17 · v0.2.0：新增 Quick Access。

## URL Rule Types

- `wildcard`: supports `*`, for example `https://test.example.com/*`
- `prefix`: matches URL prefixes, for example `https://pre.example.com/`
- `regex`: uses JavaScript regular expressions

## Marker Options

- `badge`: floating environment badge only
- `watermark`: watermark only
- `badge-watermark`: badge and watermark together

Badge styles include a corner ribbon, pill, and breathing edge glow. The edge glow uses the badge color and respects the badge size and opacity settings.

Watermark settings support text, opacity, angle, size, and spacing.

## Test Accounts

Each environment can store multiple test accounts. Accounts can be reordered, marked as the default fill target, and filled from the popup when the current page matches that environment.

EnvMate only fills fields after an explicit user action. It does not submit forms or trigger login buttons automatically.

## Install Locally in Chrome or Edge

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the project folder.

## Configure Environments

Open the extension options page to:

- create groups
- add environments to a group
- configure URL matching rules
- customize badge and watermark appearance
- add and manage test accounts

The most important part of each environment is its `URL Rules`, because those rules determine when EnvMate should activate on a page.

## Typical Use Cases

- Add a bright badge to production pages so they never look like test.
- Prefix page titles to make environment differences visible in browser tabs.
- Keep shared QA or staging accounts available without digging through notes.
- Group environments by product or business line so large setups stay manageable.

## Build Release Artifacts

- `make zip`: create `dist/envmate-<version>.zip`
- `make firefox-zip`: create `dist/envmate-<version>-firefox.zip` for Firefox AMO; this package uses the Firefox background-script fallback and does not change the Chrome/Edge package.
- `make crx`: build a `.crx` package with Chrome
- `make crx KEY=path/to/key.pem`: reuse an existing signing key

If `KEY` is not provided, Chrome creates a new private key in `.keys/`, which changes the extension identity. Do not commit files in `.keys/`.
