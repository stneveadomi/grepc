import * as vscode from 'vscode';
import { GlobalState } from '../utilities/types';
import { Rule } from './rule';

export class RuleFactory {
    private readonly _isGlobalState;

    private localState: vscode.Memento | undefined = undefined;
    private globalState: GlobalState | undefined = undefined;

    private static RULES_MAP_KEY_ID = 'rulesMap';
    private static RULES_ARRAY_KEY_ID = 'rulesArray';

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

    public getRulesMap(): Map<string, Rule> {
        let value = this.getState()?.get<[string, Rule][]>(RuleFactory.RULES_MAP_KEY_ID, []) ?? [];
        let map: Map<string, Rule> = new Map(value);
        console.log('Loaded map of size:', map.size);
        return map;
    }

    public getRulesArray(): Rule[] {
        return this.getState()?.get<Rule[]>(RuleFactory.RULES_ARRAY_KEY_ID) ?? [];
    }

    public addRule(rule: Rule) {
        const rules = this.getRulesMap();
        rules.set(rule.id, rule);
    }

    public updateRules(rulesMap: Map<string, Rule>, rulesArray: Rule[]) {
        console.log('Updating rules in state:', Array.from(rulesMap.entries()));
        this.getState()?.update(RuleFactory.RULES_MAP_KEY_ID, Array.from(rulesMap.entries()));
        this.getState()?.update(RuleFactory.RULES_ARRAY_KEY_ID, rulesArray);
    }

    public removeRule(id: string) {
        const rulesMap = this.getRulesMap();
        const rule = rulesMap.get(id);
        rulesMap.delete(id);
        const rulesArray = this.getRulesArray().filter(val => val !== rule);

        this.updateRules(rulesMap, rulesArray);
    }

    parseRules(mapData: string, arrayData: string) {
        try {
            console.log('parsing data:', mapData);
            let parse = JSON.parse(mapData);
            let rulesMap: Map<string, Rule> = new Map<string, Rule>(parse);
            let rulesArray = JSON.parse(arrayData);
            this.updateRules(rulesMap, rulesArray);
        }
        catch (e) {
            console.error(`Unable to parse JSON map in pushRules().`, e);
        }
    };
}

