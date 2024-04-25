import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Rule } from '../../models/rule';
import { CommonModule, NgFor } from '@angular/common';
import { AppComponent } from '../app.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SliderCheckboxComponent } from '../slider-checkbox/slider-checkbox.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { RuleService } from '../../services/rule.service';
import { FormBuilder, FormControlStatus, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { GlobalStylesService } from '../../services/global-styles.service';
import { Draggable } from '../../utilities/draggable';
import { DragService } from '../../services/drag.service';

@Component({
  selector: 'app-rule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SliderCheckboxComponent, ColorPickerModule],
  templateUrl: './rule.component.html',
  styleUrl: './rule.component.css'
})
export class RuleComponent extends Draggable implements OnDestroy, AfterViewInit, OnInit {

  @Input({required: true})
  rule!: Rule;

  gripperClass = '';
  showEditIcon = false;
  isEditing = false;
  ruleForm = this.fb.group({
    id: [''],
    enabled: [false],
    regularExpression: [''],
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

  @ViewChild('container')
  override containingElement!: ElementRef;

  constructor(
    private ruleService: RuleService,
    private globalStyles: GlobalStylesService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    drag: DragService
  ) {
    super(drag);
  }

  ngOnInit() {
    this.ruleForm.patchValue(this.rule);
    console.log('ngOnInit run.');
    this.ruleForm.statusChanges.pipe(debounceTime(1000)).subscribe({
      next: (status: FormControlStatus) => {
        switch(status) {
          case 'VALID':
            console.log('form updated! Pushing to extension');
            let newRule = {
              ...this.rule,
              ...this.ruleForm.value,
            };
            //TODO: check if this is necessary.
            // prevent rule reloading locally so focus is not lost on input form.
            if(newRule.id !== this.rule.id) {
              return;
            }
            newRule.id = this.rule.id;
            console.log('new rule: ', newRule);
            this.ruleService.updateRule(newRule);
            this.ruleService.pushRules();
            return;
           
          case 'INVALID':
          case 'PENDING':
          case 'DISABLED':
            //explicit no op.
        }
      }
    });
  }

  public ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  public ngOnDestroy(): void {
    super.onDestroy();
  }

  deleteSelf() {
    console.log('Deleting rule', this.rule.id);
    this.ruleService.removeRule(this.rule.id!);
    this.ruleService.pushRules();
  }

  /**
   * One shot callback for mouseup events. Used in correspondence with mouseDown()
   * Removes event listener.
   */
  mouseUp = () => {
    this.globalStyles.removeClass('grabbed');
    this.drag.disableDraggable();
    document.removeEventListener('mouseup', this.mouseUp);
  };

  /**
   * This handles the "gripper" effect of dragging between rows.
   */
  mouseDown() {
    this.globalStyles.addClass('grabbed');
    this.drag.enableDraggable(this);
    document.addEventListener('mouseup', this.mouseUp);
  }

  updateColorPicker(control: string, value: string) {
    this.ruleForm.get(control)?.setValue(value);
  }

  toggleExpand(event?: Event) {
    console.log(event);
    if(event === undefined || event.target === event.currentTarget) {
      this.rule.expanded = !this.rule.expanded;
    }
    this.ruleService.updateRule(this.rule);
    this.ruleService.pushRulesToExtension();
  }

  toggleDecorationExpanded(event: Event) {
    if(event.target === event.currentTarget) {
      this.rule.decorationExpanded = !this.rule.decorationExpanded;
    }
    this.ruleService.updateRule(this.rule);
    this.ruleService.pushRulesToExtension();
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  toggleShowEditIcon() {
    this.showEditIcon = !this.showEditIcon;
  }

  getExpandedStyle(isExpanded: boolean | null) {
    return isExpanded ? 'flex' : 'none';
  }

  updateTitle() {
    if(this.ruleForm.controls.id.valid) {
      try {
        console.log('Old rule id: ', this.rule.id);
        
        this.ruleService.updateTitle(this.rule.id!, this.ruleForm?.value?.id ?? '', this.rule);
        console.log('updateTitle() - updating rule id to ', this.ruleForm?.value?.id);
        
        console.log(JSON.stringify(this.ruleService.getRuleArray()));
        this.ruleService.pushRules();
      } catch (exception) {
        console.error('Unable to update rule.', exception);
      }
    }
  }
}
