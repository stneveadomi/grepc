// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GrepcViewProvider } from './viewProviders/grepcViewProvider';
import { RuleFactory } from './rules/ruleFactory';
import { GlobalState } from './utilities/types';
import { DecorationTypeManager } from './decorationTypeManager';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const logger = vscode.window.createOutputChannel('grepc');
	logger.show();

	const localRuleFactory = new RuleFactory(context.workspaceState, false);
	const globalRuleFactory = new RuleFactory(<GlobalState> context.globalState, true);

	const dtTypeManager = new DecorationTypeManager(
		[localRuleFactory, globalRuleFactory],
	);

	const localWebviewProvider = new GrepcViewProvider("grepc.webview.local", context.extensionUri, localRuleFactory);
	const globalWebviewProvider = new GrepcViewProvider("grepc.webview.global", context.extensionUri, globalRuleFactory);

	localRuleFactory.grepcProvider = localWebviewProvider;
	globalRuleFactory.grepcProvider = globalWebviewProvider;

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(localWebviewProvider.viewType, localWebviewProvider),
		vscode.window.registerWebviewViewProvider(globalWebviewProvider.viewType, globalWebviewProvider),
		dtTypeManager
	);
	
	dtTypeManager.enableDecorationDetection();
}

// This method is called when your extension is deactivated
export function deactivate() {}
