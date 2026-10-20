# IronTrac Simplifier

Adds two checkboxes above the grid in **Jobs → Pressure Test → Assets**:

- **Select all** selects every selectable asset in the current list. Unchecking it clears the list.
- **Select all but check valves** selects other assets and deselects assets whose Description contains “check valve” (case insensitive, including plural and hyphenated variants). Unchecking it clears the non-check-valve items.

The controls reflect individual row selections and work after navigating between jobs or reopening Assets. They use the site's normal checkbox clicks. They do not start, stage, save, or complete a pressure test.

## Install in Chrome

1. Put `chrome://extensions` in your URL bar and hit enter.
2. Turn on **Developer mode** in the upper right.
3. Click **Load unpacked** and choose the extracted `irontrac-simplifier` folder (the folder contains a file called `manifest.json`). If using the ZIP release, extract it first.
4. Reload your IronTrac tab and open **Pressure Test → Assets**.

## Extension menu

Click the extension in Chrome's puzzle-piece menu (pin it for quicker access). Its **Enabled / Disabled** switch saves your preference. The **Refresh page** button beside the switch reloads the active tab. After either enabling or disabling, refresh each open IronTrac tab to apply the change. The menu displays this reminder and confirms when the setting is saved. The extension starts enabled.

## Privacy and removal

The page script runs only on `https://app.irontrac.com/`. It contains no network requests, tracking, remote code, or background service. Its only Chrome permission is local storage, used solely for the enabled/disabled preference. Remove it from `chrome://extensions` whenever you want.

This extension is not affliliated with IronTrac in anyway. I am simply a frustrated user that wanted to select all assets at once for pressure test but was not given the option. If anything else in the interface pisses me off I might add more features.
