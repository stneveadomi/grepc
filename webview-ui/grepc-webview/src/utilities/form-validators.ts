import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function RegularExpressionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        try {
            new RegExp(control.value);
            return null;
        } catch {
            return { regExInvalid: control.value };
        }
    };
}

export class CSSValidator {
    public static classValidator(styleProperty: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (
                control.value &&
                !this.validateCSS(styleProperty, control.value)
            ) {
                return { validationError: 'CSS Invalid' };
            }
            return null;
        };
    }

    static validateCSS(property: string, propertyValue: string) {
        if (!propertyValue) {
            return true;
        }
        const option = new Option();

        /* Handle manually all the cases where validation doesn't work as expected? */
        switch (property) {
            case 'outline-color':
            case 'border-color':
                property = 'color';
                break;
            case 'outline-width':
                property = 'width';
                break;
            case 'font-weight':
                return /^(normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900|inherit)$/.test(
                    propertyValue,
                );
            case 'font-style':
                return /^(normal|italic|oblique|inherit)$/.test(propertyValue);
            case 'text-decoration':
                return /^((none|underline|overline|line-through|blink)(\s+(solid|double|dotted|dashed|wavy))?(\s+\w+)?|inherit)$/.test(
                    propertyValue,
                );
            case 'cursor':
                return /^(auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|all-scroll|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out|inherit|initial|unset)$/.test(
                    propertyValue,
                );
            case 'url':
                try {
                    new URL(propertyValue);
                    return true;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error: unknown) {
                    return false;
                }
        }
        option.style.setProperty(property, propertyValue);
        return !!option.style.getPropertyValue(property);
    }
}
