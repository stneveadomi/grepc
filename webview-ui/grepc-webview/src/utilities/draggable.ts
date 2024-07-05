import { ElementRef } from "@angular/core";
import { DragService } from "../services/drag.service";
import { Droppable } from "./droppable";
import { LoggerService } from "../services/logger.service";

/**
 * Draggable class.
 * MUST implement OnDestroy in ALL subclasses and be called from the respective ngOnDestroy() method.
 * e.g.
 * ```
 *  class RuleComponent extends Draggable implements OnDestroy
 *  //...
 * 
 *  ngOnDestroy() {
 *    super.onDestroy();
 *  }
 * ```
 */
export abstract class Draggable extends Droppable {
    /**
     * @property containingElement is the DOM element that we want to check for mouseenter events.
     * This often will be the top-level element of the Draggable component.
     */
    abstract containingElement: ElementRef;

    protected isDraggable: boolean = false;

    abstract dragData: string | undefined;

    constructor(
        override drag: DragService,
        protected logger: LoggerService
    ) {
        super(drag);
        this.drag.register(this);
    }

    enableDraggable() {
        this.isDraggable = true;
        this.drag.enableDraggable(this);
    }

    disableDraggable() {
        this.isDraggable = false;
        this.drag.disableDraggable();
    }

    /**
     * Warning: THIS MUST BE CALLED FROM THE IMPLEMENTING CLASS WITH NgOnDestroy being implemented.
     */
    public onDestroy() {
        this.drag.deregister(this);
    }
}