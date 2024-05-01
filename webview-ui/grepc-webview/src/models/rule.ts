import { v4 as uuidv4 } from 'uuid';

export interface Rule {
    enabled: boolean | null;
    expanded: boolean | null;
    decorationExpanded: boolean | null;
    id: string;
    title: string | null;
    
    occurrences: number | null;
    
    regularExpression: string | null;
    includedFiles: string | null;
    excludedFiles: string | null;
    
    backgroundColor: string | null;

    outline: string | null;
    outlineColor: string | null;
    outlineWidth: string | null;

    border: string | null;
    borderColor: string | null;
    borderWidth: string | null;

    fontStyle: string | null;
    fontWeight: string | null;

    textDecoration: string | null;

    cursor: string | null;
    
    color: string | null;
    
    isWholeLine: boolean | null;
}

export class Rule implements Rule {

    constructor(title: string) {
        this.id = uuidv4();
        this.title = title;
        this.enabled = false;
        this.expanded = false;
        this.decorationExpanded = false;
        this.occurrences = 0;
        this.regularExpression = '';
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
}