import { CommonModule } from "@angular/common";
import { Component, EventEmitter, forwardRef, Input, Output } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { ColorPickerModule } from "ngx-color-picker";
import { DecorationPreviewComponent } from "../../decoration-preview/decoration-preview.component";
import { OccurrencesComponent } from "../../occurrences/occurrences.component";
import { SliderCheckboxComponent } from "../../slider-checkbox/slider-checkbox.component";
import { Rule } from "../../../models/rule";
import { RuleService } from "../../../services/rule.service";
import { CSSValidator } from "../../../utilities/form-validators";

@Component({
    selector: 'app-child-decoration',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SliderCheckboxComponent,
        ColorPickerModule,
        DecorationPreviewComponent,
        OccurrencesComponent,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ChildDecorationComponent),
            multi: true,
        },
    ],
    templateUrl: './child-decoration.component.html',
    styleUrl: './child-decoration.component.css',
})
export class ChildDecorationComponent implements ControlValueAccessor {
    @Input({ required: true })
    id!: ChildDecorationType;

    @Input({ required: true })
    rule!: Rule;

    // @Output()
    // ruleChange = new EventEmitter<Rule>();

    isEditing = false;

    formGroup = this.fb.nonNullable.group({
        contentText: [<string | undefined> ''],
        contentIconPath: [<string | undefined> '', [CSSValidator.classValidator('url')]],
        border: ['', [CSSValidator.classValidator('border')]],
        borderColor: [<string | undefined> '', [CSSValidator.classValidator('border-color')]],
        fontStyle: ['', [CSSValidator.classValidator('font-style')]],
        fontWeight: ['', [CSSValidator.classValidator('font-weight')]],
        textDecoration: ['', [CSSValidator.classValidator('text-decoration')]],
        color: ['', [CSSValidator.classValidator('cursor')]],
        backgroundColor: ['', [CSSValidator.classValidator('background-color')]],
        margin: ['', [CSSValidator.classValidator('margin')]],
        width: ['', [CSSValidator.classValidator('width')]],
        height: ['', [CSSValidator.classValidator('height')]]
    });

    constructor(
        private fb: FormBuilder,
        private ruleService: RuleService
    ) {

    }
    
    writeValue(value: any) {
        this.formGroup.setValue(value);
    }

    registerOnChange(fn: Function) {
        this.formGroup.valueChanges.subscribe((val) => fn(val));
    }

    registerOnTouched(fn: Function) {
        this.formGroup.valueChanges.subscribe((val) => fn(val));
    }

    getExpandedStyle(isExpanded: boolean | null) {
        return isExpanded ? 'flex' : 'none';
    }

    get isEnabled() {
        switch (this.id) {
            case ChildDecorationType.BEFORE:
                return this.rule.beforeExpanded;
            case ChildDecorationType.AFTER:
                return this.rule.afterExpanded;
        }
    }

    getTitle() {
        switch (this.id) {
            case ChildDecorationType.BEFORE:
                return 'Before';
            case ChildDecorationType.AFTER:
                return 'After';
        }
    }

    toggleExpand(event: Event) {
        if (event.target !== event.currentTarget) {
            return;
        }

        switch (this.id) {
            case ChildDecorationType.BEFORE:
                this.rule.beforeExpanded = !this.rule.beforeExpanded;
                break;
            case ChildDecorationType.AFTER:
                this.rule.afterExpanded = !this.rule.afterExpanded;
                break;
        }
        this.ruleService.updateRule(this.rule);
        this.ruleService.pushRulesToExtension();
    }

    updateColorPicker(control: string, value: string) {
        this.formGroup.get(control)?.setValue(value);
        this.ruleService.updateRule(this.rule);
        this.ruleService.pushRules();
    }

    onFormFocus() {
        this.isEditing = true;
    }

    onFormBlur() {
        this.isEditing = false;
        // this.STATUS_CHANGE_OBSERVER.next(this.ruleForm.status);
    }

}

export enum ChildDecorationType {
    BEFORE = "before",
    AFTER = "after",
}