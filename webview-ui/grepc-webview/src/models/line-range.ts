
export interface LineRange {
    ruleId: string;
    index: number;
    line: string | undefined;
    lineNumber: number;

    startIndex: number;
    endIndexExcl: number;
    
    selectionNumber: number;
}