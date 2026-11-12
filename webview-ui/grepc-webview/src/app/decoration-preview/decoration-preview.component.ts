import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Rule } from '../../models/rule';

@Component({
    selector: 'app-decoration-preview',
    imports: [],
    templateUrl: './decoration-preview.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './decoration-preview.component.css',
})
export class DecorationPreviewComponent {
    @Input({ required: true })
    rule!: Rule;
}
