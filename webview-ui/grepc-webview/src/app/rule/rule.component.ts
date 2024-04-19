import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Rule } from '../../models/rule';
import { CommonModule, NgFor } from '@angular/common';
import { AppComponent } from '../app.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SliderCheckboxComponent } from '../slider-checkbox/slider-checkbox.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { RuleService } from '../../services/rule.service';

@Component({
  selector: 'app-rule',
  standalone: true,
  imports: [CommonModule, SliderCheckboxComponent, ColorPickerModule],
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

  showEditIcon = false;

  isEditing = false;

  constructor(
    private ruleService: RuleService
  ) { }

  deleteSelf() {
    console.log('Deleting rule', this.rule.id);
    this.ruleService.removeRule(this.rule.id);
  }

  toggleExpand(event?: Event) {
    if(event === undefined || event.target === event.currentTarget) {
      this.rule.expanded = !this.rule.expanded;
    }

  }

  toggleDecorationExpanded(event: Event) {
    if(event.target === event.currentTarget) {
      this.rule.decorationExpanded = !this.rule.decorationExpanded;
    }
    
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  toggleShowEditIcon() {
    this.showEditIcon = !this.showEditIcon;
  }

  updateTitle() {
    /* TO DO: UPDATE PROPER RULE ID */

  }
}
