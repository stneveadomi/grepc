import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function RegularExpressionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        try {
            new RegExp(control.value);
            return null;
        } catch {
            return {regExInvalid: control.value};
        }
    };
}