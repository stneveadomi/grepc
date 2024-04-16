// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GrepcProvider } from './grepcProvider';
import { GrepcViewProvider } from './viewProviders/grepcViewProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const webviewProvider = new GrepcViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(GrepcViewProvider.viewType + ".local", webviewProvider),
		vscode.window.registerWebviewViewProvider(GrepcViewProvider.viewType + ".global", webviewProvider),
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
