import { v4 as uuidv4 } from 'uuid';
import { LineRange } from './line-range';

export interface IRule {
    id: string;
    enabled: boolean;
    expanded: boolean;
    decorationExpanded: boolean;
    beforeExpanded: boolean;
    afterExpanded: boolean;
    occurrencesExpanded: boolean;

    title?: string;

    overviewRulerLane?: OverviewRulerLane;
    overviewRulerColor?: string;

    maxOccurrences?: number;

    regularExpression?: string;
    regularExpressionFlags?: string;
    includedFiles?: string;
    excludedFiles?: string;

    backgroundColor?: string;

    outline?: string;
    outlineColor?: string;
    outlineWidth?: string;

    border?: string;
    borderColor?: string;
    borderWidth?: string;

    fontStyle?: string;
    fontWeight?: string;

    textDecoration?: string;

    cursor?: string;

    color?: string;

    isWholeLine?: boolean;
    before?: ChildDecorationModel;
    after?: ChildDecorationModel;
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
        this.beforeExpanded = false;
        this.afterExpanded = false;
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
        this.before = {};
        this.after = {};
    }

    enabled: boolean;
    expanded: boolean;
    decorationExpanded: boolean;
    beforeExpanded: boolean;
    afterExpanded: boolean;
    occurrencesExpanded: boolean;

    id: string;

    title?: string;
    overviewRulerLane?: OverviewRulerLane;
    overviewRulerColor?: string;

    maxOccurrences?: number;
    regularExpression?: string;
    regularExpressionFlags?: string;
    includedFiles?: string;
    excludedFiles?: string;
    backgroundColor?: string;
    outline?: string;
    outlineColor?: string;
    outlineWidth?: string;
    border?: string;
    borderColor?: string;
    borderWidth?: string;
    fontStyle?: string;
    fontWeight?: string;
    textDecoration?: string;
    cursor?: string;
    color?: string;
    isWholeLine?: boolean;
    before: ChildDecorationModel;
    after: ChildDecorationModel;

    // TODO: If this is a performance bottleneck, improve.
    static equals(a: Rule, b: Rule): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }
}

export function overwrite(rule: Rule, partialRule: Partial<Rule>): Rule {
    const updatedRule = new Rule(partialRule.title || '');

    // Copy properties from the partialRule to the new instance
    for (const key of Object.keys(rule)) {
        // @ts-expect-error: TypeScript may need this ignore to properly handle dynamic keys
        if (Object.hasOwn(partialRule, key) && partialRule[key] !== undefined) {
            // @ts-expect-error: TypeScript may need this ignore to properly handle dynamic keys
            updatedRule[key] = partialRule[key];
        } else {
            // @ts-expect-error: TypeScript may need this ignore to properly handle dynamic keys
            updatedRule[key] = rule[key];
        }
    }

    return updatedRule;
}

export interface ChildDecorationModel {
    /**
     * Defines a text content that is shown in the attachment. Either an icon or a text can be shown, but not both.
     */
    contentText?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    border?: string;
    /**
     * CSS styling property that will be applied to text enclosed by a decoration.
     */
    borderColor?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    fontStyle?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    fontWeight?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    textDecoration?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    color?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    backgroundColor?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    margin?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    width?: string;
    /**
     * CSS styling property that will be applied to the decoration attachment.
     */
    height?: string;
}
