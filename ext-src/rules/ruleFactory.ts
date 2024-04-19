import * as vscode from 'vscode';
import { GlobalState } from '../utilities/types';
import { Rule } from './rule';

export class RuleFactory {
    private readonly _isGlobalState;

    private localState: vscode.Memento | undefined = undefined;
    private globalState: GlobalState | undefined = undefined;

    private static RULES_KEY_ID = 'rules';

    constructor(state: vscode.Memento | GlobalState, isGlobalState: boolean) {
        this._isGlobalState = isGlobalState;
        if(isGlobalState) {
            this.globalState = <GlobalState> state;
        } else {
            this.localState = state;
        }
    }

    private getState() {
        return this._isGlobalState
            ? this.globalState
            : this.localState;
    }

    public getRules(): Map<string, Rule> {
        let value = this.getState()?.get<[string, Rule][]>(RuleFactory.RULES_KEY_ID, []) ?? [];
        let map: Map<string, Rule> = new Map(value);
        console.log('Loaded map of size:', map.size);
        return map;
    }

    public addRule(rule: Rule) {
        const rules = this.getRules();
        rules.set(rule.id, rule);
    }

    public updateRules(rules: Map<string, Rule>) {
        console.log('Updating rules in state:', Array.from(rules.entries()));
        this.getState()?.update(RuleFactory.RULES_KEY_ID, Array.from(rules.entries()));
    }

    public removeRule(id: string) {
        const rules = this.getRules();
        rules.delete(id);
        this.updateRules(rules);
    }

    parseRules(data: string) {
        try {
            console.log('parsing data:', data);
            let parse = JSON.parse(data);
            let rules: Map<string, Rule> = new Map<string, Rule>(parse);
            this.updateRules(rules);
        }
        catch (e) {
            console.error(`Unable to parse JSON map in pushRules().`, e);
        }
    };
}

