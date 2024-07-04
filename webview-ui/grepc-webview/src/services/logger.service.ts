import { Injectable } from "@angular/core";
import { ExtensionService, LogLevel } from "./extension.service";

@Injectable({
    providedIn: 'root'
})
export class LoggerService {

    public location: string | undefined = undefined;

    public printToConsole = true;

    constructor(
        protected extension: ExtensionService
    ) {

    }

    private getFormattedLocation() {
        return this.location ? ('[' + /[\w]+/g.exec(this.location)  + ']') : '';
    }

    info(message: string, ...objs: any[]) {
        if(this.printToConsole) {
            console.log(this.getFormattedLocation(), message, ...objs);
        }
        this.extension.log(LogLevel.INFO, this.getFormattedLocation() + message + objs.join('\n'));
    }

    error(message: string, ...objs: any[]) {
        if(this.printToConsole) {
            console.error(this.getFormattedLocation(), message, objs);
        }
        this.extension.log(LogLevel.ERROR, this.getFormattedLocation() + message + objs.join('\n'));
    }

    debug(message: string, ...objs: any[]) {
        if(this.printToConsole) {
            console.debug(this.getFormattedLocation(), message, objs);
        }
        this.extension.log(LogLevel.DEBUG, this.getFormattedLocation() + message + objs.join('\n'));
    }

    warn(message: string, ...objs: any[]) {
        if(this.printToConsole) {
            console.warn(this.getFormattedLocation(), message, objs);
        }
        this.extension.log(LogLevel.WARN, this.getFormattedLocation() + message + objs.join('\n'));
    }
}