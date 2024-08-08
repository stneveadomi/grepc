import * as vscode from 'vscode';
import { GrepcViewProvider } from './viewProviders/grepcViewProvider';
import { DecorationTypeManager } from './decorationTypeManager';
import { CommandManager } from './commands/commandManager';
import { RuleFactoryMediator } from './rules/ruleFactoryMediator';
import { LocationState } from './rules/locationState';
import { ReleaseNotesWebview } from './viewProviders/releaseNotesViewProvider';
import { DragService } from './dragService';

export function activate(context: vscode.ExtensionContext) {
    const logger = vscode.window.createOutputChannel('grepc', { log: true });

    logger.info('Initializing grepc extension.');
    const initStart = Date.now();

    const ruleFactoryMediator = new RuleFactoryMediator(context, logger);
    const localRuleFactory = ruleFactoryMediator.getRuleFactory(LocationState.LOCAL);
    const globalRuleFactory = ruleFactoryMediator.getRuleFactory(LocationState.GLOBAL);

    if (!localRuleFactory || !globalRuleFactory) {
        logger.error('Unable to instantiate rule factories. Throwing error.');
        throw new Error('Unable to instantiate rule factories');
    }

    const dtTypeManager = new DecorationTypeManager([localRuleFactory, globalRuleFactory], logger);

    const dragService = new DragService(ruleFactoryMediator, dtTypeManager, logger);

    const localWebviewProvider = new GrepcViewProvider('grepc.webview.local', context.extensionUri, localRuleFactory, dtTypeManager, dragService, logger);
    const globalWebviewProvider = new GrepcViewProvider('grepc.webview.global', context.extensionUri, globalRuleFactory, dtTypeManager, dragService, logger);

    dragService.register(LocationState.LOCAL, localWebviewProvider);
    dragService.register(LocationState.GLOBAL, globalWebviewProvider);

    localRuleFactory.grepcProvider = localWebviewProvider;
    globalRuleFactory.grepcProvider = globalWebviewProvider;

    const releaseNotesWebviewProvider = new ReleaseNotesWebview('grepc.webview.release-notes', context, logger);

    const enableContextRetention = {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
    };
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(localWebviewProvider.viewType, localWebviewProvider, enableContextRetention),
        vscode.window.registerWebviewViewProvider(globalWebviewProvider.viewType, globalWebviewProvider, enableContextRetention),
        releaseNotesWebviewProvider,
        dtTypeManager,
    );

    const commandManager = new CommandManager(context.subscriptions, ruleFactoryMediator, releaseNotesWebviewProvider, logger);
    commandManager.registerCommands();

    dtTypeManager.enableDecorationDetection();

    releaseNotesWebviewProvider.showWebviewIfNewVersion();

    logger.info(`Grepc initialized in ${Date.now() - initStart} ms.`);
}

export function deactivate() {}
