<p align="center">
  <img src="assets/icons/icon-128-display.png" alt="EnvMate logo" width="96" height="96">
</p>

<h1 align="center">EnvMate</h1>

<p align="center">
  A Chrome extension for teams that switch between development, testing, staging, and production environments all day.
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

## Why EnvMate

Many internal systems look nearly identical across dev, test, pre-release, and production. EnvMate adds lightweight visual signals so you can tell where you are before you click, edit, or submit anything important.

## URL Rule Types

- `wildcard`: supports `*`, for example `https://test.example.com/*`
- `prefix`: matches URL prefixes, for example `https://pre.example.com/`
- `regex`: uses JavaScript regular expressions

## Marker Options

- `badge`: floating environment badge only
- `watermark`: watermark only
- `badge-watermark`: badge and watermark together

Badge settings support style, position, size, offset, and opacity.

Watermark settings support text, opacity, angle, size, and spacing.

## Test Accounts

Each environment can store multiple test accounts. Accounts can be reordered, marked as the default fill target, and filled from the popup when the current page matches that environment.

EnvMate only fills fields after an explicit user action. It does not submit forms or trigger login buttons automatically.

## Install Locally

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
- `make crx`: build a `.crx` package with Chrome
- `make crx KEY=path/to/key.pem`: reuse an existing signing key

If `KEY` is not provided, Chrome creates a new private key in `.keys/`, which changes the extension identity. Do not commit files in `.keys/`.
