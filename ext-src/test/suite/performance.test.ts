import * as vscode from 'vscode';
import { DecorationTypeWrapper } from '../../decorations/decorationType';
import { Rule } from '../../rules/rule';

function generateMassiveContent() {
    let content = '';
    for (let i = 0; i < 1000; i++) {
        content += 'abcdefghijklmnopqrstuvwxyz\n';
    }
    return content;
}

suite('Performance Testing', () => {
    let dt: DecorationTypeWrapper;
    let textDoc: vscode.TextDocument;
    let rule: Rule;
    const logger = vscode.window.createOutputChannel('grepc', { log: true });

    suiteSetup(async () => {
        textDoc = await vscode.workspace.openTextDocument({
            content: generateMassiveContent(),
        });

        rule = new Rule('def');
        rule.regularExpression = 'def';
    });

    suiteTeardown(async () => {
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('updateOccurrences - test 1', async () => {
        await vscode.window.showTextDocument(textDoc, vscode.ViewColumn.Active, false);

        let avgTime = 0;
        for (let test = 1; test <= 10; test++) {
            const start = performance.now();

            dt = new DecorationTypeWrapper(textDoc, rule, logger);
            dt.updateOccurrences(textDoc);

            if (vscode.window.activeTextEditor) {
                dt.applyDecorationsToEditor(vscode.window.activeTextEditor);
            }

            const timeElapsed = performance.now() - start;
            avgTime += timeElapsed;
            console.log(`updateOccurrences - test ${test} - time ${timeElapsed}`);
            console.log(`occurrences - ${dt.activeOccurrences.length}`);
        }
        avgTime /= 10;

        console.log(`avg time: ${avgTime}ms`);
    });
});
