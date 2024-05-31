import * as vscode from 'vscode';
import { Command } from './command';
import { window } from 'vscode';
import { LocationState } from '../rules/locationState';
import { RuleFactoryMediator } from '../rules/ruleFactoryMediator';
import { Rule } from '../rules/rule';

export class CommandManager {

    COLORS = [
        "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "VIOLET"
    ];

    constructor(
        private subscriptions: { dispose(): any; }[],
        private rfm: RuleFactoryMediator,
        private logger: vscode.LogOutputChannel
    ) {
        this.commands = [
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
    
                let bgColor = await this.showBgColorInput(inputTitle);
    
                const logMessage = `Creating ${location === LocationState.GLOBAL ? 'global' : 'workspace'} rule "${title}"`;
                this.logger.info(logMessage);
                vscode.window.showInformationMessage(logMessage);
    
                this.rfm.getRuleFactory(<LocationState> location)?.addRule(title, regEx, bgColor);
            }, this.logger),
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
    
                let bgColor = await this.showBgColorInput(inputTitle);
    
                let selection = vscode.window.activeTextEditor?.selection;
                let regEx = '';
                if(selection && window.activeTextEditor?.document) {
                    regEx = window.activeTextEditor.document.getText(new vscode.Range(selection.start, selection.end));
                    if(regEx === undefined) {
                        return;
                    }
                }
    
                const logMessage = `Creating ${location === LocationState.GLOBAL ? 'global' : 'workspace'} rule "${title}"`;
                this.logger.info(logMessage);
                vscode.window.showInformationMessage(logMessage);
    
                this.rfm.getRuleFactory(<LocationState> location)?.addRule(title, regEx, bgColor);
            }, this.logger),
            new Command('grepc.deleteRule', async () => {
                const inputTitle = 'Which rule location do you want to delete from?';
    
                let location = await this.showLocationInput(inputTitle);
                if(!location) {
                    return;
                }
    
                let ruleFactory = this.rfm.getRuleFactory(<LocationState> location);
                let currentRuleArray = ruleFactory!.getRulesArray();
                let ruleToBeRemoved = await this.showRulesInput('Select a rule to be deleted:', currentRuleArray);
                if(!ruleToBeRemoved) {
                    return;
                }
    
                window.showWarningMessage('Deleting rule: ' + ruleToBeRemoved.label);
                ruleFactory?.removeRule(ruleToBeRemoved.id);
            }, this.logger),
            new Command('grepc.disableAllRules', () => {
                for(let ruleFactory of this.rfm.map.values()) {
                    ruleFactory.disableRules();
                }
            }, this.logger),
            new Command('grepc.enableAllRules', () => {
                for(let ruleFactory of this.rfm.map.values()) {
                    ruleFactory.enableRules();
                }
            }, this.logger),
            new Command('grepc.disableLocalRules', () => {
                this.rfm.getRuleFactory(LocationState.LOCAL)?.disableRules();
            }, this.logger),
            new Command('grepc.enableLocalRules', () => {
                this.rfm.getRuleFactory(LocationState.LOCAL)?.enableRules();
            }, this.logger),
            new Command('grepc.disableGlobalRules', () => {
                this.rfm.getRuleFactory(LocationState.GLOBAL)?.disableRules();
            }, this.logger),
            new Command('grepc.enableGlobalRules', () => {
                this.rfm.getRuleFactory(LocationState.GLOBAL)?.enableRules();
            }, this.logger),
        ];
    }

    showLocationInput(title: string) {
        return vscode.window.showQuickPick([LocationState.LOCAL, LocationState.GLOBAL], {
            title,
            placeHolder: "Enter the rule location <WORKSPACE|GLOBAL> (MANDATORY)"
        });
    }

    showRuleTitleInput(title: string) {
        return vscode.window.showInputBox({
            title,
            prompt: "Enter the title for the rule (MANDATORY)",
            placeHolder: 'Rule 0',
        });
    }

    showRulesInput(title: string, rules: Rule[]) {
        return vscode.window.showQuickPick(rules.map((rule, index, array) => {
            return <vscode.QuickPickItem & {id: string}> {
                label: rule.title,
                description: `Rule ${index}`,
                id: rule.id
            };
        }), {
            title,
            placeHolder: 'Select a rule from below to delete:'
        });
    }
    showRegExInput(title: string) {
        return vscode.window.showInputBox({
            title,
            prompt: "Enter the regular expression for the rule (optional)",
            placeHolder: '[a-z]{3}'
        });
    }

    showBgColorInput(title: string) {
        return vscode.window.showQuickPick(this.COLORS, {
            title,
            placeHolder: "Enter a background color for the rule (optional)"
        });
    }


    commands: Command[];

    registerCommands() {
        this.commands.forEach(command => {
            this.subscriptions.push(vscode.commands.registerCommand(command.id, command.callback, command));
        });
    }
}