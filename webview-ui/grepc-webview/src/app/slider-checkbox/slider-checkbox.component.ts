import {
    trigger,
    state,
    style,
    animate,
    transition,
} from '@angular/animations';
import { NgClass } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output,
    ChangeDetectionStrategy,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-slider-checkbox',
    imports: [NgClass, ReactiveFormsModule],
    animations: [
        trigger('slider', [
            state(
                'enabled',
                style({
                    background: '#009b32cf',
                }),
            ),
            state(
                'disabled',
                style({
                    background: 'var(--vscode-input-background)',
                }),
            ),
            transition('enabled <=> disabled', [animate('0.3s')]),
        ]),
    ],
    templateUrl: './slider-checkbox.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './slider-checkbox.component.css',
})
export class SliderCheckboxComponent {
    @Input({ required: true })
    control!: FormControl;

    @Output()
    toggles = new EventEmitter<void>();

    toggle() {
        this.control.setValue(!this.control.value);
        this.toggles.emit();
    }
}
