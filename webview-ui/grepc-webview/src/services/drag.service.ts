import { Injectable } from "@angular/core";
import { Draggable } from "../utilities/draggable";
import { RuleService } from "./rule.service";
import { Rule } from "../models/rule";
import { RuleComponent } from "../app/rule/rule.component";

@Injectable({
    providedIn: 'root'
})
export class DragService {

    private _registered: Set<Draggable> = new Set();
    private _dragged: Draggable | undefined = undefined;

    constructor(
        private ruleService: RuleService
    ) {

    }

    register(element: Draggable) {
        console.log('Registering: ', element);
        this._registered.add(element);
    }

    deregister(element: Draggable) {
        console.log('Deregistering: ', element);
        this._registered.delete(element);
    }

    onEnter = (draggable: Draggable) => {
        // Cool little conversion to Rule.
        let draggedRuleComponent = (<RuleComponent> this._dragged);
        console.log('Swapping positions between the draggable and dragged: ', draggable, this._dragged);
        this.ruleService.swapPositions((<RuleComponent> draggable).rule, draggedRuleComponent.rule);
        //force mouse up event as we have successfully swapped positions.
        //draggedRuleComponent.mouseUp();
    };

    /**
     * This enables mouse event listeners on all draggables. 
     */
    enableDraggable(draggedItem: Draggable) {
        this._dragged = draggedItem;
        this._registered.forEach(draggable => {
            // enable drag detection for everything but what is being dragged.
            if(draggable !== this._dragged) {
                draggable.enableDragDetection();
            }
        });
    }

    /**
     * This disables mouse event listeners on all draggables.
     */
    disableDraggable() {
        this._dragged = undefined;
        this._registered.forEach(draggable => {
            draggable.disableDragDetection();
        });
    }
}