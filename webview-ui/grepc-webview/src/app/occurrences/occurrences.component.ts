import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
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
export class OccurrencesComponent implements OnChanges {
  @Input({required: true})
  lineRanges!: LineRange[];

  @Input({required: true})
  rule!: Rule;

  @Output()
  ruleChange = new EventEmitter<Rule>();

  // index by 1, eww.
  occurrenceIndex = !this.rule?.occurrences || this.rule.occurrences === 0 ? 0 : 1;
  
  constructor(
    private ruleService: RuleService,
  ) {
  }

  lineRange: LineRange | undefined = this.lineRanges?.[this.occurrenceIndex];

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['lineRanges'];
    if(change) {
      console.log('Updating occurrences component as lineRanges changed.');
      console.log(change);
      if(!this.rule?.occurrences || this.rule.occurrences === 0) {
        this.occurrenceIndex = 0;
        this.lineRange = undefined;
      } else if(this.rule?.occurrences > this.occurrenceIndex) {
        this.occurrenceIndex = this.rule.occurrences;
      }

      if(this.occurrenceIndex !== 0) {
        this.lineRange = this.lineRanges?.[this.occurrenceIndex - 1];
        console.log('Occurrences::ngOnChanges: new line range is: ', JSON.stringify(this.lineRange));
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

  jumpToLine() {
    if(!this.lineRange) {
      console.warn('No line range available to jump to.');
      return;
    }

    this.ruleService.jumpToLine(this.lineRange);
  }

  decrement() {
    console.log('decrement called');
    if(!this.rule?.occurrences || this.rule.occurrences === 0) {
      console.warn('decrement() -> NO OP as occurrences is undefined or 0');
      return;
    }
    console.log('decrement(): updating index and line range.');
    this.occurrenceIndex--;
    if(this.occurrenceIndex <= 0) {
      this.occurrenceIndex = this.rule.occurrences ?? 1;
    }
    this.lineRange = this.lineRanges?.[this.occurrenceIndex - 1];
    console.log('new line range: ', JSON.stringify(this.lineRange));
  }

  increment() {
    if(!this.rule?.occurrences || this.rule.occurrences === 0) {
      return;
    }
    this.occurrenceIndex++;
    if(this.occurrenceIndex > this.rule?.occurrences) {
      this.occurrenceIndex = 1;
    }
    this.lineRange = this.lineRanges?.[this.occurrenceIndex - 1];
  }

  processWheel(event: WheelEvent) {
    console.log('wheel event', event);
  }

}
