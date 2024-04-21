export interface Rule {
    enabled: boolean | null;
    expanded: boolean | null;
    decorationExpanded: boolean | null;
    id: string | null;
    
    regularExpression: string | null;
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
        this.enabled = false;
        this.expanded = false;
        this.decorationExpanded = false;
        this.regularExpression = '';
        this.includeFiles = '';
        this.excludeFiles = '';
        this.backgroundColor = '';
        this.outline = '';
        this.outlineColor = '';
        this.outlineStyle = '';
        this.outlineWidth = '';
        this.border = '';
        this.font = '';
        this.textDecoration = '';
        this.cursor = '';
        this.color = '';
        this.opacity = '';
        this.gutterIcon = '';
        this.isWholeLine = false;
    }
}