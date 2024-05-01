import * as vscode from 'vscode';

// export class Rule implements Rule {
//     constructor(id: string) {
//         this.id = id;
//     }
// }

export interface Rule {
    enabled: boolean;
    expanded: boolean;
    decorationExpanded: boolean;
    //uuid
    id: string;
    // custom name for rule.
    title: string;

    occurrences: number | null;
    
    regularExpression: string;
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