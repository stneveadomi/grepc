
export interface LineRange {
    ruleId: string;
    index: number;
    lines: string[];
    lineNumbers: number[];

    startIndex: number;
    endIndexExcl: number;
    
    selectionNumber: number;
}