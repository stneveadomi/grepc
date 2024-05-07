import * as vscode from 'vscode';
import { RuleFactory } from './ruleFactory';
import { LocationState } from './locationState';
import { GlobalState } from '../utilities/types';

export class RuleFactoryMediator {

    map: Map<LocationState, RuleFactory> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.map.set(LocationState.LOCAL, new RuleFactory(context.workspaceState, false, LocationState.LOCAL));
        this.map.set(LocationState.GLOBAL, new RuleFactory(<GlobalState> context.globalState, true, LocationState.GLOBAL));
    
    }

    getRuleFactory(location: LocationState) {
        return this.map.get(location);
    }
}