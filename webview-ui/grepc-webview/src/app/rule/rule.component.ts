import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Rule } from '../../models/rule';
import { CommonModule, NgFor } from '@angular/common';
import { AppComponent } from '../app.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SliderCheckboxComponent } from '../slider-checkbox/slider-checkbox.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { RuleService } from '../../services/rule.service';
import { FormBuilder, FormControlStatus, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-rule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SliderCheckboxComponent, ColorPickerModule],
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
  ruleForm = this.fb.group({
    id: [''],
    enabled: [false],
    regularExpression: [new RegExp('')],
    includeFiles: [''],
    excludeFiles: [''],
    backgroundColor: [''],
    outline: [''],
    outlineColor: [''],
    outlineStyle: [''],
    outlineWidth: [''],
    border: [''],
    font: [''],
    textDecoration: [''],
    cursor: [''],
    color: [''],
    opacity: [''],
    gutterIcon: [''],
    isWholeLine: [false]
  });

  constructor(
    private ruleService: RuleService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.ruleForm.patchValue(this.rule);
    this.ruleForm.statusChanges.pipe(debounceTime(1000)).subscribe({
      next: (status: FormControlStatus) => {
        switch(status) {
          case 'VALID':
            console.log('Rule form value: ', this.ruleForm.value);
            //update everything except the ID
            let newRule = { ...this.rule, ...this.ruleForm.value};
            newRule.id = this.rule.id;
            this.rule = newRule;
            this.ruleService.pushRulesToExtension();
            return;
           
          case 'INVALID':
          case 'PENDING':
          case 'DISABLED':
            //explicit no op.
        }
      }
    });
  }

  deleteSelf() {
    console.log('Deleting rule', this.rule.id);
    this.ruleService.removeRule(this.rule.id!);
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
    if(this.ruleForm.controls.id.valid) {
      try {
        this.rule.id = this.ruleForm?.value?.id ?? '';
        this.ruleService.updateRule(this.rule.id, this.rule);
        this.ruleService.pushRulesToExtension();
      } catch (exception) {
        console.error('Unable to update rule.', exception);
      }
    }
  }
}
