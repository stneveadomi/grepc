import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Rule } from "../models/rule";

@Injectable({
    providedIn: 'root'
})
export class ExtensionService {

    public vscodeApi: any;
  
    constructor() {
        this.vscodeApi = (window as any)?.['acquireVsCodeApi']?.();
        console.log('vscode api: ', this.vscodeApi);
    }

    postMessage(event: any) {
        this.vscodeApi?.['postMessage'](event);
    }
}