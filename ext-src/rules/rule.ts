import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

// export class Rule implements Rule {
//     constructor(id: string) {
//         this.id = id;
//     }
// }

export interface IRule {
    enabled: boolean;
    expanded: boolean;
    decorationExpanded: boolean;
    //uuid
    id: string;
    // custom name for rule.
    title: string;
    
    overviewRulerLane: vscode.OverviewRulerLane;
    overviewRulerColor: string;

    maxOccurrences: number | null;
    
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
}

export class Rule implements IRule {

    constructor(title: string) {
        this.id = uuidv4();
        this.title = title;
        this.enabled = false;
        this.expanded = false;
        this.decorationExpanded = false;
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
    }
    enabled: boolean;
    expanded: boolean;
    decorationExpanded: boolean;
    id: string;
    title: string;
    overviewRulerLane: vscode.OverviewRulerLane;
    overviewRulerColor: string;
    maxOccurrences: number | null;
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

    valueOf() {
        return this.id;
    }
}