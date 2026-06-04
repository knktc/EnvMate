# EnvMate

EnvMate is a Chrome extension for development and test teams that work with many visually similar web environments. It adds environment markers to pages, prefixes titles, and fills configured test accounts on demand.

## First Version

- Match environments by URL prefix, wildcard, or regular expression.
- Inject a page badge, optional watermark, and optional title prefix.
- Show the current environment in the extension popup.
- Fill configured test usernames and passwords after a user click.
- Manage environments with an interactive options page.

## Install Locally

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder: `/Users/knktc/scripts/apps/EnvMate`.

## Configuration

Open the extension options page. You can add groups, add environments inside a group, edit colors, choose marker styles, add URL rules, and add test accounts through the form UI.

Use `Add Environment` to create a new environment. The most important field is `URL Rules`, because EnvMate uses those rules to decide which marker to show on a page.

Each environment belongs to a group. New environments start in `Default Group`, and the sidebar clusters environments by group so multiple business systems are easier to scan. Removing a group moves its environments back into `Default Group`.

Rule types:

- `wildcard`: supports `*`, for example `https://test.example.com/*`.
- `prefix`: matches URL prefixes, for example `https://pre.example.com/`.
- `regex`: uses JavaScript regular expressions.

Marker modes:

- `badge`: floating environment badge only.
- `watermark`: watermark only.
- `badge-watermark`: both badge and watermark.

Badge advanced settings support `pill` and `corner ribbon` styles, position, offset, and opacity.

Watermark advanced settings support opacity, rotation angle, text size, and spacing.

Account filling is click-triggered from the popup or the page account panel. EnvMate does not silently submit forms or click login buttons.
