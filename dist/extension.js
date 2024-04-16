/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GrepcViewProvider: () => (/* binding */ GrepcViewProvider)
/* harmony export */ });
/* harmony import */ var vscode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var vscode__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(vscode__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utilities_getNonce__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);


class GrepcViewProvider {
    _extensionUri;
    static viewType = 'grepc.webview';
    static provider;
    webview = null;
    _disposables = [];
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, token) {
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
        this._setWebviewMessageListener(webviewView.webview);
    }
    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    dispose() {
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
    _getWebviewContent(webview) {
        // The CSS file from the Angular build output
        const stylesUri = webview.asWebviewUri(vscode__WEBPACK_IMPORTED_MODULE_0__.Uri.joinPath(this._extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "styles.css"));
        // The JS files from the Angular build output
        const polyfillsUri = webview.asWebviewUri(vscode__WEBPACK_IMPORTED_MODULE_0__.Uri.joinPath(this._extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "polyfills.js"));
        const scriptUri = webview.asWebviewUri(vscode__WEBPACK_IMPORTED_MODULE_0__.Uri.joinPath(this._extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "main.js"));
        const codiconsUri = webview.asWebviewUri(vscode__WEBPACK_IMPORTED_MODULE_0__.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
        const nonce = (0,_utilities_getNonce__WEBPACK_IMPORTED_MODULE_1__.getNonce)();
        // TODO: Fix this and update nonce.
        //
        //                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        //                 <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';" />
        // 
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
    _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage((message) => {
            const command = message.command;
            const text = message.text;
            switch (command) {
                case "hello":
                    // Code that should run in response to the hello message command
                    vscode__WEBPACK_IMPORTED_MODULE_0__.window.showInformationMessage(text);
                    return;
                // Add more switch case statements here as more webview message commands
                // are created within the webview context (i.e. inside media/main.js)
            }
        }, undefined, this._disposables);
    }
}


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getNonce: () => (/* binding */ getNonce)
/* harmony export */ });
/**
 * *** CREDIT TO: https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/5baaf6588fd73a45a1994266eed6c615d7c92faf/frameworks/hello-world-angular
 * A helper function that returns a unique alphanumeric identifier called a nonce.
 *
 * @remarks This function is primarily used to help enforce content security
 * policies for resources/scripts being executed in a webview context.
 *
 * @returns A nonce
 */
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   activate: () => (/* binding */ activate),
/* harmony export */   deactivate: () => (/* binding */ deactivate)
/* harmony export */ });
/* harmony import */ var vscode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var vscode__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(vscode__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _viewProviders_grepcViewProvider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    const webviewProvider = new _viewProviders_grepcViewProvider__WEBPACK_IMPORTED_MODULE_1__.GrepcViewProvider(context.extensionUri);
    context.subscriptions.push(vscode__WEBPACK_IMPORTED_MODULE_0__.window.registerWebviewViewProvider(_viewProviders_grepcViewProvider__WEBPACK_IMPORTED_MODULE_1__.GrepcViewProvider.viewType + ".local", webviewProvider), vscode__WEBPACK_IMPORTED_MODULE_0__.window.registerWebviewViewProvider(_viewProviders_grepcViewProvider__WEBPACK_IMPORTED_MODULE_1__.GrepcViewProvider.viewType + ".global", webviewProvider));
    // let timeout: NodeJS.Timeout | undefined = undefined;
    // // create a decorator type that we use to decorate small numbers
    // const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
    // 	borderWidth: '1px',
    // 	borderStyle: 'solid',
    // 	overviewRulerColor: 'blue',
    // 	overviewRulerLane: vscode.OverviewRulerLane.Right,
    // 	light: {
    // 		// this color will be used in light color themes
    // 		borderColor: 'darkblue'
    // 	},
    // 	dark: {
    // 		// this color will be used in dark color themes
    // 		borderColor: 'lightblue'
    // 	}
    // });
    // let activeEditor = vscode.window.activeTextEditor;
    // const highlightRule = () => {
    // 	triggerUpdateDecorations();
    // };
    // let disposable1 = vscode.window.onDidChangeActiveTextEditor(e => {
    // 	console.log('onDidChangeActiveTextEditor', e);
    // });
    // let disposable2 = vscode.window.onDidChangeTextEditorSelection(e => {
    // 	console.log('onDidChangeTextEditorSelection', e);
    // 	triggerUpdateDecorations();
    // });
    //GrepcPanel.render(context.extensionUri);
    // function updateDecorations() {
    // 	console.timeStamp('Running update decorations');
    // 	console.error('Running update decorations');
    // 	if (!activeEditor) {
    // 		return;
    // 	}
    // 	const regEx = /\w+/g;
    // 	const text = activeEditor.document.getText();
    // 	const decorations: vscode.DecorationOptions[] = [];
    // 	let match;
    // 	while((match = regEx.exec(text)))
    // 	{
    // 		const startPos = activeEditor.document.positionAt(match.index);
    // 		const endPos = activeEditor.document.positionAt(match.index + match[0].length);
    // 		const decoration = { 
    // 			range: new vscode.Range(startPos, endPos), 
    // 			hoverMessage: 'Number **' + match[0] + '**' 
    // 		};
    // 		decorations.push(decoration);
    // 	}
    // 	activeEditor.setDecorations(smallNumberDecorationType, decorations);
    // }
    // function triggerUpdateDecorations(throttle = false) {
    // 	if (timeout) {
    // 		clearTimeout(timeout);
    // 		timeout = undefined;
    // 	}
    // 	if (throttle) {
    // 		timeout = setTimeout(updateDecorations, 500);
    // 	} else {
    // 		updateDecorations();
    // 	}
    // }
    // if (activeEditor) {
    // 	triggerUpdateDecorations();
    // }
    // context.subscriptions.push(vscode.commands.registerCommand('grepc.highlightRule', highlightRule));
    // context.subscriptions.push(disposable1, disposable2);
}
// This method is called when your extension is deactivated
function deactivate() { }

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map