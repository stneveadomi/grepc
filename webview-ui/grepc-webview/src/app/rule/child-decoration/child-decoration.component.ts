import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { ColorPickerModule } from "ngx-color-picker";
import { DecorationPreviewComponent } from "../../decoration-preview/decoration-preview.component";
import { OccurrencesComponent } from "../../occurrences/occurrences.component";
import { SliderCheckboxComponent } from "../../slider-checkbox/slider-checkbox.component";
import { Rule } from "../../../models/rule";

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
    templateUrl: './child-decoration.component.html',
    styleUrl: './child-decoration.component.css',
})
export class ChildDecorationComponent
{
    @Input({required: true})
    id!: ChildDecorationType;

    @Input({ required: true })
    rule!: Rule;


    @Output()
    ruleChange = new EventEmitter<Rule>();

    constructor() {

    }

    getExpandedStyle(isExpanded: boolean | null) {
        return isExpanded ? 'flex' : 'none';
    }

    getTitle() {
        switch(this.id) {
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
    }

}

export enum ChildDecorationType {
    BEFORE = "before",
    AFTER = "after",
}