import * as vscode from 'vscode';
import { VersionDiff, compareVersions, isValidSemVer } from '../utilities/version';
import { getNonce } from '../utilities/getNonce';
import Showdown from 'showdown';
import { RuleFactory } from '../rules/ruleFactory';

export class ReleaseNotesWebview {
    private webviewPanel: vscode.WebviewPanel | undefined;
    private currentVersion;

    constructor(
        public viewId: string,
        private context: vscode.ExtensionContext,
        private logger: vscode.LogOutputChannel,
    ) {
        this.currentVersion = this.context.extension.packageJSON.version;
    }

    showWebviewIfNewVersion() {
        const storedVersion = this.context.globalState.get(RuleFactory.STORED_VERSION_KEY_ID);
        if (!storedVersion) {
            this.logger.info('[EXT] Stored version is undefined. Showing webview.');
            this.updateStoredVersion(this.currentVersion);
            this.showWebview();
            return;
        }

        if (typeof storedVersion === 'string' && isValidSemVer(storedVersion)) {
            switch (compareVersions(storedVersion, this.currentVersion)) {
                case VersionDiff.MAJOR_DIFF:
                case VersionDiff.MINOR_DIFF:
                    this.updateStoredVersion(this.currentVersion);
                    this.showWebview();
                    this.logger.info('[EXT] New version detected. Displaying changelog.');
                    break;
                case VersionDiff.PATCH_DIFF:
                    this.logger.info('[EXT] New patch detected. To see the changelog, run grepc: Show Release Notes');
                    break;
                case VersionDiff.NO_DIFF:
                default:
                    this.logger.info('[EXT] No change in version detected.');
                    break;
            }
        }
    }

    private updateStoredVersion(version: string) {
        this.context.globalState.update(RuleFactory.STORED_VERSION_KEY_ID, version);
    }

    async showWebview() {
        this.webviewPanel = vscode.window.createWebviewPanel(this.viewId, `grepc: Release Notes ${this.currentVersion}`, vscode.ViewColumn.One, {
            localResourceRoots: [this.context.extensionUri],
        });

        this.webviewPanel.webview.html = await this.getWebviewHtml(this.webviewPanel.webview);
    }

    async getWebviewHtml(webview: vscode.Webview) {
        const nonce = getNonce();
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'ext-src', 'release-notes-ui', 'release-notes.css'));
        const bannerUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'GREPC-grey-dark.svg'));
        const changelogUri = vscode.Uri.joinPath(this.context.extensionUri, 'CHANGELOG.md');

        const clBytes = await vscode.workspace.fs.readFile(changelogUri);
        const changelog = new TextDecoder('UTF-8').decode(clBytes);
        const mdConverter = new Showdown.Converter();
        return /*html*/ `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <base href="${this.context.extensionUri}">
                    <meta charset="UTF-8" />
                    <title>GrepcWebview</title>
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'nonce-${nonce}'; style-src-attr 'unsafe-inline'; img-src ${webview.cspSource} https: data:;">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <link href="${stylesUri}" rel="stylesheet" >
                </head>
                <body>
                    <div class="banner">
                        <img src="${bannerUri}" alt="Grepc Icon">
                        <h1>grepc: Release Notes for V${this.currentVersion}</h1>
                    </div>
                    <div>
                        <p dir="auto">
                            <a href="https://github.com/stneveadomi/grepc/">
                                <img nonce="${nonce}" src="https://camo.githubusercontent.com/e51b657236415672754f02dfef0bc6873e979346fa0107f9c4219fe1589a5c6c/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6c6963656e73652d4d49542d626c75652e7376673f7374796c653d666c61742d737175617265" alt="GitHub license" data-canonical-src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" style="max-width: 100%;">
                            </a>
                            <a href="https://github.com/stneveadomi/grepc/releases">
                                <img alt="GitHub package.json version" nonce="${nonce}" src="https://img.shields.io/github/package-json/v/stneveadomi/grepc?color=limegreen">
                            </a>
                            <a href="https://github.com/stneveadomi/grepc/releases">
                                <img alt="GitHub Release Date" src="https://img.shields.io/github/release-date/stneveadomi/grepc">
                            </a>
                            <a href="https://github.com/stneveadomi/grepc/actions/workflows/node.js.yml">
                                <img src="https://github.com/stneveadomi/grepc/actions/workflows/node.js.yml/badge.svg" alt="CI Tests" style="max-width: 100%;">
                            </a>
                            <img alt="Visual Studio Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/stneveadomi.grepc">
                            <img alt="Visual Studio Marketplace Rating" src="https://img.shields.io/visual-studio-marketplace/stars/stneveadomi.grepc">
                        </p>
                    </div>
                    <p>
                     Grepc is an approachable regular expression highlighter with advanced customization for VS Code.
                    </p>
                    <div class="content">
                        <div class="changelog">
                            ${mdConverter.makeHtml(changelog)}
                        </div>
                        <div class="about">
                            <h1>
                                About
                            </h1>
                            <p>
                                <a href="https://marketplace.visualstudio.com/items?itemName=stneveadomi.grepc">Marketplace</a>
                                <br/>
                                <a href="https://github.com/stneveadomi/grepc/">GitHub</a>
                            </p>
                            <h2>
                                Show Support
                            </h2>
                            <p>
                                Grepc was created to help others for free and is made in my free time. The best way to show support is by sharing with your friends that could benefit from the tool and giving a review on the marketplace.
                            </p>
                            <p>
                                If you want to contribute, feel free to look at the GitHub page and reach out to <a href="https://github.com/stneveadomi">@stneveadomi</a> on GitHub for a better overview and good issues to start with.
                            </p>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    /**
     * Dispose() is called by the VS Code lifecycle when cleaning up the extension.
     */
    dispose() {
        //currently no op.
    }
}
