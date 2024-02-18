/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(__webpack_require__(1));
const grepcProvider_1 = __webpack_require__(2);
const grepcViewProvider_1 = __webpack_require__(3);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    let timeout = undefined;
    // create a decorator type that we use to decorate small numbers
    const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        overviewRulerColor: 'blue',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            // this color will be used in light color themes
            borderColor: 'darkblue'
        },
        dark: {
            // this color will be used in dark color themes
            borderColor: 'lightblue'
        }
    });
    let activeEditor = vscode.window.activeTextEditor;
    const highlightRule = () => {
        triggerUpdateDecorations();
    };
    let disposable1 = vscode.window.onDidChangeActiveTextEditor(e => {
        console.log('onDidChangeActiveTextEditor', e);
    });
    let disposable2 = vscode.window.onDidChangeTextEditorSelection(e => {
        console.log('onDidChangeTextEditorSelection', e);
        triggerUpdateDecorations();
    });
    const webviewProvider = new grepcViewProvider_1.GrepcViewProvider(context.extensionUri);
    vscode.window.registerWebviewViewProvider(grepcViewProvider_1.GrepcViewProvider.viewType, webviewProvider);
    //GrepcPanel.render(context.extensionUri);
    function updateDecorations() {
        console.timeStamp('Running update decorations');
        console.error('Running update decorations');
        if (!activeEditor) {
            return;
        }
        const regEx = /\w+/g;
        const text = activeEditor.document.getText();
        const decorations = [];
        let match;
        while ((match = regEx.exec(text))) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.positionAt(match.index + match[0].length);
            const decoration = {
                range: new vscode.Range(startPos, endPos),
                hoverMessage: 'Number **' + match[0] + '**'
            };
            decorations.push(decoration);
        }
        activeEditor.setDecorations(smallNumberDecorationType, decorations);
    }
    function triggerUpdateDecorations(throttle = false) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        if (throttle) {
            timeout = setTimeout(updateDecorations, 500);
        }
        else {
            updateDecorations();
        }
    }
    if (activeEditor) {
        triggerUpdateDecorations();
    }
    context.subscriptions.push(vscode.commands.registerCommand('grepc.highlightRule', highlightRule));
    let grepcProvider = new grepcProvider_1.GrepcProvider();
    vscode.window.registerTreeDataProvider('grepc', grepcProvider);
    context.subscriptions.push(disposable1, disposable2);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GrepcProvider = void 0;
const vscode = __importStar(__webpack_require__(1));
class GrepcProvider {
    rulesTreeItem = new vscode.TreeItem("RULES", vscode.TreeItemCollapsibleState.Expanded);
    constructor() {
        this.rulesTreeItem.id = "rules";
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return this.getRootTreeItems();
        }
        return [];
    }
    getRootTreeItems() {
        return [this.rulesTreeItem];
    }
}
exports.GrepcProvider = GrepcProvider;


/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GrepcViewProvider = void 0;
const vscode = __importStar(__webpack_require__(1));
const getNonce_1 = __webpack_require__(4);
class GrepcViewProvider {
    extensionUri;
    static viewType = 'grepc.webview';
    webview = null;
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView, context, token) {
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
    _getWebviewContent(webview, extensionUri) {
        // The CSS file from the Angular build output
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "styles.css"));
        // The JS files from the Angular build output
        const polyfillsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "polyfills.js"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview-ui", "grepc-webview", "dist", "grepc-webview", "browser", "main.js"));
        const nonce = (0, getNonce_1.getNonce)();
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
exports.GrepcViewProvider = GrepcViewProvider;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getNonce = void 0;
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
exports.getNonce = getNonce;


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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map