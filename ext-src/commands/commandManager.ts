import * as vscode from 'vscode';
import { Command } from './command';
import { window } from 'vscode';
import { LocationState } from '../rules/locationState';
import { RuleFactoryMediator } from '../rules/ruleFactoryMediator';
import { Rule } from '../rules/rule';

export class CommandManager {
    constructor(
        private subscriptions: { dispose(): any; }[],
        private rfm: RuleFactoryMediator
    ) { }

    showLocationInput(title: string) {
        return vscode.window.showQuickPick([LocationState.LOCAL, LocationState.GLOBAL], {
            title,
            
        });
    }

    showRuleTitleInput(title: string) {
        return vscode.window.showInputBox({
            title,
            prompt: "Enter the title for the rule (not regex)",
            placeHolder: 'Rule 0',
        });
    }

    showRegExInput(title: string) {
        return vscode.window.showInputBox({
            title,
            prompt: "Enter the regular expression for the rule (optional)",
            placeHolder: '[a-z]{3}'
        });
    }


    commands: Command[] = [
        new Command('grepc.addRule', async () => {
            const inputTitle = 'Grepc: Add new rule';
            let location = await this.showLocationInput(inputTitle);
            if(!location) {
                return;
            }

            let title = await this.showRuleTitleInput(inputTitle);
            if(!title) {
                return;
            }

            let regEx = await this.showRegExInput(inputTitle);
            if(regEx === undefined) {
                return;
            }

            vscode.window.showInformationMessage('Creating rule.');

            console.log('getting rule factory');
            this.rfm.getRuleFactory(<LocationState> location)?.addRule(title, regEx);
        }),
        new Command('grepc.addTextRule', async () => {
            const inputTitle = 'Grepc: Add rule from selection';
            let location = await this.showLocationInput(inputTitle);
            if(!location) {
                return;
            }

            let title = await this.showRuleTitleInput(inputTitle);
            if(!title) {
                return;
            }

            let selection = vscode.window.activeTextEditor?.selection;
            let regEx = '';
            if(selection && window.activeTextEditor?.document) {
                regEx = window.activeTextEditor.document.getText(new vscode.Range(selection.start, selection.end));
                if(regEx === undefined) {
                    return;
                }
            }

            vscode.window.showInformationMessage('Creating rule.');

            console.log('getting rule factory');
            this.rfm.getRuleFactory(<LocationState> location)?.addRule(title, regEx);
        }),
        new Command('grepc.removeRule', () => {}),
        new Command('grepc.disableAllRules', () => {
            for(let ruleFactory of this.rfm.map.values()) {
                ruleFactory.disableRules();
            }
        }),
        new Command('grepc.enableAllRules', () => {
            for(let ruleFactory of this.rfm.map.values()) {
                ruleFactory.enableRules();
            }
        }),
        new Command('grepc.disableLocalRules', () => {
            this.rfm.getRuleFactory(LocationState.LOCAL)?.disableRules();
        }),
        new Command('grepc.enableLocalRules', () => {
            this.rfm.getRuleFactory(LocationState.LOCAL)?.enableRules();
        }),
        new Command('grepc.disableGlobalRules', () => {
            this.rfm.getRuleFactory(LocationState.GLOBAL)?.disableRules();
        }),
        new Command('grepc.enableGlobalRules', () => {
            this.rfm.getRuleFactory(LocationState.GLOBAL)?.enableRules();
        }),
    ];

    registerCommands() {
        this.commands.forEach(command => {
            this.subscriptions.push(vscode.commands.registerCommand(command.id, command.callback, command));
        });
    }
}