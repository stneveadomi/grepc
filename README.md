# grepc

> **grep + color**

<p align="center">
    <img src="media/GREPC-standard-circle-124.png" alt="Grepc Icon">
</p>

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/ritwickdey/vscode-live-server/)
![GitHub package.json version](https://img.shields.io/github/package-json/v/stneveadomi/grepc?color=green)
![GitHub Release Date](https://img.shields.io/github/release-date/stneveadomi/grepc)
[![CI Tests](https://github.com/stneveadomi/grepc/actions/workflows/node.js.yml/badge.svg)](https://github.com/stneveadomi/grepc/actions/workflows/node.js.yml)

Grepc is an approachable regular expression highlighter with advanced customization for VS Code.


![Banner](media/demo-banner.gif)

## Features

- **Easily decorate text with any regular expression and save them as rules**
- **Enable and disable decoration rules across all files or per file type**
- **Share rules across multiple workspaces or keep them workspace specific**
- **Have overlapping rules? Drag & drop to change execution priority**
- **See all matches of the current rule in an readable and approachable interface**
- **Adjust font style, color, background color, border, outline, and more as needed.**
- **Easy commands for creating, enabling, disabling, and removing rules for decoration.**

## Usage

- Simply open the tree view in the left hand bar.
- Optionally, use one of the following by right-clicking in the editor:

| Command | Title | Description |
| ------- | ----- | ------------|
| ```grepc.addRule``` | `Grepc: Create Blank Rule` | Add a rule to local or global rule managers through a series of menus. |
| ```grepc.addTextRule``` | `Grepc: Create Rule From Selection` | Add a rule by selecting text to be the regex and then following the quick pick menus. |
| ```grepc.deleteRule``` | `Grepc: Delete Rule` | Delete a rule from the workspace or global managers. |
| ```grepc.enableAllRules``` | `Grepc: Enable All Rules` | Enable all rules in the workspace and global. |
| ```grepc.enableLocalRules``` | `Grepc: Enable Local Workspace Rules` | Enable all local rules. |
| ```grepc.enableGlobalRules``` | `Grepc: Enable Global Workspace Rules` | Enable all global rules. |
| ```grepc.disableAllRules``` | `Grepc: Disable All Rules` | Disable all rules. |
| ```grepc.disableLocalRules``` | `Grepc: Disable Local Workspace Rules` | Disable local rules. |
| ```grepc.disableGlobalRules``` | `Grepc: Disable Global Workspace Rules` | Disable global rules.|


## Installation

The easiest way to install is through the VS Code Marketplace.

Alternatively, you can install any version of grepc by going to the [releases](./releases) and downloading the specific .vsix file. From there, you can follow the instructions [here](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix).

## Demo
![Example 4](media/Code_PSyTYpsF5e.gif)

![Example 2](media/Code_IlBi9doiz1.gif)

![Example 3](media/Code_PMvUMJj9x3.gif)

![Example 1](media/Code_hRfd4iIgh6.gif)

## Release Notes

See [releases](./releases)

## Contributing

Find an issue or a potential new feature? Create an issue on the GitHub page.

Feel free to review the current issues if interested in contributing.

If interested in more information, reach out to @stneveadomi on GitHub.

## License

MIT @ Steven Neveadomi
