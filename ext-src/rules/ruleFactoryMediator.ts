import * as vscode from 'vscode';
import { RuleFactory } from './ruleFactory';
import { LocationState } from './locationState';
import { GlobalState } from '../utilities/types';

export class RuleFactoryMediator {

    map: Map<LocationState, RuleFactory> = new Map();

    constructor(context: vscode.ExtensionContext, logger: vscode.LogOutputChannel) {
        this.map.set(LocationState.LOCAL, new RuleFactory(context.workspaceState, false, LocationState.LOCAL, logger));
        this.map.set(LocationState.GLOBAL, new RuleFactory(<GlobalState> context.globalState, true, LocationState.GLOBAL, logger));
    }

    getRuleFactory(location: LocationState) {
        return this.map.get(location);
    }
}