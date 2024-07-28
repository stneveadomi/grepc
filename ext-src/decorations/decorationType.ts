import { Rule } from "../rules/rule";
import * as vscode from 'vscode';

/**
 * DecorationTypeWrapper is a pseudo-wrapper class for the vscode
 * api for {@link vscode.TextEditorDecorationType TextEditorDecorationType}.
 * 
 * This class when instantiated will call {@link vscode.window.createTextEditorDecorationType createTextEditorDecorationType}.
 * 
 * On disposal (dispose()) of this wrapper, the textEditorDecType will also be disposed. 
 */
export class DecorationTypeWrapper {
    private decorationType;

    private decorationOptions: vscode.DecorationOptions[] = [];
    private activeOccurrences: vscode.Range[] = [];

    constructor(
        private documentName: string,
        private rule: Rule,
    ) {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: rule.backgroundColor ?? '',
            outline: rule.outline ?? '',
            outlineColor: rule.outlineColor ?? '',
            outlineWidth: rule.outlineWidth ?? '',

            border: rule.border ?? '',
            borderColor: rule.borderColor ?? '',
            borderWidth: rule.borderWidth ?? '',

            color: rule.color ?? '',

            fontStyle: rule.fontStyle ?? '',
            fontWeight: rule.fontWeight ?? '',

            textDecoration: rule.textDecoration ?? '',

            cursor: rule.cursor ?? '',
            isWholeLine: rule.isWholeLine ?? false,
            overviewRulerColor: rule.overviewRulerColor ?? '',
            overviewRulerLane: rule.overviewRulerLane
                ? Number(rule.overviewRulerLane)
                : vscode.OverviewRulerLane.Full,
        });
    }

    /**
     * If decoration has changed, we must dispose of this object properly and
     * create a new decoration type wrapper with its corresponding implementation.
     * @param current 
     * @returns 
     */
    hasDecorationChanged(current: Rule) {
        return this.rule.id !== current.id ||
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
            this.rule.overviewRulerColor !==
                current.overviewRulerColor ||
            this.rule.overviewRulerLane !==
                current.overviewRulerLane ||
            this.rule.textDecoration !== current.textDecoration
    }

    needsOnlyOccurrenceUpdate(current: Rule) {
        return (this.rule.regularExpression !== current.regularExpression ||
            this.rule.regularExpressionFlags !== current.regularExpressionFlags ||
            this.rule.includedFiles !== current.includedFiles || 
            this.rule.excludedFiles !== current.excludedFiles || 
            this.rule.title !== current.title) &&
            !this.hasDecorationChanged(current);
    }

    generateOccurrencesOnChange(contentChange: vscode.TextDocumentContentChangeEvent) {
        const intersectingRanges = this.binarySearchRange(this.activeOccurrences, contentChange.range, 0, this.activeOccurrences.length);
        if(intersectingRanges.length != 0) {
            const range = new vscode.Range(
                intersectingRanges[0].start,
                intersectingRanges[intersectingRanges.length - 1].end
            );
            console.log('handleContentRange:', range);
            console.log('contentChange: ', contentChange);

        } else {
            console.log('no content change needed');
        }
    }

    binarySearchRange(ranges: vscode.Range[], contentChangeRange: vscode.Range, start: number, endExcl: number): vscode.Range[] {
        if(endExcl - start <= 0) {
            return [];
        }

        const middle = Math.round(((endExcl - start) / 2)) + start;
        const midRange = ranges[middle];
        if(midRange == undefined) {
            console.error(`midRange is undefined: ${middle} not in [${start}, ${endExcl})`);
            return [];
        }
        let intersection;
        if((intersection = midRange.intersection(contentChangeRange))) {
            const intersections = [intersection];
            // go left and check all intersections
            for(let left = middle - 1; intersection; left--) {
                intersection = midRange.intersection(contentChangeRange);
                if(intersection) {
                    intersections.push(intersection);
                }
            }
            // go right and check all intersections
            for(let right = middle + 1; intersection; right++) {
                intersection = midRange.intersection(contentChangeRange);
                if(intersection) {
                    intersections.push(intersection);
                }
            }

            return intersections;
            //if mid range is before 
        } else if(midRange.start.isBeforeOrEqual(contentChangeRange.start)) {
            return this.binarySearchRange(ranges, contentChangeRange, start, middle);
        } else {
            return this.binarySearchRange(ranges, contentChangeRange, middle + 1, endExcl);
        }
    }

    getDisposeHandle() {
        return this.decorationType.dispose
    }

    applyDecorationsToEditor(activeEditor: vscode.TextEditor) {
        if(activeEditor.document.fileName !== this.documentName) {
            throw new Error(`CANNOT APPLY DECORATIONS TO DIFFERENT DOCUMENT - obs -> ${activeEditor.document.fileName} != expected ->${this.documentName}`)
        }
        activeEditor.setDecorations(this.decorationType, this.decorationOptions);
    }

    /**
     * Updates rule ref in decoration type, decorationOptions[], and activeOccurences[]
     * 
     * @param document
     * @param rule 
     */
    updateOccurrences(document: vscode.TextDocument, rule?: Rule) {
        if(rule) {
            this.rule = rule;
        } else {
            rule = this.rule;
        }
        
        const regEx = new RegExp(
            rule.regularExpression,
            rule.regularExpressionFlags || 'g',
        );
        const decorations: vscode.DecorationOptions[] = [];
        const ranges: vscode.Range[] = [];
        let match;
        let occurrence = 0;
        while (
            (match = regEx.exec(document.getText())) &&
            decorations.length < (rule.maxOccurrences ?? 1000)
        ) {
            occurrence++;
            const startPos = document.positionAt(
                match.index,
            );
            const endPos = document.positionAt(
                match.index + match[0].length,
            );
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
        activeEditor.setDecorations(this.decorationType, []);
    }

    clearOccurrenceData() {
        this.activeOccurrences = [];
        this.decorationOptions = [];
    }

    dispose() {
        this.decorationType.dispose();
    }
}