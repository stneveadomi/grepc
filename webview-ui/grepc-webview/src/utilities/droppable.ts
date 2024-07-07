import { ElementRef } from "@angular/core";
import { DragService } from "../services/drag.service";
import { LoggerService } from "../services/logger.service";

/**
 * Droppable class.
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
export abstract class Droppable {

    abstract droppableElement: ElementRef;

    onDragOver = (event: DragEvent) => {
        event.preventDefault();
        this.drag.onTargetDragOver(this);
    };

    abstract onDrop: (event: DragEvent) => void;

    private preventDefault = (event: DragEvent) => {
        event.preventDefault();
    };

    constructor(
        protected drag: DragService,
        protected logger: LoggerService
    ) {
    }

    enableDropDetection() {
        this.droppableElement?.nativeElement?.addEventListener('dragover', this.onDragOver);
        this.droppableElement?.nativeElement?.addEventListener('drop', this.onDrop);
        this.droppableElement?.nativeElement?.addEventListener("dragenter", this.preventDefault);
    }

    disableDropDetection() {
        this.droppableElement?.nativeElement?.removeEventListener('dragover', this.onDragOver);
        this.droppableElement?.nativeElement?.removeEventListener('drop', this.onDrop);
        this.droppableElement?.nativeElement?.removeEventListener('dragenter', this.preventDefault);
    }
}