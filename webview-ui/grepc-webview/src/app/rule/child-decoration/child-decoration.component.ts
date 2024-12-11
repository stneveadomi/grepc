import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormBuilder,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    ValidationErrors,
    Validator,
} from '@angular/forms';
import { ColorPickerModule } from 'ngx-color-picker';
import { Rule, ChildDecorationModel } from '../../../models/rule';
import { CSSValidator } from '../../../utilities/form-validators';
import { LoggerService } from '../../../services/logger.service';

@Component({
    selector: 'app-child-decoration',
    imports: [CommonModule, ReactiveFormsModule, ColorPickerModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: ChildDecorationComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: ChildDecorationComponent,
            multi: true,
        },
    ],
    templateUrl: './child-decoration.component.html',
    styleUrl: './child-decoration.component.css',
})
export class ChildDecorationComponent
    implements ControlValueAccessor, Validator
{
    @Input({ required: true })
    id!: ChildDecorationType;

    @Input({ required: true })
    rule!: Rule;

    @Output()
    blurred = new EventEmitter<void>();

    isEditing = false;

    formGroup = this.fb.nonNullable.group({
        contentText: ['' as string | undefined],
        border: ['', [CSSValidator.classValidator('border')]],
        borderColor: [
            '' as string | undefined,
            [CSSValidator.classValidator('border-color')],
        ],
        fontStyle: ['', [CSSValidator.classValidator('font-style')]],
        fontWeight: ['', [CSSValidator.classValidator('font-weight')]],
        textDecoration: ['', [CSSValidator.classValidator('text-decoration')]],
        color: ['', [CSSValidator.classValidator('color')]],
        backgroundColor: [
            '',
            [CSSValidator.classValidator('background-color')],
        ],
        margin: ['', [CSSValidator.classValidator('margin')]],
        width: ['', [CSSValidator.classValidator('width')]],
        height: ['', [CSSValidator.classValidator('height')]],
    });

    constructor(
        private fb: FormBuilder,
        private logger: LoggerService,
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    validate(_control: AbstractControl): ValidationErrors | null {
        return this.formGroup.errors;
    }

    registerOnValidatorChange?(fn: () => void): void {
        this.formGroup.statusChanges.subscribe(fn);
    }

    writeValue(value: ChildDecorationModel) {
        this.formGroup.patchValue(value);
    }

    registerOnChange(fn: (value: unknown) => void) {
        this.formGroup.valueChanges.subscribe(fn);
    }

    onTouched: () => void = () => this.logger.error('NO REGISTRATION');
    registerOnTouched(fn: () => void) {
        this.onTouched = fn;
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
    }

    updateColorPicker(control: string, value: string) {
        this.formGroup.get(control)?.setValue(value);
        this.blurred.emit();
    }

    onFormFocus() {
        this.isEditing = true;
        this.onTouched();
    }

    onFormBlur() {
        this.isEditing = false;
        this.onTouched();
        this.blurred.emit();
    }
}

export enum ChildDecorationType {
    BEFORE = 'before',
    AFTER = 'after',
}
