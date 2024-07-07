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
    protected isDraggable = false;

    abstract dragData: string | undefined;

    constructor(
        override drag: DragService,
        override logger: LoggerService
    ) {
        super(drag, logger);
        this.drag.register(this);
    }

    /**
     * Can be called from inner, enables draggable within drag service
     */
    enableDraggable() {
        this.logger.trace('enableDraggable()');
        this.isDraggable = true;
        this.drag.enableDraggable(this);
    }

    /**
     * Only drag service calls this or the component itself.
     * Will not disable draggable across all registered draggable.
     */
    disableDraggable() {
        this.logger.trace('disableDraggable()', this.dragData);
        this.isDraggable = false;
    }

    disableAllDraggable() {
        this.drag.disableDraggable();
    }

    /**
     * Warning: THIS MUST BE CALLED FROM THE IMPLEMENTING CLASS WITH NgOnDestroy being implemented.
     */
    public onDestroy() {
        this.drag.deregister(this);
    }
}