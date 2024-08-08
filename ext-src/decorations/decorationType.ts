import { Rule } from '../rules/rule';
import * as vscode from 'vscode';
import { IntersectingRangeData } from './intersectingRangeData';

/**
 * DecorationTypeWrapper is a pseudo-wrapper class for the vscode
 * api for {@link vscode.TextEditorDecorationType TextEditorDecorationType}.
 *
 * This class when instantiated will call {@link vscode.window.createTextEditorDecorationType createTextEditorDecorationType}.
 *
 * On disposal (dispose()) of this wrapper, the textEditorDecType will also be disposed.
 */
export class DecorationTypeWrapper {
    private decorationType: vscode.TextEditorDecorationType | undefined;

    public decorationOptions: vscode.DecorationOptions[] = [];
    public activeOccurrences: vscode.Range[] = [];

    constructor(
        private readonly document: vscode.TextDocument,
        public rule: Rule,
        private logger: vscode.LogOutputChannel,
    ) {
        this.generateDecorationType();
    }

    private generateDecorationType() {
        if (this.decorationType) {
            this.decorationType.dispose();
        }
        this.decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.rule.backgroundColor ?? '',
            outline: this.rule.outline ?? '',
            outlineColor: this.rule.outlineColor ?? '',
            outlineWidth: this.rule.outlineWidth ?? '',

            border: this.rule.border ?? '',
            borderColor: this.rule.borderColor ?? '',
            borderWidth: this.rule.borderWidth ?? '',

            color: this.rule.color ?? '',

            fontStyle: this.rule.fontStyle ?? '',
            fontWeight: this.rule.fontWeight ?? '',

            textDecoration: this.rule.textDecoration ?? '',

            cursor: this.rule.cursor ?? '',
            isWholeLine: this.rule.isWholeLine ?? false,
            overviewRulerColor: this.rule.overviewRulerColor ?? '',
            overviewRulerLane: this.rule.overviewRulerLane ? Number(this.rule.overviewRulerLane) : vscode.OverviewRulerLane.Full,
        });
    }

    /**
     * If decoration has changed, we must dispose of this object properly and
     * create a new decoration type wrapper with its corresponding implementation.
     * @param current
     * @returns
     */
    hasDecorationChanged(current: Rule) {
        return (
            this.rule.id !== current.id ||
            this.rule.backgroundColor !== current.backgroundColor ||
            this.rule.border !== current.border ||
            this.rule.borderColor !== current.borderColor ||
            this.rule.borderWidth !== current.borderWidth ||
            this.rule.color !== current.color ||
            this.rule.cursor !== current.cursor ||
            this.rule.fontStyle !== current.fontStyle ||
            this.rule.fontWeight !== current.fontWeight ||
            this.rule.isWholeLine !== current.isWholeLine ||
            this.rule.maxOccurrences !== current.maxOccurrences ||
            this.rule.outline !== current.outline ||
            this.rule.outlineColor !== current.outlineColor ||
            this.rule.outlineWidth !== current.outlineWidth ||
            this.rule.overviewRulerColor !== current.overviewRulerColor ||
            this.rule.overviewRulerLane !== current.overviewRulerLane ||
            this.rule.textDecoration !== current.textDecoration
        );
    }

    needsOnlyOccurrenceUpdate(current: Rule) {
        return (
            (this.rule.regularExpression !== current.regularExpression ||
                this.rule.regularExpressionFlags !== current.regularExpressionFlags ||
                this.rule.includedFiles !== current.includedFiles ||
                this.rule.excludedFiles !== current.excludedFiles ||
                this.rule.title !== current.title) &&
            !this.hasDecorationChanged(current)
        );
    }

    /**
     * This method is a helper for taking any text range from vs code and expanding it to be the entire start and end lines.
     * For example, if the range is "b" in the text "abc\ndef". This will return a range of "abc\n".
     * @param range
     */
    getFullLineRange(range: vscode.Range) {
        return new vscode.Range(this.document.lineAt(range.start.line).range.start, this.document.lineAt(range.end.line).range.end);
    }

    /**
     * Another helper for occurrence changes
     * @param contentChange
     * @returns boolean indicating if we need to apply decorations after this update.
     */
    generateOccurrencesOnChange(contentChange: vscode.TextDocumentContentChangeEvent) {
        // if there is a new line, we just need to recalculate everything.
        // similarily if there is a deletion, ditto.
        if ((contentChange.text.length == 0 && !contentChange.range.isSingleLine) || /[\n\r]/g.test(contentChange.text)) {
            vscode.window.visibleTextEditors
                .filter((editor) => editor.document === this.document)
                .forEach((editor) => {
                    this.clearDecorations(editor);
                });
            this.updateOccurrences(this.document, this.rule);
            return true;
        }

        if (this.rule.includedFiles && !new RegExp(this.rule.includedFiles).test(this.document.fileName)) {
            this.clearOccurrenceData();
            return false;
        }

        if (this.rule.excludedFiles && new RegExp(this.rule.excludedFiles).test(this.document.fileName)) {
            this.clearOccurrenceData();
            return false;
        }

        // We will pass in a getFullLineRange() to handle removing intersecting occurrences.
        // This just makes everything so much easier as we are forcing updates per line.
        // We could be more particular, but the logic gets a lot harder.
        // TODO: Investigate why deletes do not work. This will involve removing this call to getFullLineRange.
        const intersectingRangeData = this.removeIntersectingOccurrences(this.getFullLineRange(contentChange.range));
        if (intersectingRangeData.removed > 0 && !intersectingRangeData.range) {
            throw Error('Intersecting Range Data should contain a range if removed > 0.');
        }

        //either expanded range over all intersecting matches
        //or just take the content change range and get the full line i.e. contentChange.range
        const textRange = this.getFullLineRange(contentChange.range);
        const text = this.document.getText(textRange);
        this.logger.error(`${this.toString()} checking matches over "${text}"`);
        const regEx = new RegExp(this.rule.regularExpression, this.rule.regularExpressionFlags || 'g');

        let match;

        const insertIndex = intersectingRangeData.insertIndex!;
        let occurrence = insertIndex + 1;
        const offset = this.document.offsetAt(textRange.start);

        const newDecorations: vscode.DecorationOptions[] = [];
        const newOccurrences: vscode.Range[] = [];
        while ((match = regEx.exec(text)) && occurrence < (this.rule.maxOccurrences ?? 1000)) {
            const startPos = this.document.positionAt(offset + match.index);
            const endPos = this.document.positionAt(offset + match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            const decoration = {
                range,
                hoverMessage: `Rule: ${this.rule.title}\n #${occurrence++}`,
            };
            newDecorations.push(decoration);
            newOccurrences.push(range);
        }

        newDecorations.forEach((decOption, i) => {
            this.decorationOptions.splice(insertIndex + i, 0, decOption);
        });

        newOccurrences.forEach((occurrenceRange, i) => {
            this.activeOccurrences.splice(insertIndex + i, 0, occurrenceRange);
        });

        // If no removed rules and no new decorations, no need to apply decorations.
        return newDecorations.length !== 0 || intersectingRangeData.removed !== 0;
    }

    /**
     * Run binary search to find an intersecting range within this.activeOccurrences.
     *
     * If an intersection is found, expand left and right to see if neighboring ranges are
     *
     * If no intersection is found, return removed = 0 and the index of where to insert based off the range.
     *
     * @param ranges
     * @param contentChangeRange
     * @returns vscode.Range - intersecting range built by the union of all intersecting ranges.
     */
    removeIntersectingOccurrences(contentChangeRange: vscode.Range): IntersectingRangeData {
        let left = 0;
        let right = this.activeOccurrences.length - 1;

        // shift range -1 and  +1 on either end to match with neighboring occurrences.
        let newStart = contentChangeRange.start;
        if (contentChangeRange.start.character > 0) {
            newStart = contentChangeRange.start.translate(0, -1);
        }
        const newEnd = contentChangeRange.end.translate(0, 1);
        contentChangeRange = new vscode.Range(newStart, newEnd);

        while (left <= right) {
            const middle = Math.floor((left + right) / 2);
            const midRange = this.activeOccurrences[middle];
            if (midRange == undefined) {
                this.logger.debug(`midRange is undefined: ${middle} not in [${left}, ${right})`);
                return { removed: 0, insertIndex: left + 1 };
            }

            let intersection;
            if ((intersection = midRange.intersection(contentChangeRange))) {
                // once we find intersection, begin unioning the intersections.
                intersection = contentChangeRange.union(midRange);

                let newIntersection;

                // go left and check all intersections
                for (left = middle - 1; left >= 0 && (newIntersection = contentChangeRange.intersection(this.activeOccurrences[left])); left--) {
                    intersection = newIntersection.union(intersection);
                }

                // go right and check all intersections
                for (
                    right = middle + 1;
                    right < this.activeOccurrences.length && (newIntersection = contentChangeRange.intersection(this.activeOccurrences[right]));
                    right++
                ) {
                    intersection = newIntersection.union(intersection);
                }

                this.decorationOptions.splice(left + 1, right - (left + 1));
                this.activeOccurrences.splice(left + 1, right - (left + 1));

                return {
                    removed: right - (left + 1),
                    range: intersection,
                    insertIndex: left + 1,
                };
                //if mid range is before
            } else if (midRange.start.isBeforeOrEqual(contentChangeRange.start)) {
                left = middle + 1;
            } else {
                right = middle - 1;
            }
        }

        this.logger.debug(`${this.toString()} Unable to find an intersection.`);
        return { removed: 0, insertIndex: left };
    }

    getDisposeHandle() {
        return this.decorationType?.dispose;
    }

    applyDecorationsToEditor(textEditor: vscode.TextEditor) {
        this.logger.debug(`[DTM] ${this.toString()} Applying decoration ${this.rule.title} to editor: ${textEditor.document.fileName}`);
        if (textEditor.document.fileName !== this.document.fileName) {
            throw new Error(`CANNOT APPLY DECORATIONS TO DIFFERENT DOCUMENT - obs -> ${textEditor.document.fileName} != expected ->${this.document.fileName}`);
        }
        // we must regenerate the decoration type here as to fix priorities since
        // vscode goes simply by newest decoration type to determine priority.
        this.generateDecorationType();
        textEditor.setDecorations(this.decorationType!, this.decorationOptions);
    }

    /**
     * Updates rule ref in decoration type, decorationOptions[], and activeOccurences[]
     *
     * @param document
     * @param rule
     */
    updateOccurrences(document: vscode.TextDocument, rule?: Rule) {
        if (rule) {
            this.rule = rule;
        } else {
            rule = this.rule;
        }

        const regEx = new RegExp(rule.regularExpression, rule.regularExpressionFlags || 'g');
        const decorations: vscode.DecorationOptions[] = [];
        const ranges: vscode.Range[] = [];

        if (rule.includedFiles && !new RegExp(rule.includedFiles).test(document.fileName)) {
            this.clearOccurrenceData();
            return;
        }

        if (rule.excludedFiles && new RegExp(rule.excludedFiles).test(document.fileName)) {
            this.clearOccurrenceData();
            return;
        }

        let match;
        let occurrence = 0;
        while ((match = regEx.exec(document.getText())) && decorations.length < (rule.maxOccurrences ?? 1000)) {
            occurrence++;
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            const decoration = {
                range: range,
                hoverMessage: `Rule: ${rule.title}\n #${occurrence}`,
            };
            decorations.push(decoration);
            ranges.push(range);
        }

        this.decorationOptions = decorations;
        this.activeOccurrences = ranges;
    }

    clearDecorations(activeEditor: vscode.TextEditor) {
        activeEditor.setDecorations(this.decorationType!, []);
    }

    clearOccurrenceData() {
        this.activeOccurrences = [];
        this.decorationOptions = [];
    }

    toString() {
        return `[${this.rule.id.substring(0, 5)} - ${this.rule.title}]`;
    }

    dispose() {
        this.decorationType?.dispose();
    }
}
