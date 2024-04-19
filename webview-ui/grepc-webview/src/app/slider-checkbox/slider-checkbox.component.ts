import { trigger, state, style, animate, transition, query } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-slider-checkbox',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('slider', [
      state('enabled', style({
        background: '#009b32cf',
      })),
      state('disabled', style({
        background: '#313131',
      })),
      transition('enabled <=> disabled', [
        animate('0.3s'),
      ]),
    ])
  ],
  templateUrl: './slider-checkbox.component.html',
  styleUrl: './slider-checkbox.component.css'
})
export class SliderCheckboxComponent {
  @Input({required: true})
  control!: FormControl;
  
  sliderToggle = false;
  sliderClass = '';

  toggle(event: Event) {
    if(event.target === event.currentTarget) {
      this.sliderToggle = !this.sliderToggle;
    }
  }
}
