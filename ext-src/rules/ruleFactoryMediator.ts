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

    async moveRule(_dragData: string, source: LocationState, target: LocationState) {
        if(!_dragData) {
            throw new Error('DragData cannot be falsey.');
        }
        const sourceRuleFactory = this.map.get(source);

        const rule = sourceRuleFactory?.getRule(_dragData);
        if(!rule) {
            throw new Error('Rule does not exist within source location.');
        }

        const targetRuleFactory = this.map.get(target);
        if(sourceRuleFactory && targetRuleFactory) {
            try {
                sourceRuleFactory.locked = true;
                targetRuleFactory.locked = true;
                await targetRuleFactory.addRule(rule);
                await sourceRuleFactory.removeRule(rule.id);
            } finally {
                sourceRuleFactory.locked = false;
                targetRuleFactory.locked = false;
            }

        } else {
            throw new Error('Unable to fetch rule factories.');
        }

    }
}