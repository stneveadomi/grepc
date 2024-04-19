export interface Rule {
    enabled: boolean | null;
    expanded: boolean | null;
    decorationExpanded: boolean | null;
    id: string | null;
    
    regularExpression: RegExp | null;
    includeFiles: string | null;
    excludeFiles: string | null;
    backgroundColor: string | null;
    outline: string | null;
    outlineColor: string | null;
    outlineStyle: string | null;
    outlineWidth: string | null;
    border: string | null;
    font: string | null;
    textDecoration: string | null;
    cursor: string | null;
    color: string | null;
    opacity: string | null;
    gutterIcon: string | null;
    isWholeLine: boolean | null;
}

export class Rule implements Rule {

    constructor(id: string) {
        this.id = id;
    }
}