import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { OverviewRulerLane, Rule } from '../../models/rule';
import { CommonModule } from '@angular/common';
import { SliderCheckboxComponent } from '../slider-checkbox/slider-checkbox.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { RuleService } from '../../services/rule.service';
import { FormBuilder, FormControlStatus, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { GlobalStylesService } from '../../services/global-styles.service';
import { Draggable } from '../../utilities/draggable';
import { DragService } from '../../services/drag.service';
import { DecorationPreviewComponent } from '../decoration-preview/decoration-preview.component';
import { OccurrencesComponent } from '../occurrences/occurrences.component';
import { LineRange } from '../../models/line-range';
import { ExtensionService, LogLevel } from '../../services/extension.service';
import { CSSValidator, RegularExpressionValidator } from '../../utilities/form-validators';

@Component({
  selector: 'app-rule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SliderCheckboxComponent, ColorPickerModule, DecorationPreviewComponent, OccurrencesComponent],
  templateUrl: './rule.component.html',
  styleUrl: './rule.component.css'
})
export class RuleComponent extends Draggable implements OnDestroy, OnChanges, AfterViewInit, OnInit {

  @Input({required: true})
  rule!: Rule;

  gripperClass = '';
  showEditIcon = false;
  isEditing = false;
  isEditingTitle = false;
  
  ruleForm = this.fb.group({
    title: ['',
      [ Validators.minLength(1), Validators.maxLength(50), Validators.required ]
    ],
    enabled: [false],
    overviewRulerColor: [''],
    overviewRulerLane: [OverviewRulerLane.Full],
    regularExpression: ['',
      [ RegularExpressionValidator() ]
    ],
    regularExpressionFlags: ['g',
      [ Validators.minLength(1), Validators.maxLength(5), Validators.pattern(/^[dgimsuvy]*$/i)]
    ],
    maxOccurrences: [1000],
    includedFiles: ['',
      [ RegularExpressionValidator() ]
    ],
    excludedFiles: ['',
      [ RegularExpressionValidator() ]
    ],
    backgroundColor: ['',
      [ CSSValidator.classValidator('background-color')]
    ],
    outline: ['',
      [ CSSValidator.classValidator('outline')]
    ],
    outlineColor: ['',
      [ CSSValidator.classValidator('outline-color') ]
    ],
    outlineWidth: ['',
      [ CSSValidator.classValidator('outline-width') ]
    ],
    border: ['',
      [ CSSValidator.classValidator('border') ]
    ],
    borderColor: ['',
      [ CSSValidator.classValidator('border-color') ]
    ],
    borderWidth: ['',
      [ CSSValidator.classValidator('border-width') ]
    ],
    fontStyle: ['',
      [ CSSValidator.classValidator('font-style') ]
    ],
    fontWeight: ['',
      [ CSSValidator.classValidator('font-weight') ]
    ],
    textDecoration: ['',
      [ CSSValidator.classValidator('text-decoration') ]
    ],
    cursor: ['',
      [ CSSValidator.classValidator('cursor') ]
    ],
    color: ['',
      [ CSSValidator.classValidator('color') ]
    ],
    isWholeLine: [false]
  });

  @ViewChild('container')
  override containingElement!: ElementRef;

  private STATUS_CHANGE_OBSERVER = {
  next: (status: FormControlStatus) => {
      switch(status) {
        case 'VALID':
          if(this.isEditing || this.isEditingTitle) {
            return;
          }
          
          let newRule = {
            ...this.rule,
            ...this.ruleForm.value,
          };

          if(Rule.equals(this.rule, newRule)) {
            return;
          }

          // override title as only this::updateTitle should update title.
          newRule.title = this.rule.title;
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
    private extensionService: ExtensionService,
    private globalStyles: GlobalStylesService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    drag: DragService
  ) {
    super(drag);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['rule'];
    if(change) {
      this.ruleForm.patchValue(change.currentValue);
    }

    if(!this.ruleForm?.controls?.title?.valid || !this.rule?.title) {
      this.isEditingTitle = true;
    }
  }

  ngOnInit() {
    this.ruleForm.patchValue(this.rule);
    this.ruleForm.statusChanges.pipe(debounceTime(300)).subscribe(this.STATUS_CHANGE_OBSERVER);
    this.ruleService.register(this.rule.id, this);
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    super.onDestroy();
    this.ruleService.deregister(this.rule.id);
  }

  deleteSelf() {
    this.extensionService.log(LogLevel.DEBUG, `Deleting rule ${this.rule.id}`);
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
    this.ruleService.updateRule(this.rule);
    this.ruleService.pushRules();
  }

  onFormFocus() {
    this.isEditing = true;
  }

  onFormBlur() {
    this.isEditing = false;
    this.STATUS_CHANGE_OBSERVER.next(this.ruleForm.status);
  }

  toggleExpand(event: Event) {
    if(event.target !== event.currentTarget) {
      return;
    }
    this.rule.expanded = !this.rule.expanded;
    this.ruleService.updateRule(this.rule);
    this.ruleService.pushRulesToExtension();
  }

  toggleDecorationExpanded(event: Event) {
    if(event.target !== event.currentTarget) {
      return;
    }
    this.rule.decorationExpanded = !this.rule.decorationExpanded;
    this.ruleService.updateRule(this.rule);
    this.ruleService.pushRulesToExtension();
  }

  toggleEditTitle() {
    if(!this.ruleForm.controls.title.valid) {
      return;
    }

    this.isEditingTitle = !this.isEditingTitle;
    // if no longer editing title, reset form value for title.
    if(!this.isEditingTitle) {
      this.ruleForm.controls.title.setValue(this.rule.title);
    }
  }

  getExpandedStyle(isExpanded: boolean | null) {
    return isExpanded ? 'flex' : 'none';
  }

  updateTitle(override = false) {
    if(this.ruleForm.controls.title.valid || override) {
      try {
        this.extensionService.log(LogLevel.DEBUG, `updateTitle() - updating rule title from ${this.rule.title} to ${this.ruleForm?.value?.title}`);
        this.rule.title = this.ruleForm?.value?.title?.toUpperCase() ?? '';
        this.ruleService.updateRule(this.rule);
        this.ruleService.pushRules();
      } catch (exception) {
        this.extensionService.log(LogLevel.ERROR, `Unable to update rule: ${exception}`);
      }
    }
  }
}
