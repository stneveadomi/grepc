import { Component, DoCheck, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { RuleService } from '../../services/rule.service';
import { Rule } from '../../models/rule';
import { CommonModule } from '@angular/common';
import { LineRange } from '../../models/line-range';

@Component({
  selector: 'app-occurrences',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './occurrences.component.html',
  styleUrl: './occurrences.component.css'
})
export class OccurrencesComponent implements DoCheck {
  @Input({required: true})
  rule!: Rule;

  @Output()
  ruleChange = new EventEmitter<Rule>();

  private _oldLineRanges: LineRange[] | null = null;
  private _oldOccurrences: number | null = null;

  // index by 1, eww.
  occurrenceIndex = !this.rule?.occurrences || this.rule.occurrences === 0 ? 0 : 1;

  isListOpen = false;
  
  constructor(
    private ruleService: RuleService,
  ) {
  }

  lineRange: LineRange | undefined = this.rule?.lineRanges?.[this.occurrenceIndex];

  ngDoCheck(): void {
    if(this.rule.occurrences !== this._oldOccurrences
      || JSON.stringify(this.rule.lineRanges) !== JSON.stringify(this._oldLineRanges)
    ) {
      this._oldOccurrences = this.rule.occurrences;
      this._oldLineRanges = this.rule.lineRanges;
      if(!this.rule?.occurrences || this.rule.occurrences === 0) {
        this.occurrenceIndex = 0;
        this.lineRange = undefined;
        return;
      } else if(this.rule?.occurrences < this.occurrenceIndex) {
        this.occurrenceIndex = this.rule.occurrences;
        this.lineRange = this.rule?.lineRanges?.[this.occurrenceIndex];
        return;
      }

      // If occurrences is updated and occurrence index is 0, update to 1.
      if(this.occurrenceIndex === 0 && this.rule?.occurrences > 0) {
        this.occurrenceIndex = 1;
      }

      if(this.occurrenceIndex !== 0) {
        this.lineRange = this.rule?.lineRanges?.[this.occurrenceIndex - 1];
      }
    }
  }

  getExpandedStyle(isExpanded: boolean | null) {
    return isExpanded ? 'flex' : 'none';
  }

  toggleExpand(event: Event) {
    if(event.target !== event.currentTarget) {
      return;
    }
    this.rule.occurrencesExpanded = !this.rule.occurrencesExpanded;
    this.ruleService.updateRule(this.rule);
    this.ruleService.pushRulesToExtension();
  }

  toggleListExpand(event: Event) {
    if(event.target !== event.currentTarget) {
      return;
    }
    this.isListOpen = !this.isListOpen;
  }

  jumpToLine() {
    if(!this.lineRange) {
      return;
    }

    this.ruleService.jumpToLine(this.lineRange);
  }

  decrement() {
    if(!this.rule?.occurrences || this.rule.occurrences === 0) {
      return;
    }

    this.occurrenceIndex--;
    if(this.occurrenceIndex <= 0) {
      this.occurrenceIndex = this.rule.occurrences ?? 1;
    }
    this.lineRange = this.rule?.lineRanges?.[this.occurrenceIndex - 1];
  }

  increment() {
    if(!this.rule?.occurrences || this.rule.occurrences === 0) {
      return;
    }
    
    this.occurrenceIndex++;
    if(this.occurrenceIndex > this.rule?.occurrences) {
      this.occurrenceIndex = 1;
    }
    this.lineRange = this.rule?.lineRanges?.[this.occurrenceIndex - 1];
  }

  processWheel(event: WheelEvent) {
    if(event.deltaY > 0) {
      this.decrement();
    } else {
      this.increment();
    }
  }
}
