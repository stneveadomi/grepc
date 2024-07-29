import * as vscode from 'vscode';

export interface IntersectingRangeData {
    removed: number;
    insertIndex: number;
    range?: vscode.Range;
}