export interface Rule {
    enabled: boolean;
    expanded: boolean;
    decorationExpanded: boolean;
    id: string;
    
    regularExpression: RegExp;
    backgroundColor: string;
    outline: string;
    outlineColor: string;
    outlineStyle: string;
    outlineWidth: string;
    border: string;
    font: string;
    textDecoration: string;
    cursor: string;
    color: string;
    opacity: string;
    gutterIcon: string;
    isWholeLine: boolean;
}

export class Rule implements Rule {

    constructor(id: string) {
        this.id = id;
    }
}