import { ElementRef, OnDestroy } from "@angular/core";
import { DragService } from "../services/drag.service";

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
export abstract class Draggable {
    /**
     * @property containingElement is the DOM element that we want to check for mouseenter events.
     * This often will be the parent element of the Draggable component.
     */
    abstract containingElement: ElementRef;

    onEnter = () => {
        this.drag.onEnter(this);
    };

    constructor(protected drag: DragService) {
        this.drag.register(this);
    }

    enableDragDetection() {
        this.containingElement?.nativeElement?.addEventListener('mouseenter', this.onEnter);
    }

    disableDragDetection() {
        this.containingElement?.nativeElement?.removeEventListener('mouseenter', this.onEnter);
    }

    /**
     * Warning: THIS MUST BE CALLED FROM THE IMPLEMENTING CLASS WITH NgOnDestroy being implemented.
     */
    public onDestroy() {
        this.drag.deregister(this);
    }
}