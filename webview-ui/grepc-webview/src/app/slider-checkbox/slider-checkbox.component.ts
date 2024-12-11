import {
    trigger,
    state,
    style,
    animate,
    transition,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-slider-checkbox',
    imports: [CommonModule, ReactiveFormsModule],
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
