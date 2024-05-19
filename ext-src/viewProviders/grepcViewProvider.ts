import * as vscode from 'vscode';
import { getNonce } from "../utilities/getNonce";
import { RuleFactory } from '../rules/ruleFactory';
import { LineRange } from '../rules/line-range';
import { DecorationTypeManager } from '../decorationTypeManager';

export class GrepcViewProvider implements vscode.WebviewViewProvider {
    public webview: vscode.Webview | null = null;
    private _disposables: vscode.Disposable[] = [];

    public constructor(
        public readonly viewType: string,
        private readonly _extensionUri: vscode.Uri,
        private readonly _ruleFactory: RuleFactory,
        private readonly _dtManager: DecorationTypeManager
    ) {}

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        this.webview = webviewView.webview;
        webviewView.webview.options = {
            // Enable JavaScript in the webview
            enableScripts: true,
            
            // Restrict the webview to only load resources from the `dist` and `webview-ui/build` directories
            localResourceRoots: [
                this._extensionUri
            ],
        };
        webviewView.onDidDispose(() => this.dispose(), null, this._disposables);
        webviewView.webview.html = this._getWebviewContent(webviewView.webview);
        console.log('resolveWebviewView called for ', this._ruleFactory.location);
        this._setWebviewMessageListener(webviewView.webview);
        this.pushRules();
    }

    pushRules() {
        console.log('Pushing rules to webview');
        this.webview?.postMessage({
            type: 'rules', 
            mapData: JSON.stringify(Array.from(this._ruleFactory.getRulesMap().entries())),
            arrayData: JSON.stringify(this._ruleFactory.getRulesArray())
        });
    }

    addRule(title: string, regEx: string | undefined, bgColor: string | undefined) {
        this.webview?.postMessage({
            type: 'addRule',
            title,
            regEx,
            bgColor
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
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "styles.css"));
        // The JS files from the Angular build output
        const polyfillsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "polyfills.js"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "main.js"));
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
      (message: any) => {
        const type = message.type;

        switch (type) {
          case "rules":
            //TODO: Check that events are going to the right webview (local rule webview doesnt emit to global grepc view provider.)
            // Code that should run in response to the hello message command
            vscode.window.showInformationMessage("Updating Rules");
            console.log('received rules from webview:', message);
            this._ruleFactory.parseRules(message?.mapData, message?.arrayData);
            return;
          case "rulesRequest":
            //designed to send rules on startup to webviews
            //especially if they are reopened without the extension closing.
            vscode.window.showInformationMessage("Sending rules to webview");
            console.log('received rulesRequest from webview:', message);
            this.pushRules();
            return;
          case "jumpToLine":
            //when a selection is made, a user can jump their cursor to it.
            vscode.window.showInformationMessage("Jumping to rule");
            this.jumpToLine(JSON.parse(message.data));
        }
      },
      undefined,
      this._disposables
    );
  }

  private jumpToLine(lineRange: LineRange) {
    this._dtManager.jumpToLine(lineRange);
  }

}