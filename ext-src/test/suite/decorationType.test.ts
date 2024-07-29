import * as assert from 'assert';
import * as vscode from 'vscode';
import { DecorationTypeWrapper } from '../../decorations/decorationType';
import { Rule } from '../../rules/rule';

suite('DecorationTypeWrapper', () => {
    vscode.window.showInformationMessage('Start all tests.');
    let dt: DecorationTypeWrapper;
    let textDoc: vscode.TextDocument;
    let rule: Rule;

    suiteSetup(async () => {
        // textDoc = new vscode.TextDocument();
        textDoc = await vscode.workspace.openTextDocument({
            content: 'abc\n123\n#@4\n\n',
        });
        rule = new Rule('rule 1');
        rule.regularExpression = '[0-9]+';
        dt = new DecorationTypeWrapper(textDoc, rule);
        dt.updateOccurrences(textDoc);
    });

    test('removeIntersectingOccurrences() -> single intersection', () => {
        const contentChangeRange = new vscode.Range(textDoc.positionAt(2), textDoc.positionAt(7));
        const expectedRange = new vscode.Range(textDoc.positionAt(1), textDoc.positionAt(7));
        const result = dt.removeIntersectingOccurrences(contentChangeRange);
        assert.ok(result.removed == 1);
        assert.equal(textDoc.getText(result.range), textDoc.getText(expectedRange));
    });

    test('removeIntersectingOccurrences() -> no intersection', () => {
        const contentChangeRange = new vscode.Range(textDoc.positionAt(0), textDoc.positionAt(2));
        const result = dt.removeIntersectingOccurrences(contentChangeRange);
        assert.ok(result.removed == 0);
    });

    test('Sample test', () => {
        assert.strictEqual([1, 2, 3].indexOf(5), -1);
        assert.strictEqual([1, 2, 3].indexOf(0), -1);
        console.log(dt);
    });
});
