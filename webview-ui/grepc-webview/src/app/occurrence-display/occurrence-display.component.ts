import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LineRange } from '../../models/line-range';
import { Rule } from '../../models/rule';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-occurrence-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './occurrence-display.component.html',
  styleUrl: './occurrence-display.component.css'
})
export class  OccurrenceDisplayComponent {
  /**
   * The line range to display.
   */
  @Input({required: true})
  lineRange!: LineRange | undefined;

  /** 
   * The decoration to be used.
   */
  @Input({required: true})
  rule!: Rule;

  /**
   * If -1, that means the lineRange is the selected line range.
   */
  @Input({required: true})
  occurrenceIndex!: number;

  /**
   * This is used to signal if the item is selected in the occurrence dropdown.
   */
  @Input()
  isSelected = false;

  @Output()
  selected = new EventEmitter<void>();

  select() {
    this.selected.emit();
  }

}
