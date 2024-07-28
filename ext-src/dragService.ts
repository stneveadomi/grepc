import { DecorationTypeManager } from './decorationTypeManager';
import { LocationState, reverseMap } from './rules/locationState';
import { RuleFactoryMediator } from './rules/ruleFactoryMediator';
import { GrepcViewProvider } from './viewProviders/grepcViewProvider';
import * as vscode from 'vscode';

export class DragService {
    private locationToWebviewProvider = new Map<
        LocationState,
        GrepcViewProvider
    >();
    private _dragData: string | undefined;
    private _originLocation: LocationState | undefined;

    constructor(
        protected ruleFactoryMediator: RuleFactoryMediator,
        protected dtTypeManager: DecorationTypeManager,
        protected logger: vscode.LogOutputChannel,
    ) {}

    get dragData(): string | undefined {
        return this._dragData;
    }

    set dragData(dragData: string | undefined) {
        this._dragData = dragData;
    }

    get originLocation() {
        return this._originLocation;
    }

    set originLocation(origin: LocationState | undefined) {
        this._originLocation = origin;
    }

    register(location: LocationState, viewProvider: GrepcViewProvider) {
        this.locationToWebviewProvider.set(location, viewProvider);
    }

    async transferRule(targetLocation: string | undefined) {
        if (!targetLocation) {
            this.logger.error(
                '[DRAG] Unable to transfer rule as target location is undefined.',
            );
        }
        this.logger.debug(
            `[DRAG] Transferring rule ${this._dragData} from ${this._originLocation} to ${targetLocation}`,
        );
        const source = <LocationState>this._originLocation;
        const target = <LocationState>targetLocation;

        if (source && target && source !== target && this._dragData) {
            await this.ruleFactoryMediator.moveRule(
                this._dragData,
                source,
                target,
            );
            // If successful in moving rule, now trigger update decorations.
            this.dtTypeManager.applyDecorationsToVisibleEditors();
        } else {
            throw new Error(
                `source or target webview are undefined or equal.\n SRC: ${reverseMap(source)} TARGET: ${reverseMap(target)} dragData: ${this._dragData}`,
            );
        }
    }

    emitDragStart(originLocation: string | undefined) {
        this.locationToWebviewProvider.forEach((webviewProvider) => {
            webviewProvider.emitDragStart(originLocation);
        });
    }

    emitDragEnd() {
        this.locationToWebviewProvider.forEach((webviewProvider) => {
            webviewProvider.emitDragEnd();
        });
    }
}
