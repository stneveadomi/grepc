import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
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
export class RuleComponent extends Draggable implements OnDestroy, AfterViewInit, OnInit {

  @Input({required: true})
  rule!: Rule;

  private mouseUpListener = null;

  gripperClass = '';
  occurences = 0;
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
    //todo: Check if this actually does anything...
    // this.ruleForm.patchValue(this.rule);
    this.ruleForm.statusChanges.pipe(debounceTime(1000)).subscribe({
      next: (status: FormControlStatus) => {
        switch(status) {
          case 'VALID':
            console.log('Rule form value: ', this.ruleForm.value);
            //update everything except the ID
            // LEFT OFF HERE, this may be the culprit on why ngClass isn't working.
            let newRule = { ...this.rule, ...this.ruleForm.value};
            newRule.id = this.rule.id;
            this.ruleService.updateRule(newRule);
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

  startMouseY: number | undefined = undefined;
  rowDiff: number | undefined = undefined;
  RULE_DIV_SIZE = 30;

  /**
   * One shot callback for mouseup events. Used in correspondence with mouseDown()
   * Removes event listener.
   */
  mouseUp = () => {
    this.globalStyles.removeClass('grabbed');
    this.drag.disableDraggable();
    // document.removeEventListener('mousemove', this.mouseMove);
    document.removeEventListener('mouseup', this.mouseUp);
  };

  // mouseMove = (event: MouseEvent) => {
  //   if(!this.startMouseY) {
  //     this.startMouseY = event.pageY;
  //     this.rowDiff = 0;
  //   }

  //   const diff = (event.pageY - this.startMouseY) / this.RULE_DIV_SIZE;
  //   if(Math.abs(this.rowDiff! - diff) >= 1) {
  //     this.rowDiff = Math.round(diff);
  //     console.log('setting row diff to', this.rowDiff);
  //   }
  //   //console.log('mouse move event', event);
  // };

  /**
   * This handles the "gripper" effect of dragging between rows.
   */
  mouseDown() {
    //todo: on mouse down, close all expanded rules for consistency.
    this.RULE_DIV_SIZE = document.getElementsByClassName('rule-header')[0]?.clientHeight ?? this.RULE_DIV_SIZE;
    this.globalStyles.addClass('grabbed');
    this.drag.enableDraggable(this);
    // document.addEventListener('mousemove', this.mouseMove);
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
