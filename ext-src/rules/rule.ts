import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { ThemableDecorationAttachmentRenderOptions } from 'vscode';

export interface IRule {
    id: string;
    enabled: boolean;
    expanded: boolean;
    decorationExpanded: boolean;
    beforeExpanded: boolean;
    afterExpanded: boolean;
    occurrencesExpanded: boolean;

    title: string;

    overviewRulerLane: vscode.OverviewRulerLane;
    overviewRulerColor: string;

    maxOccurrences: number;

    regularExpression: string;
    regularExpressionFlags: string;
    includedFiles: string;
    excludedFiles: string;

    backgroundColor: string;

    outline: string;
    outlineColor: string;
    outlineWidth: string;

    border: string;
    borderColor: string;
    borderWidth: string;

    fontStyle: string;
    fontWeight: string;

    textDecoration: string;

    cursor: string;

    color: string;

    isWholeLine: boolean;
    before: ThemableDecorationAttachmentRenderOptions;
    after: ThemableDecorationAttachmentRenderOptions;
}

export class Rule implements IRule {
    constructor(title: string) {
        this.id = uuidv4();
        this.title = title;
        this.enabled = false;
        this.expanded = false;
        this.decorationExpanded = false;
        this.beforeExpanded = false;
        this.afterExpanded = false;
        this.occurrencesExpanded = false;
        this.overviewRulerColor = '';
        this.overviewRulerLane = vscode.OverviewRulerLane.Full;
        this.maxOccurrences = 1000;
        this.regularExpression = '';
        this.regularExpressionFlags = 'g';
        this.includedFiles = '';
        this.excludedFiles = '';
        this.backgroundColor = '';
        this.outline = '';
        this.outlineColor = '';
        this.outlineWidth = '';
        this.border = '';
        this.borderColor = '';
        this.borderWidth = '';
        this.fontStyle = '';
        this.fontWeight = '400';
        this.textDecoration = '';
        this.cursor = '';
        this.color = '';
        this.isWholeLine = false;
        this.before = {};
        this.after = {};
    }
    enabled: boolean;
    expanded: boolean;
    decorationExpanded: boolean;
    occurrencesExpanded: boolean;
    beforeExpanded: boolean;
    afterExpanded: boolean;

    id: string;
    title: string;
    overviewRulerLane: vscode.OverviewRulerLane;
    overviewRulerColor: string;
    maxOccurrences: number;
    regularExpression: string;
    regularExpressionFlags: string;
    includedFiles: string;
    excludedFiles: string;
    backgroundColor: string;
    outline: string;
    outlineColor: string;
    outlineWidth: string;
    border: string;
    borderColor: string;
    borderWidth: string;
    fontStyle: string;
    fontWeight: string;
    textDecoration: string;
    cursor: string;
    color: string;
    isWholeLine: boolean;
    before: ThemableDecorationAttachmentRenderOptions;
    after: ThemableDecorationAttachmentRenderOptions;

    valueOf() {
        return this.id;
    }
}
