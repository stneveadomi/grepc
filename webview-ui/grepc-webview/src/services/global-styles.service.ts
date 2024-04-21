import { Injectable, Renderer2, RendererFactory2 } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class GlobalStylesService {

    private _bodyClass = new BehaviorSubject('');
    private renderer: Renderer2;
    $bodyClass = this._bodyClass.asObservable();

    _classSet = new Set<string>();

    constructor(
        rendererFactory: RendererFactory2
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    addClass(classStr: string) {
        if(!this._classSet.has(classStr)) {
            this._classSet.add(classStr);
        }
        this._classSet.forEach(value => {
            this.renderer.addClass(document.body, value);
        });
    }

    removeClass(classStr: string) {
        this._classSet.forEach(value => {
            this.renderer.removeClass(document.body, value);
        });
        this._classSet.delete(classStr);
        this._classSet.forEach(value => {
            this.renderer.addClass(document.body, value);
        });
    }
}