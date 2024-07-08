import { CSSValidator } from './form-validators';

describe('CSSValidators', () => {
    describe.each([
        { attribute: 'color', value: 'blue', expected: true },
        { attribute: 'color', value: 'rgb(75,75,75)', expected: true },
        { attribute: 'color', value: 'blaue', expected: false },
        { attribute: 'background-color', value: 'blue', expected: true },
        { attribute: 'background-color', value: 'blawae', expected: false },
        { attribute: 'border', value: '10pawdaw', expected: false },
        { attribute: 'border', value: '1px solid', expected: true },
        { attribute: 'border-color', value: '1px solid', expected: false },
        { attribute: 'border-color', value: 'yellow', expected: true },
        { attribute: 'border-width', value: '1px', expected: true },
        { attribute: 'border-width', value: '-1', expected: false },
        { attribute: 'outline', value: '1px solid', expected: true },
        { attribute: 'outline-color', value: '1px solid', expected: false },
        { attribute: 'outline-color', value: 'yellow', expected: true },
        { attribute: 'outline-width', value: '1px', expected: true },
        { attribute: 'outline-width', value: '-1', expected: false },
        { attribute: 'font-style', value: '-1', expected: false },
        { attribute: 'font-style', value: 'italic', expected: true },
        { attribute: 'font-weight', value: '400', expected: true },
        { attribute: 'font-weight', value: 'a2ba', expected: false },
        {
            attribute: 'text-decoration',
            value: 'underline solid red',
            expected: true,
        },
        {
            attribute: 'text-decoration',
            value: 'blink adwadwa2412 red',
            expected: false,
        },
        { attribute: 'cursor', value: 'pointer', expected: true },
        { attribute: 'cursor', value: 'white', expected: false },
    ])('validateCSS($attribute, $value)', ({ attribute, value, expected }) => {
        test('should validate properly', () => {
            expect(CSSValidator.validateCSS(attribute, value)).toBe(expected);
        });
    });
});
