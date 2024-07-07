import { Injectable } from '@angular/core';
import { Draggable } from "../utilities/draggable";
import { RuleService } from "./rule.service";
import { RuleComponent } from "../app/rule/rule.component";
import { ExtensionService } from "./extension.service";
import { Droppable } from '../utilities/droppable';
import { LoggerService } from './logger.service';

@Injectable({
    providedIn: 'root',

})
export class DragService {
    private _registered = new Set<Draggable>();
    private _dragged: Draggable | undefined = undefined;
    private dragData: string | undefined;
    private _location: string | undefined = undefined;
    private _isInWindow = false;
    private _inWindowTimeout: NodeJS.Timeout | undefined;

    /**
     * dragOriginLocation is set on all webviews with the same origin location as soon as a drag starts and is set back to undefined as soon as the drop event fires.
     * If the _location of this drag service does not match dragOriginLocation, the drag originated elsewhere.
     */
    public dragOriginLocation: string | undefined = undefined;

    /**
     * This is hear as a back up as the dragleave/mouseleave events are unreliable.
     */
    leaveWindowCallback = () => {
        this._isInWindow = false;
    };

    showDropOverlay() {
        return this.dragOriginLocation 
            && this._location !== this.dragOriginLocation 
            && this._isInWindow;
    }

    onDragEnd = (event: DragEvent) => {
        event.preventDefault();
        if(this.dragOriginLocation === this._location) {
            /* If drag ends and we are in the same window that the drag started, push the updated rules to extension */
            this.ruleService.pushRulesToExtension();
        }
        this._isInWindow = false;
        //technically unnecessary.
        this.dragOriginLocation = undefined;
        this.dragData = undefined;

        this.disableDraggable();
    };


    onTargetDragOver = (draggable: Draggable | Droppable) => {
        if (this._dragged instanceof RuleComponent && draggable instanceof RuleComponent) {
            // Cool little conversion to Rule.
            this.ruleService.swapPositions(
                (draggable as RuleComponent).rule,
                (this._dragged as RuleComponent).rule
            );
        }
    };

    onBodyDragEnter = () => {
        this._isInWindow = true;
    };

    /**
     * This method triggers mouse enter events on the other webview to 
     * allow dragging a rule into a different rule environment (global/local)
     */
    onBodyDragLeave = (event: DragEvent) => {
        if(event.clientX < 0 
            || event.clientX > document.body.clientWidth
            || event.clientY < 0 
            || event.clientY > document.body.clientHeight) {
            this._isInWindow = false;
        }
    };


    onBodyDragOver = (event: DragEvent) => {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        
        this._isInWindow = true;
        if(this._inWindowTimeout) {
            clearTimeout(this._inWindowTimeout);
        }
        this._inWindowTimeout = setTimeout(this.leaveWindowCallback, 100);
        
    };

    onBodyDrop = (event: DragEvent) => {
        event.preventDefault();
        this.logger.debug('onBodyDrop');
        /* We only need to send drop event if it is in a external location */
        if(this._location !== this.dragOriginLocation) {
            this.extensionService.postMessage({
                type: 'drop',
                originLocation: event.dataTransfer?.getData('text/location'),
                dragData: event.dataTransfer?.getData('text/uuid')
            });
        }

    };

    onDragStart = (event: DragEvent) => {
        this.logger.debug('onDragStart');
        this._isInWindow = true;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            const data = JSON.stringify(this.ruleService.getRule(this.dragData ?? ''));
            event.dataTransfer.setData('text/plain', data);
            event.dataTransfer.setData('text/uuid', this.dragData ?? '');
            // Since we can't getData before drop, we must get data via alternative means.
            this.extensionService.postMessage({
                type: 'dragstart',
                originLocation: this._location ?? ''
            });
        }
    };

    constructor(
        private ruleService: RuleService,
        private extensionService: ExtensionService,
        private logger: LoggerService
    ) {
    }

    set location(location: string) {
        this._location = location;
    }

    get location(): string | undefined{
        return this._location;
    }

    /**
     * Intended lifecycle hooks to be called by app.component
     */
    addEventListeners() {
        //document.body cannot listen to dragover and drop or else it will become a droppable area.
        document.body.addEventListener('drop', this.onBodyDrop);
        document.body.addEventListener('dragover', this.onBodyDragOver);
        document.body.addEventListener('dragenter', this.onBodyDragEnter);
        document.body.addEventListener('dragleave', this.onBodyDragLeave);
        document.body.addEventListener('dragend', this.onDragEnd);
    }

    /**
    * Intended lifecycle hooks to be called by app.component
    */
    removeEventListeners() {
        //document.body cannot listen to dragover and drop or else it will become a droppable area.
        document.body.removeEventListener('drop', this.onBodyDrop);
        document.body.removeEventListener('dragover', this.onBodyDragOver);
        document.body.removeEventListener('dragenter', this.onBodyDragEnter);
        document.body.removeEventListener('dragleave', this.onBodyDragLeave);
        document.body.removeEventListener('dragend', this.onDragEnd);
    }

    register(element: Draggable) {
        this._registered.add(element);
    }

    deregister(element: Draggable) {
        this._registered.delete(element);
    }

    /**
     * This enables mouse event listeners on all draggables. 
     */
    enableDraggable(draggedItem: Draggable) {
        if (draggedItem instanceof RuleComponent) {
            this.dragData = draggedItem.rule.id;
        }
        this._dragged = draggedItem;
        this._registered.forEach(draggable => {
            // enable drag detection for everything but what is being dragged.
            if (draggable !== this._dragged) {
                draggable.enableDropDetection();
            }
        });

        document.body.addEventListener('dragstart', this.onDragStart);
    }

    /**
     * This disables mouse event listeners on all draggables.
     */
    disableDraggable() {
        this._dragged = undefined;
        this._registered.forEach(draggable => {
            draggable.disableDropDetection();
        });
        
        /* This catches the case of disableDraggable being called externally */
        if(this._location && this.dragOriginLocation 
            && this._location === this.dragOriginLocation) {
            this.ruleService.pushRulesToExtension();
        }
       
        document.body.removeEventListener('dragstart', this.onDragStart);
    }
}