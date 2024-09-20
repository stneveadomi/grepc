import * as vscode from 'vscode';
import { Command } from './command';
import { window } from 'vscode';
import { LocationState, reverseMap } from '../rules/locationState';
import { RuleFactoryMediator } from '../rules/ruleFactoryMediator';
import { Rule } from '../rules/rule';
import { ReleaseNotesWebview } from '../viewProviders/releaseNotesViewProvider';

export class CommandManager {
    COLORS = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE', 'VIOLET'];

    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private subscriptions: { dispose(): any }[],
        private rfm: RuleFactoryMediator,
        private releaseNotesWebview: ReleaseNotesWebview,
        private logger: vscode.LogOutputChannel,
    ) {
        this.commands = [
            new Command(
                'grepc.addRule',
                async () => {
                    const inputTitle = 'grepc: Add new rule';
                    const location = await this.showLocationInput(inputTitle);
                    if (!location) {
                        return;
                    }

                    const title = await this.showRuleTitleInput(inputTitle);
                    if (!title) {
                        return;
                    }

                    const regEx = await this.showRegExInput(inputTitle);

                    const bgColor = await this.showBgColorInput(inputTitle);

                    const logMessage = `Creating ${reverseMap(<LocationState>location)} rule "${title}"`;
                    this.logger.info(logMessage);
                    vscode.window.showInformationMessage(logMessage);

                    const rule = new Rule(title);
                    rule.regularExpression = regEx ?? '';
                    rule.regularExpressionFlags = 'g';
                    rule.backgroundColor = bgColor ?? '';
                    rule.enabled = true;

                    this.rfm.getRuleFactory(<LocationState>location)?.addRule(rule);
                },
                this.logger,
            ),
            new Command(
                'grepc.addTextRule',
                async () => {
                    const inputTitle = 'grepc: Add rule from selection';
                    const location = await this.showLocationInput(inputTitle);
                    if (!location) {
                        return;
                    }

                    const title = await this.showRuleTitleInput(inputTitle);
                    if (!title) {
                        return;
                    }

                    const bgColor = await this.showBgColorInput(inputTitle);

                    const selection = vscode.window.activeTextEditor?.selection;
                    let regEx = '';
                    if (selection && window.activeTextEditor?.document) {
                        regEx = window.activeTextEditor.document.getText(new vscode.Range(selection.start, selection.end));
                        if (regEx === undefined) {
                            return;
                        }
                    }

                    const logMessage = `Creating ${reverseMap(<LocationState>location)} rule "${title}"`;
                    this.logger.info(logMessage);
                    vscode.window.showInformationMessage(logMessage);

                    const rule = new Rule(title);
                    rule.regularExpression = regEx ?? '';
                    rule.regularExpressionFlags = 'g';
                    rule.backgroundColor = bgColor ?? '';
                    rule.enabled = true;

                    this.rfm.getRuleFactory(<LocationState>location)?.addRule(rule);
                },
                this.logger,
            ),
            new Command(
                'grepc.deleteRule',
                async () => {
                    const inputTitle = 'Which rule location do you want to delete from?';

                    const location = await this.showLocationInput(inputTitle);
                    if (!location) {
                        return;
                    }

                    const ruleFactory = this.rfm.getRuleFactory(<LocationState>location);
                    const currentRuleArray = ruleFactory!.getRulesArray();
                    const ruleToBeRemoved = await this.showRulesInput('Select a rule to be deleted:', currentRuleArray);
                    if (!ruleToBeRemoved) {
                        return;
                    }

                    window.showWarningMessage('Deleting rule: ' + ruleToBeRemoved.label);
                    ruleFactory?.removeRule(ruleToBeRemoved.id);
                },
                this.logger,
            ),
            new Command(
                'grepc.disableAllRules',
                () => {
                    for (const ruleFactory of this.rfm.map.values()) {
                        ruleFactory.disableRules();
                    }
                },
                this.logger,
            ),
            new Command(
                'grepc.enableAllRules',
                () => {
                    for (const ruleFactory of this.rfm.map.values()) {
                        ruleFactory.enableRules();
                    }
                },
                this.logger,
            ),
            new Command(
                'grepc.disableLocalRules',
                () => {
                    this.rfm.getRuleFactory(LocationState.LOCAL)?.disableRules();
                },
                this.logger,
            ),
            new Command(
                'grepc.enableLocalRules',
                () => {
                    this.rfm.getRuleFactory(LocationState.LOCAL)?.enableRules();
                },
                this.logger,
            ),
            new Command(
                'grepc.disableGlobalRules',
                () => {
                    this.rfm.getRuleFactory(LocationState.GLOBAL)?.disableRules();
                },
                this.logger,
            ),
            new Command(
                'grepc.enableGlobalRules',
                () => {
                    this.rfm.getRuleFactory(LocationState.GLOBAL)?.enableRules();
                },
                this.logger,
            ),
            new Command(
                'grepc.showReleaseNotes',
                () => {
                    this.releaseNotesWebview.showWebview();
                },
                this.logger,
            ),
            new Command(
                'grepc.minimizeAll',
                () => {
                    for (const ruleFactory of this.rfm.map.values()) {
                        ruleFactory.minimizeAll();
                    }
                },
                this.logger,
            ),
            new Command(
                'grepc.minimizeLocal',
                () => {
                    this.rfm.getRuleFactory(LocationState.LOCAL)?.minimizeAll();
                },
                this.logger,
            ),
            new Command(
                'grepc.minimizeGlobal',
                () => {
                    this.rfm.getRuleFactory(LocationState.GLOBAL)?.minimizeAll();
                },
                this.logger,
            ),
            new Command(
                'grepc.editRulesLocal',
                () => {
                    this.rfm.getRuleFactory(LocationState.LOCAL)?.pushEditRules();
                },
                this.logger,
            ),
            new Command(
                'grepc.editRulesGlobal',
                () => {
                    this.rfm.getRuleFactory(LocationState.GLOBAL)?.pushEditRules();
                },
                this.logger,
            ),
            new Command(
                'grepc.exportRulesLocal',
                () => {
                    vscode.env.clipboard.writeText(JSON.stringify(this.rfm.getRuleFactory(LocationState.LOCAL)?.getRulesArray()));
                    vscode.window.showInformationMessage('✅ Copied local rules to clipboard.');
                },
                this.logger,
            ),
            new Command(
                'grepc.exportRulesGlobal',
                () => {
                    vscode.env.clipboard.writeText(JSON.stringify(this.rfm.getRuleFactory(LocationState.GLOBAL)?.getRulesArray()));
                    vscode.window.showInformationMessage('✅ Copied global rules to clipboard.');
                },
                this.logger,
            ),
        ];
    }

    showLocationInput(title: string) {
        return vscode.window.showQuickPick([LocationState.LOCAL, LocationState.GLOBAL], {
            title,
            placeHolder: 'Enter the rule location <WORKSPACE|GLOBAL> (MANDATORY)',
        });
    }

    showRuleTitleInput(title: string) {
        return vscode.window.showInputBox({
            title,
            prompt: 'Enter the title for the rule (MANDATORY)',
            placeHolder: 'Rule 0',
        });
    }

    showRulesInput(title: string, rules: Rule[]) {
        return vscode.window.showQuickPick(
            rules.map((rule, index) => {
                return <vscode.QuickPickItem & { id: string }>{
                    label: rule.title,
                    description: `Rule ${index}`,
                    id: rule.id,
                };
            }),
            {
                title,
                placeHolder: 'Select a rule from below to delete:',
            },
        );
    }
    showRegExInput(title: string) {
        return vscode.window.showInputBox({
            title,
            prompt: 'Enter the regular expression for the rule (optional)',
            placeHolder: '[a-z]{3}',
        });
    }

    showBgColorInput(title: string) {
        return vscode.window.showQuickPick(this.COLORS, {
            title,
            placeHolder: 'Enter a background color for the rule (optional)',
        });
    }

    commands: Command[];

    registerCommands() {
        this.commands.forEach((command) => {
            this.subscriptions.push(vscode.commands.registerCommand(command.id, command.callback, command));
        });
    }
}
