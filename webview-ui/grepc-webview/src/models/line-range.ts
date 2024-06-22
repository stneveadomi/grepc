
export interface LineRange {
    ruleId: string;
    index: number;
    lines: string[] | undefined;
    lineNumbers: number[];

    startIndex: number;
    endIndexExcl: number;
    
    selectionNumber: number;
}