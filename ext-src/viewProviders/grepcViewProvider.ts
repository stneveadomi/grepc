import * as vscode from 'vscode';
import { getNonce } from '../utilities/getNonce';
import { RuleFactory } from '../rules/ruleFactory';
import { DecorationTypeManager } from '../decorationTypeManager';
import { reverseMap } from '../rules/locationState';
import { DragService } from '../dragService';

export class GrepcViewProvider implements vscode.WebviewViewProvider {
    public webview: vscode.Webview | null = null;
    private _disposables: vscode.Disposable[] = [];

    public constructor(
        public readonly viewType: string,
        private readonly _extensionUri: vscode.Uri,
        private readonly _ruleFactory: RuleFactory,
        private readonly _dtManager: DecorationTypeManager,
        private readonly _dragService: DragService,
        private readonly _logger: vscode.LogOutputChannel,
    ) {
        vscode.window.onDidChangeWindowState((event: vscode.WindowState) => {
            if (event.focused) {
                this._logger.debug(
                    `[EXT] [${reverseMap(_ruleFactory.location)}] Window focused! Pushing rules to webview.`,
                );
                this.pushRules();
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext<unknown>,
        _token: vscode.CancellationToken,
    ): void | Thenable<void> {
        this.webview = webviewView.webview;
        webviewView.webview.options = {
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the `dist` and `webview-ui/build` directories
            localResourceRoots: [this._extensionUri],
        };
        this._ruleFactory.$enabledRules.subscribe({
            next: (enabledRules) => {
                webviewView.badge = {
                    tooltip: `Active ${reverseMap(this._ruleFactory.location)} rules`,
                    value: enabledRules.length,
                };
            },
        });
        webviewView.badge = undefined;
        webviewView.onDidDispose(() => this.dispose(), null, this._disposables);
        webviewView.webview.html = this._getWebviewContent(webviewView.webview);
        this._setWebviewMessageListener(webviewView.webview);
        this.pushRules();
        this._ruleFactory.recastEnabledRules();
    }

    pushRules() {
        this._logger.debug(
            `[EXT] sending overwrite to rules @ ` +
                reverseMap(this._ruleFactory.location) +
                `map: ${this._ruleFactory.getRulesMap().size} array ${this._ruleFactory.getRulesArray().length}`,
        );
        this.webview?.postMessage({
            type: 'rules',
            originLocation: this._ruleFactory.location,
            mapData: JSON.stringify(
                Array.from(this._ruleFactory.getRulesMap().entries()),
            ),
            arrayData: JSON.stringify(this._ruleFactory.getRulesArray()),
        });
    }

    emitDragStart(originLocation: string | undefined) {
        this.webview?.postMessage({
            type: 'dragstart',
            originLocation,
        });
    }

    emitDragEnd() {
        this.webview?.postMessage({
            type: 'dragend',
        });
    }

    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    public dispose() {
        // Dispose of all disposables (i.e. commands) for the current webview panel
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * *** CREDIT GOES TO MICROSOFT EXAMPLE REPO: https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/frameworks/hello-world-angular/src/panels/HelloWorldPanel.ts
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the Angular webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    private _getWebviewContent(webview: vscode.Webview) {
        // The CSS file from the Angular build output
        const stylesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'webview-ui',
                'grepc-webview',
                'dist',
                'grepc-webview',
                'browser',
                'styles.css',
            ),
        );
        // The JS files from the Angular build output
        const polyfillsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'webview-ui',
                'grepc-webview',
                'dist',
                'grepc-webview',
                'browser',
                'polyfills.js',
            ),
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'webview-ui',
                'grepc-webview',
                'dist',
                'grepc-webview',
                'browser',
                'main.js',
            ),
        );
        const nonce = getNonce();

        return /*html*/ `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <base href="${this._extensionUri}">
                    <meta charset="UTF-8" />
                    <title>GrepcWebview</title>
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <link href="${stylesUri}" rel="stylesheet" >
                </head>
                <body>
                    <app-root ngCspNonce="${nonce}"></app-root>
                    <script type="module" nonce="${nonce}" src="${polyfillsUri}"></script>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>
        `;
    }

    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (message: any) => {
                const type = message.type;

                switch (type) {
                    case 'rules':
                        this._logger.debug(
                            `[EXT] [${reverseMap(this._ruleFactory.location)}] Received rules event. Updating rules in storage.`,
                        );
                        this._ruleFactory.parseRules(
                            message?.mapData,
                            message?.arrayData,
                        );
                        return;
                    case 'rulesRequest':
                        //designed to send rules on startup to webviews
                        //especially if they are reopened without the extension closing.
                        this._logger.debug(
                            'Received rulesRequest event. Pushing rules to webview.',
                        );
                        this.pushRules();
                        return;
                    case 'jumpToLine': {
                        //when a selection is made, a user can jump their cursor to it.
                        const lineRange = JSON.parse(message.data);
                        this._logger.debug(
                            'Jumping to rule at line range:',
                            lineRange,
                        );
                        this._dtManager.jumpToLine(lineRange);
                        return;
                    }
                    case 'log':
                        switch (message.logLevel) {
                            case 'info':
                                this._logger.info('[SPA] ' + message.data);
                                break;
                            case 'debug':
                                this._logger.debug('[SPA] ' + message.data);
                                break;
                            case 'error':
                                this._logger.error('[SPA] ' + message.data);
                                break;
                            case 'warn':
                                this._logger.warn('[SPA] ' + message.data);
                                break;
                            case 'trace':
                                this._logger.trace('[SPA] ' + message.data);
                                break;
                            default:
                                this._logger.error('[SPA] ' + message.data);
                        }
                        return;
                    case 'drop':
                        this._logger.debug(
                            '[EXT] Received external drop event from origin: ',
                            this._ruleFactory.location,
                        );
                        this._dragService.dragData = message.dragData;
                        if (
                            this._dragService.originLocation ===
                            this._ruleFactory.location
                        ) {
                            /* Return as we do not need to transfer rule */
                            return;
                        }
                        try {
                            this._dragService.transferRule(
                                this._ruleFactory.location,
                            );
                        } catch (e) {
                            this._logger.error(
                                '[EXT] Drop failed due to the following: ',
                                e,
                            );
                            vscode.window.showErrorMessage(
                                'Drop failed due to the following: ' + e,
                            );
                        }

                        break;
                    case 'dragstart':
                        this._logger.debug(
                            '[EXT] Drag started from location: ',
                            message.originLocation,
                        );
                        this._dragService.originLocation =
                            message.originLocation;
                        this._dragService.emitDragStart(message.originLocation);
                        break;
                    case 'dragend':
                        this._logger.debug('[EXT] Drag ended');
                        this._dragService.emitDragEnd();
                        break;
                    case 'debug': {
                        /* This is used for debugging various operations on the SPA side
                         * Simply postMessage a {type: "debug"} to hit this debugger from the SPA side. */
                        // eslint-disable-next-line no-debugger
                        debugger;
                        const data = message.data;
                        console.debug(data);
                        break;
                    }
                }
            },
            undefined,
            this._disposables,
        );
    }
}
