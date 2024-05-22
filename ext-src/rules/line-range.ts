
export interface LineRange {
    ruleId: string;
    index: number;
    line: string;
    lineNumber: number;

    startIndex: number;
    endIndexExcl: number;
    
    selectionNumber: number;
}