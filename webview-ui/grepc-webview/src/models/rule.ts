import { v4 as uuidv4 } from 'uuid';
import { LineRange } from './line-range';

export interface IRule {
    enabled: boolean | null;
    expanded: boolean | null;
    decorationExpanded: boolean | null;
    occurrencesExpanded: boolean | null;
    id: string;
    title: string | null;

    overviewRulerLane: OverviewRulerLane | null;
    overviewRulerColor: string | null;

    maxOccurrences: number | null;

    regularExpression: string | null;
    regularExpressionFlags: string | null;
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

export class OccurrenceData {
    occurrences: number | null;
    lineRanges: LineRange[] | null;

    constructor(
        occurrences: number | null = 0,
        lineRanges: LineRange[] | null = [],
    ) {
        this.occurrences = occurrences;
        this.lineRanges = lineRanges;
    }
}

export enum OverviewRulerLane {
    /**
     * The left lane of the overview ruler.
     */
    Left = 1,
    /**
     * The center lane of the overview ruler.
     */
    Center = 2,
    /**
     * The right lane of the overview ruler.
     */
    Right = 4,
    /**
     * All lanes of the overview ruler.
     */
    Full = 7,
}

export class Rule implements IRule {
    constructor(title: string) {
        this.id = uuidv4();
        this.title = title;
        this.enabled = false;
        this.expanded = false;
        this.decorationExpanded = false;
        this.occurrencesExpanded = false;
        this.overviewRulerColor = '';
        this.overviewRulerLane = OverviewRulerLane.Full;
        this.maxOccurrences = 1000;
        this.regularExpression = '';
        this.regularExpressionFlags = 'g';
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

    enabled: boolean | null;
    expanded: boolean | null;
    decorationExpanded: boolean | null;
    occurrencesExpanded: boolean | null;
    id: string;
    title: string | null;
    overviewRulerLane: OverviewRulerLane | null;
    overviewRulerColor: string | null;
    maxOccurrences: number | null;
    regularExpression: string | null;
    regularExpressionFlags: string | null;
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

    // TODO: If this is a performance bottleneck, improve.
    static equals(a: Rule, b: Rule): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }
}
