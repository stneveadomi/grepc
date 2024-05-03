import * as vscode from 'vscode';
import { Command } from './command';

export class CommandManager {
    constructor(
        private subscriptions: { dispose(): any; }[]
    ) { }

    commands: Command[] = [
        new Command('grepc.addBlankRule', () => {}),
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