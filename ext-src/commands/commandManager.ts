import * as vscode from 'vscode';
import { Command } from './command';
import { window } from 'vscode';
import { LocationState } from '../rules/locationState';
import { RuleFactoryMediator } from '../rules/ruleFactoryMediator';

export class CommandManager {
    constructor(
        private subscriptions: { dispose(): any; }[],
        private rfm: RuleFactoryMediator
    ) { }


    commands: Command[] = [
        new Command('grepc.addBlankRule', async () => {
            
            let location = await vscode.window.showQuickPick([LocationState.LOCAL, LocationState.GLOBAL]);
            this.rfm.getRuleFactory(<LocationState> location)?.addRule(new Rule(''));
        }),
        new Command('grepc.addTextRule', () => {}),
        new Command('grepc.removeRule', () => {}),
        new Command('grepc.disableAllRules', () => {}),
        new Command('grepc.disableLocalRules', () => {}),
        new Command('grepc.enableLocalRules', () => {}),
        new Command('grepc.disableGlobalRules', () => {}),
        new Command('grepc.enableGlobalRules', () => {}),
    ];

    registerCommands() {
        this.commands.forEach(command => {
            
            this.subscriptions.push(vscode.commands.registerCommand(command.id, command.callback, command));
        });
    }
}