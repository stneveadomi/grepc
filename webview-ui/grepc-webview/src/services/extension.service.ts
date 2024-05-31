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
    }

    postMessage(event: any) {
        if(event?.type !== 'log') {
            this.log(LogLevel.DEBUG, `postMessage event to extension of type ${event?.type}`);
        }
        this.vscodeApi?.['postMessage'](event);
    }

    log(logLevel: LogLevel, message: string) {
        this.postMessage({
            type: 'log',
            logLevel,
            data: message
        });
    }
}

export enum LogLevel {
    INFO = 'info',
    DEBUG = 'debug',
    ERROR = 'error',
    WARN = 'warn'
}