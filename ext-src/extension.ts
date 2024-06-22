import * as vscode from 'vscode';
import { GrepcViewProvider } from './viewProviders/grepcViewProvider';
import { DecorationTypeManager } from './decorationTypeManager';
import { CommandManager } from './commands/commandManager';
import { RuleFactoryMediator } from './rules/ruleFactoryMediator';
import { LocationState } from './rules/locationState';
import { WhatsNewWebview } from './viewProviders/whatsNewViewProvider';

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
	const whatsNewWebviewProvider = new WhatsNewWebview("grepc.webview.whats-new", context, logger);
	
	localRuleFactory.grepcProvider = localWebviewProvider;
	globalRuleFactory.grepcProvider = globalWebviewProvider;

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(localWebviewProvider.viewType, localWebviewProvider),
		vscode.window.registerWebviewViewProvider(globalWebviewProvider.viewType, globalWebviewProvider),
		whatsNewWebviewProvider,
		dtTypeManager
	);

	const commandManager = new CommandManager(context.subscriptions, ruleFactoryMediator, whatsNewWebviewProvider, logger);
	commandManager.registerCommands();
	
	dtTypeManager.enableDecorationDetection();

	whatsNewWebviewProvider.showWebviewIfNewVersion();

	logger.info(`Grepc initialized in ${Date.now() - initStart} ms.`);
}

export function deactivate() {}
