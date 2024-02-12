import * as vscode from 'vscode';

export class Rule {
    decoration: vscode.TextEditorDecorationType;
    regularExpression: RegExp;

    constructor(
        decoration: vscode.TextEditorDecorationType,
        regularExpression: RegExp
    ) {
        this.decoration = decoration;
        this.regularExpression = regularExpression;
    }
}