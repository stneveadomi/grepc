// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GrepcViewProvider } from './viewProviders/grepcViewProvider';
import { RuleFactory } from './rules/ruleFactory';
import { GlobalState } from './utilities/types';
import { timeStamp } from 'console';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const logger = vscode.window.createOutputChannel('grepc');
	logger.show();
	logger.appendLine(JSON.stringify(context.workspaceState));
	logger.appendLine(JSON.stringify(context.globalState));
	const localRuleFactory = new RuleFactory(context.workspaceState, false);
	const globalRuleFactory = new RuleFactory(<GlobalState> context.globalState, true);
	const localWebviewProvider = new GrepcViewProvider("grepc.webview.local", context.extensionUri, localRuleFactory);
	const globalWebviewProvider = new GrepcViewProvider("grepc.webview.global", context.extensionUri, globalRuleFactory);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(localWebviewProvider.viewType, localWebviewProvider),
		vscode.window.registerWebviewViewProvider(globalWebviewProvider.viewType, globalWebviewProvider),
	);
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
export function deactivate() {}
