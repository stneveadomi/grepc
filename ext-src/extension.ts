// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GrepcViewProvider } from './viewProviders/grepcViewProvider';
import { DecorationTypeManager } from './decorationTypeManager';
import { CommandManager } from './commands/commandManager';
import { RuleFactoryMediator } from './rules/ruleFactoryMediator';
import { LocationState } from './rules/locationState';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let logger = vscode.window.createOutputChannel('grepc', {log: true});

	logger.info('Initializing grepc extension.');
	const initStart = Date.now();

	const ruleFactoryMediator = new RuleFactoryMediator(context, logger);
	const localRuleFactory = ruleFactoryMediator.getRuleFactory(LocationState.LOCAL);
	const globalRuleFactory = ruleFactoryMediator.getRuleFactory(LocationState.GLOBAL);
	
	if(!localRuleFactory || !globalRuleFactory) {
		logger.error('Unable to instantiate rule factories. Throwing error.');
		throw new Error('Unable to instantiate rule factories');
	}

	const dtTypeManager = new DecorationTypeManager(
		[localRuleFactory, globalRuleFactory],
		logger
	);

	const localWebviewProvider = new GrepcViewProvider("grepc.webview.local", context.extensionUri, localRuleFactory, dtTypeManager, logger);
	const globalWebviewProvider = new GrepcViewProvider("grepc.webview.global", context.extensionUri, globalRuleFactory, dtTypeManager, logger);

	
	localRuleFactory.grepcProvider = localWebviewProvider;
	globalRuleFactory.grepcProvider = globalWebviewProvider;

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(localWebviewProvider.viewType, localWebviewProvider),
		vscode.window.registerWebviewViewProvider(globalWebviewProvider.viewType, globalWebviewProvider),
		dtTypeManager
	);

	const commandManager = new CommandManager(context.subscriptions, ruleFactoryMediator, logger);
	commandManager.registerCommands();
	
	dtTypeManager.enableDecorationDetection();

	logger.info(`Grepc initialized in ${Date.now() - initStart} ms.`);
}

// This method is called when your extension is deactivated
export function deactivate() {}
