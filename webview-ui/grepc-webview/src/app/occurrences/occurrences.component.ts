import { Component, DoCheck, EventEmitter, Input, Output } from '@angular/core';
import { RuleService } from '../../services/rule.service';
import { OccurrenceData, Rule } from '../../models/rule';
import { CommonModule } from '@angular/common';
import { LineRange } from '../../models/line-range';
import { OccurrenceDisplayComponent } from '../occurrence-display/occurrence-display.component';

@Component({
    selector: 'app-occurrences',
    imports: [CommonModule, OccurrenceDisplayComponent],
    templateUrl: './occurrences.component.html',
    styleUrl: './occurrences.component.css',
})
export class OccurrencesComponent implements DoCheck {
    @Input({ required: true })
    rule!: Rule;

    @Input({ required: true })
    occurrenceData!: OccurrenceData;

    @Output()
    ruleChange = new EventEmitter<Rule>();

    private _oldLineRanges: LineRange[] | null = null;
    private _oldOccurrences: number | null = null;

    // index by 1, eww.
    occurrenceIndex =
        !this.occurrenceData?.occurrences ||
        this.occurrenceData.occurrences === 0
            ? 0
            : 1;

    isListOpen = false;

    constructor(private ruleService: RuleService) {}

    selectedLineRange: LineRange | undefined =
        this.occurrenceData?.lineRanges?.[this.occurrenceIndex];

    ngDoCheck(): void {
        if (
            this.occurrenceData.occurrences !== this._oldOccurrences ||
            JSON.stringify(this.occurrenceData.lineRanges) !==
                JSON.stringify(this._oldLineRanges)
        ) {
            this._oldOccurrences = this.occurrenceData.occurrences;
            this._oldLineRanges = this.occurrenceData.lineRanges;
            if (
                !this.occurrenceData?.occurrences ||
                this.occurrenceData.occurrences === 0
            ) {
                this.occurrenceIndex = 0;
                this.selectedLineRange = undefined;
                return;
            } else if (
                this.occurrenceData?.occurrences < this.occurrenceIndex
            ) {
                this.occurrenceIndex = this.occurrenceData.occurrences;
                this.selectedLineRange =
                    this.occurrenceData?.lineRanges?.[this.occurrenceIndex];
                return;
            }

            // If occurrences is updated and occurrence index is 0, update to 1.
            if (
                this.occurrenceIndex === 0 &&
                this.occurrenceData?.occurrences > 0
            ) {
                this.occurrenceIndex = 1;
            }

            if (this.occurrenceIndex !== 0) {
                this.selectedLineRange =
                    this.occurrenceData?.lineRanges?.[this.occurrenceIndex - 1];
            }
        }
    }

    getExpandedStyle(isExpanded: boolean | null) {
        return isExpanded ? 'flex' : 'none';
    }

    toggleExpand(event: Event) {
        if (event.target !== event.currentTarget) {
            return;
        }
        this.rule.occurrencesExpanded = !this.rule.occurrencesExpanded;
        this.ruleService.updateRule(this.rule);
        this.ruleService.pushRulesToExtension();
    }

    toggleListExpand(event: Event) {
        if (event.target !== event.currentTarget) {
            return;
        }
        this.isListOpen = !this.isListOpen;
    }

    jumpToLine() {
        if (!this.selectedLineRange) {
            return;
        }

        this.ruleService.jumpToLine(this.selectedLineRange);
    }

    decrement() {
        if (
            !this.occurrenceData?.occurrences ||
            this.occurrenceData.occurrences === 0
        ) {
            return;
        }

        this.occurrenceIndex--;
        if (this.occurrenceIndex <= 0) {
            this.occurrenceIndex = this.occurrenceData.occurrences ?? 1;
        }
        this.selectedLineRange =
            this.occurrenceData?.lineRanges?.[this.occurrenceIndex - 1];
    }

    increment() {
        if (
            !this.occurrenceData?.occurrences ||
            this.occurrenceData.occurrences === 0
        ) {
            return;
        }

        this.occurrenceIndex++;
        if (this.occurrenceIndex > this.occurrenceData?.occurrences) {
            this.occurrenceIndex = 1;
        }
        this.selectedLineRange =
            this.occurrenceData?.lineRanges?.[this.occurrenceIndex - 1];
    }

    processWheel(event: WheelEvent) {
        if (event.deltaY > 0) {
            this.decrement();
        } else {
            this.increment();
        }
    }

    select(lineRange: LineRange) {
        this.selectedLineRange = lineRange;
        this.occurrenceIndex = lineRange.index + 1;
        this.jumpToLine();
    }
}
