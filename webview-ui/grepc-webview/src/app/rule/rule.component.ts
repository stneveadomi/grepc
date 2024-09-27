import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import {
    ChildDecorationModel,
    OccurrenceData,
    OverviewRulerLane,
    overwrite,
    Rule,
} from '../../models/rule';
import { CommonModule } from '@angular/common';
import { SliderCheckboxComponent } from '../slider-checkbox/slider-checkbox.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { RuleService } from '../../services/rule.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Draggable } from '../../utilities/draggable';
import { DragService } from '../../services/drag.service';
import { DecorationPreviewComponent } from '../decoration-preview/decoration-preview.component';
import { OccurrencesComponent } from '../occurrences/occurrences.component';
import {
    CSSValidator,
    RegularExpressionValidator,
} from '../../utilities/form-validators';
import { LoggerService } from '../../services/logger.service';
import {
    ChildDecorationComponent,
    ChildDecorationType,
} from './child-decoration/child-decoration.component';
import { ExtensionService } from '../../services/extension.service';

@Component({
    selector: 'app-rule',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SliderCheckboxComponent,
        ColorPickerModule,
        DecorationPreviewComponent,
        OccurrencesComponent,
        ChildDecorationComponent,
    ],
    templateUrl: './rule.component.html',
    styleUrl: './rule.component.css',
})
export class RuleComponent
    extends Draggable
    implements OnDestroy, OnChanges, AfterViewInit, OnInit
{
    @Input({ required: true })
    rule!: Rule;

    occurrenceData: OccurrenceData = new OccurrenceData();

    gripperClass = '';
    showEditIcon = false;

    isEditingTitle = false;
    override dragData: string | undefined = undefined;

    ruleForm = this.fb.nonNullable.group({
        title: [
            '',
            [
                Validators.minLength(1),
                Validators.maxLength(50),
                Validators.required,
            ],
        ],
        enabled: [false],
        overviewRulerColor: [''],
        overviewRulerLane: [OverviewRulerLane.Full],
        regularExpression: ['', [RegularExpressionValidator()]],
        regularExpressionFlags: [
            'g',
            [
                Validators.minLength(1),
                Validators.maxLength(5),
                Validators.pattern(/^[dgimsuvy]*$/i),
            ],
        ],
        maxOccurrences: [1000],
        includedFiles: ['', [RegularExpressionValidator()]],
        excludedFiles: ['', [RegularExpressionValidator()]],
        backgroundColor: [
            '',
            [CSSValidator.classValidator('background-color')],
        ],
        outline: ['', [CSSValidator.classValidator('outline')]],
        outlineColor: ['', [CSSValidator.classValidator('outline-color')]],
        outlineWidth: ['', [CSSValidator.classValidator('outline-width')]],
        border: ['', [CSSValidator.classValidator('border')]],
        borderColor: ['', [CSSValidator.classValidator('border-color')]],
        borderWidth: ['', [CSSValidator.classValidator('border-width')]],
        fontStyle: ['', [CSSValidator.classValidator('font-style')]],
        fontWeight: ['', [CSSValidator.classValidator('font-weight')]],
        textDecoration: ['', [CSSValidator.classValidator('text-decoration')]],
        cursor: ['', [CSSValidator.classValidator('cursor')]],
        color: ['', [CSSValidator.classValidator('color')]],
        isWholeLine: [false],
        before: [{} as ChildDecorationModel, { updateOn: 'blur' }],
        after: [{} as ChildDecorationModel, { updateOn: 'blur' }],
    });

    @ViewChild('container')
    override droppableElement!: ElementRef;

    override onDrop: (event: DragEvent) => void = () => {
        this.drag.disableDraggable();
    };

    public CHILD_DECORATION_TYPE = ChildDecorationType;

    constructor(
        private ruleService: RuleService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
        logger: LoggerService,
        drag: DragService,
        public extensionService: ExtensionService,
    ) {
        super(drag, logger);
    }

    /**
     * TODO: REVIEW THAT updateOn 'blur' didnt break everything...
     * we got most fo the control stuff working.
     *
     * @returns
     */
    onValueChange = () => {
        if (this.isEditingTitle) {
            this.logger.debug(
                'rule.component.ts - isEditingTitle, not pushing value change.',
            );
            return;
        }

        const newRule = overwrite(this.rule, this.ruleForm.value);

        if (Rule.equals(this.rule, newRule)) {
            this.logger.debug(
                'rule.component.ts - rule is equal, not pushing value change.',
            );
            return;
        }

        // override title as only this::updateTitle should update title.
        newRule.title = this.rule.title;
        this.ruleService.updateRule(newRule);
        this.ruleService.pushRules();
    };

    ngOnChanges(changes: SimpleChanges): void {
        const change = changes['rule'];
        if (change) {
            this.ruleForm.patchValue(change.currentValue);
        }

        if (!this.ruleForm?.controls?.title?.valid || !this.rule?.title) {
            this.isEditingTitle = true;
        }
    }

    ngOnInit() {
        this.dragData = this.rule.id;
        this.ruleForm.patchValue(this.rule);
        this.ruleForm.valueChanges.subscribe(this.onValueChange);
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
        this.logger.info(`Deleting rule ${this.rule.id}`);
        this.ruleService.removeRule(this.rule.id!);
        this.ruleService.pushRules();
    }

    updateColorPicker(control: string, value: string) {
        this.ruleForm.get(control)?.setValue(value);
        this.ruleService.updateRule(this.rule);
        this.ruleService.pushRules();
    }

    onFormFocus() {
        // NO-OP
    }

    onFormBlur() {
        // NO-OP
    }

    toggleExpand(event: Event) {
        if (event.target !== event.currentTarget) {
            return;
        }
        this.rule.expanded = !this.rule.expanded;
        this.ruleService.updateRule(this.rule);
        this.ruleService.pushRulesToExtension();
    }

    toggleDecorationExpanded(event: Event) {
        if (event.target !== event.currentTarget) {
            return;
        }
        this.rule.decorationExpanded = !this.rule.decorationExpanded;
        this.ruleService.updateRule(this.rule);
        this.ruleService.pushRulesToExtension();
    }

    toggleEditTitle() {
        if (!this.ruleForm.controls.title.valid) {
            return;
        }

        this.isEditingTitle = !this.isEditingTitle;
        // if no longer editing title, reset form value for title.
        if (!this.isEditingTitle) {
            this.ruleForm.controls.title.setValue(this.rule.title ?? '');
        }
    }

    getExpandedStyle(isExpanded: boolean | null) {
        return isExpanded ? 'flex' : 'none';
    }

    updateTitle(override = false) {
        if (this.ruleForm.controls.title.valid || override) {
            try {
                this.logger.debug(
                    `updateTitle() - updating rule title from ${this.rule.title} to ${this.ruleForm?.value?.title}`,
                );
                this.rule.title =
                    this.ruleForm?.value?.title?.toUpperCase() ?? '';
                this.ruleService.updateRule(this.rule);
                this.ruleService.pushRules();
            } catch (exception) {
                this.logger.error(`Unable to update rule: ${exception}`);
            }
        }
    }
}
