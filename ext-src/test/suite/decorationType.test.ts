import * as assert from 'assert';
import * as vscode from 'vscode';
import { DecorationTypeWrapper } from '../../decorations/decorationType';
import { Rule } from '../../rules/rule';

suite('DecorationTypeWrapper', () => {
    vscode.window.showInformationMessage('Start all tests.');
    let dt: DecorationTypeWrapper;
    let textDoc: vscode.TextDocument;
    let rule: Rule;
    const logger = vscode.window.createOutputChannel('grepc', { log: true });

    suiteSetup(async () => {
        // textDoc = new vscode.TextDocument();
        let content = '';
        for (let i = 0; i < 1000; i++) {
            content += '12345\n';
            content += 'abcdef\n';
        }
        textDoc = await vscode.workspace.openTextDocument({
            content,
        });
        rule = new Rule('rule 1');
        rule.regularExpression = '[0-9]+';

        dt = new DecorationTypeWrapper(textDoc, rule, logger);
        dt.updateOccurrences(textDoc);
    });

    test('removeIntersectingOccurrences() -> single intersection', () => {
        const contentChangeRange = new vscode.Range(textDoc.positionAt(2), textDoc.positionAt(7));
        const expectedRange = new vscode.Range(textDoc.positionAt(0), textDoc.positionAt(8));
        const result = dt.removeIntersectingOccurrences(contentChangeRange);
        assert.ok(result.removed == 1);
        assert.equal(textDoc.getText(result.range), textDoc.getText(expectedRange));
        assert.equal(result.insertIndex, 0);
    });

    test('removeIntersectingOccurrences() -> single intersection, first position', () => {
        const expectedRange = dt.activeOccurrences[0];
        const result = dt.removeIntersectingOccurrences(expectedRange);
        assert.ok(result.removed == 1);
        assert.equal(textDoc.getText(result.range), textDoc.getText(expectedRange));
        assert.equal(result.insertIndex, 0);
    });

    test('removeIntersectingOccurrences() -> single intersection, middle position', () => {
        const expectedRange = dt.activeOccurrences[5];
        const result = dt.removeIntersectingOccurrences(expectedRange);
        assert.ok(result.removed == 1);
        assert.equal(textDoc.getText(result.range), textDoc.getText(expectedRange));
        assert.equal(result.insertIndex, 5);
    });

    test('removeIntersectingOccurrences() -> no intersection, first position', () => {
        const contentChangeRange = new vscode.Range(textDoc.positionAt(0), textDoc.positionAt(2));
        const result = dt.removeIntersectingOccurrences(contentChangeRange);
        assert.ok(result.removed == 0);
        assert.equal(result.insertIndex, 0);
    });

    test('removeIntersectingOccurrences() -> no intersection, middle position', () => {
        const range1 = dt.activeOccurrences[4];

        const start = range1.end.translate(1, -3);
        const end = range1.end.translate(1, -1);
        const contentChangeRange = new vscode.Range(start, end);
        const result = dt.removeIntersectingOccurrences(contentChangeRange);
        assert.ok(result.removed == 0);
        assert.equal(result.insertIndex, 5);
    });

    test('removeIntersectingOccurrences() -> no intersection, last position', () => {
        const range1 = dt.activeOccurrences[dt.activeOccurrences.length - 1];

        const start = range1.end.translate(1, -3);
        const end = range1.end.translate(1, -1);
        const contentChangeRange = new vscode.Range(start, end);
        const result = dt.removeIntersectingOccurrences(contentChangeRange);
        assert.ok(result.removed == 0);
        assert.equal(result.insertIndex, dt.activeOccurrences.length);
    });

    test('removeIntersectingOccurrences() -> no intersection, later position', () => {
        const range1 = dt.activeOccurrences[dt.activeOccurrences.length - 10];

        const start = range1.end.translate(1, -3);
        const end = range1.end.translate(1, -1);
        const contentChangeRange = new vscode.Range(start, end);
        const result = dt.removeIntersectingOccurrences(contentChangeRange);
        assert.ok(result.removed == 0);
        assert.equal(result.insertIndex, dt.activeOccurrences.length - 9);
    });

    test('removeIntersectingOccurrences() -> edge case, multiple intersections in one line', async () => {
        textDoc = await vscode.workspace.openTextDocument({
            content: `abc 123
            123 a 456 c 789
            abc 123
            `,
        });
        rule = new Rule('rule 1');
        rule.regularExpression = '[0-9]+';

        dt = new DecorationTypeWrapper(textDoc, rule, logger);
        dt.updateOccurrences(textDoc);

        const start = dt.activeOccurrences[1].start;
        const end = dt.activeOccurrences[3].end;
        const contentChangeRange = new vscode.Range(start, end);
        const result = dt.removeIntersectingOccurrences(contentChangeRange);
        const expectedResultRange = new vscode.Range(start.translate(0, -1), end.translate(0, 1));
        assert.equal(result.removed, 3);
        assert.equal(result.insertIndex, 1);
        assert.equal(dt.activeOccurrences.length, 2);
        assert.equal(dt.decorationOptions.length, 2);
        assert.ok(result.range?.isEqual(expectedResultRange));
    });

    test('getFullLineRange() -> single line', async () => {
        const range1 = dt.activeOccurrences[0];
        const observed = dt.getFullLineRange(range1);
        assert.ok(observed.isEqual(textDoc.lineAt(range1.start.line).range));
    });

    test('getFullLineRange() -> multi line', async () => {
        const range1 = dt.activeOccurrences[0].union(dt.activeOccurrences[1]);
        const observed = dt.getFullLineRange(range1);
        assert.ok(observed.isEqual(textDoc.lineAt(range1.start.line).range.union(textDoc.lineAt(range1.end.line).range)));
    });
});
