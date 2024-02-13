import * as vscode from 'vscode';
import { getNonce } from "../utilities/getNonce";

export class GrepcViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'grepc.webview';
    private webview: vscode.Webview | null = null;

    public constructor(private extensionUri: vscode.Uri) {}

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        this.webview = webviewView.webview;
        this.webview.options = {
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the `dist` and `webview-ui/build` directories
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist"), vscode.Uri.joinPath(this.extensionUri, "webview-ui/grepc-webview/dist/grepc-webview/browser")],
        };
        this.webview.html = this._getWebviewContent(webviewView.webview, this.extensionUri);
    }

    /**
     * *** CREDIT GOES TO MICROSOFT EXAMPLE REPO: https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/frameworks/hello-world-angular/src/panels/HelloWorldPanel.ts
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the Angular webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        // The CSS file from the Angular build output
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "styles.css"));
        // The JS files from the Angular build output
        const polyfillsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "polyfills.js"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "main.js"));

        const nonce = getNonce();
        // TODO: Fix this and update nonce.
        //                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

        return /*html*/ `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <title>GrepcWebview</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="stylesheet" type="text/css" href="${stylesUri}">
            </head>
            <body>
                <app-root></app-root>
                <script type="module" nonce="${nonce}" src="${polyfillsUri}"></script>
                <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }

}