import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Rule } from '../../models/rule';
import { CommonModule, NgFor } from '@angular/common';
import { AppComponent } from '../app.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SliderCheckboxComponent } from '../slider-checkbox/slider-checkbox.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { RuleService } from '../../services/rule.service';
import { FormBuilder, FormControlStatus, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  isEditingTitle = false;
  ruleForm = this.fb.group({
    title: ['',
      [ Validators.min(1), Validators.required ]
    ],
    enabled: [false],
    regularExpression: [''],
    includedFiles: [''],
    excludedFiles: [''],
    backgroundColor: [''],
    outline: [''],
    outlineColor: [''],
    outlineWidth: [''],
    border: [''],
    borderColor: [''],
    borderWidth: [''],
    fontStyle: [''],
    fontWeight: [''],
    textDecoration: [''],
    cursor: [''],
    color: [''],
    isWholeLine: [false]
  });

  @ViewChild('container')
  override containingElement!: ElementRef;

  private STATUS_CHANGE_OBSERVER = {
    next: (status: FormControlStatus) => {
      switch(status) {
        case 'VALID':
          console.log('form updated! Pushing to extension');
          if(this.isEditing) {
            console.log(this.isEditing);
            console.log('form is being edited. Waiting to update');
            return;
          }
          let newRule = {
            ...this.rule,
            ...this.ruleForm.value,
          };

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
  };

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
    
    console.log('ngOnInit run.');
    this.ruleForm.controls.title.statusChanges.subscribe({
      next: (status: FormControlStatus) => {
        switch(status) {
          case 'INVALID':
          case 'PENDING':
          case 'DISABLED':
            // while not valid, editing title will be true.
            this.isEditingTitle = true;
            console.log('invalid status' + status);
            return;
          case 'VALID':
        }
      }
    });
    this.ruleForm.patchValue(this.rule);
    this.ruleForm.statusChanges.pipe(debounceTime(1000)).subscribe(this.STATUS_CHANGE_OBSERVER);
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
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

  onFormFocus() {
    console.log('formFocused: is editing = true');
    this.isEditing = true;
  }

  onFormBlur() {
    console.log('formBlur: is editing = false');
    this.isEditing = false;
    this.STATUS_CHANGE_OBSERVER.next(this.ruleForm.status);
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

  toggleEditTitle() {
    this.isEditingTitle = !this.isEditingTitle;
  }

  toggleShowEditIcon() {
    this.showEditIcon = !this.showEditIcon;
  }

  getExpandedStyle(isExpanded: boolean | null) {
    return isExpanded ? 'flex' : 'none';
  }

  updateTitle() {
    if(this.ruleForm.controls.title.valid) {
      try {
        console.log('Old rule title: ', this.rule.title);
        
        this.rule.title = this.ruleForm?.value?.title ?? '';
        //this.ruleService.updateTitle(this.rule.title!, this.ruleForm?.value?.title ?? '', this.rule);
        console.log('updateTitle() - updating rule title to ', this.ruleForm?.value?.title);
        
        console.log(JSON.stringify(this.ruleService.getRuleArray()));
        this.ruleService.pushRules();
      } catch (exception) {
        console.error('Unable to update rule.', exception);
      }
    }
  }
}
