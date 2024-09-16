import { Injectable } from '@angular/core';
import { ExtensionService, LogLevel } from './extension.service';

@Injectable({
    providedIn: 'root',
})
export class LoggerService {
    public location: string | undefined = undefined;

    constructor(protected extension: ExtensionService) {}

    private getFormattedLocation() {
        return this.location ? '[' + /[\w]+/g.exec(this.location) + ']' : '';
    }

    info(message: string, ...objs: unknown[]) {
        if (this.extension.debugMode) {
            console.log(this.getFormattedLocation(), message, ...objs);
        }
        this.extension.log(
            LogLevel.INFO,
            [this.getFormattedLocation(), message, objs.join('\n')].join(' '),
        );
    }

    error(message: string, ...objs: unknown[]) {
        if (this.extension.debugMode) {
            console.error(this.getFormattedLocation(), message, objs);
        }
        this.extension.log(
            LogLevel.ERROR,
            [this.getFormattedLocation(), message, objs.join('\n')].join(' '),
        );
    }

    debug(message: string, ...objs: unknown[]) {
        if (this.extension.debugMode) {
            console.debug(this.getFormattedLocation(), message, objs);
        }
        this.extension.log(
            LogLevel.DEBUG,
            [this.getFormattedLocation(), message, objs.join('\n')].join(' '),
        );
    }

    warn(message: string, ...objs: unknown[]) {
        if (this.extension.debugMode) {
            console.warn(this.getFormattedLocation(), message, objs);
        }
        this.extension.log(
            LogLevel.WARN,
            [this.getFormattedLocation(), message, objs.join('\n')].join(' '),
        );
    }

    trace(message: string, ...objs: unknown[]) {
        if (this.extension.debugMode) {
            console.log(this.getFormattedLocation(), message, objs);
        }
        this.extension.log(
            LogLevel.TRACE,
            [this.getFormattedLocation(), message, objs.join('\n')].join(' '),
        );
    }
}
