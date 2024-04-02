import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Rule } from '../../models/rule';
import { CommonModule, NgFor } from '@angular/common';
import { AppComponent } from '../app.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SliderCheckboxComponent } from '../slider-checkbox/slider-checkbox.component';

@Component({
  selector: 'app-rule',
  standalone: true,
  imports: [CommonModule, SliderCheckboxComponent],
  animations: [
    trigger('expand', [
      state('open', style({
        display: 'flex'
      })),
      state('closed', style({
        display: 'none'
      })),
    ])
  ],
  templateUrl: './rule.component.html',
  styleUrl: './rule.component.css'
})
export class RuleComponent {
  @Input({required: true})
  rule!: Rule;

  @Output()
  ruleChange = new EventEmitter<Rule>();

  occurences = 0;

  constructor() { }

  deleteSelf() {
    console.log('Deleting rule', this.rule.id);
  }

  toggleExpand(event: Event) {
    console.log('target:', JSON.stringify(event.target));
    if(event.target === event.currentTarget) {
      this.rule.expanded = !this.rule.expanded;
    }

  }

  toggleDecorationExpanded(event: Event) {
    if(event.target === event.currentTarget) {
      console.log(event.target);
      this.rule.decorationExpanded = !this.rule.decorationExpanded;
    }
    
  }

}
