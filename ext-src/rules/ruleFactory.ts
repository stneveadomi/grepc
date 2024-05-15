import * as vscode from 'vscode';
import { GlobalState } from '../utilities/types';
import { Rule } from './rule';
import { BehaviorSubject, Observable, Subject, shareReplay } from 'rxjs';
import { GrepcViewProvider } from '../viewProviders/grepcViewProvider';
import { LocationState } from './locationState';

export class RuleFactory {
    private readonly _isGlobalState;

    private localState: vscode.Memento | undefined = undefined;
    private globalState: GlobalState | undefined = undefined;
    private _enabledRules = new Subject<Rule[]>();

    private _grepcProvider: GrepcViewProvider | undefined = undefined;
    private static RULES_MAP_KEY_ID = 'rulesMap';
    private static RULES_ARRAY_KEY_ID = 'rulesArray';

    public readonly $enabledRules: Observable<Rule[]> = this._enabledRules.asObservable().pipe(shareReplay(1));

    constructor(
        state: vscode.Memento | GlobalState, 
        isGlobalState: boolean,
        public readonly location: LocationState
    ) {
        this._isGlobalState = isGlobalState;
        if(isGlobalState) {
            this.globalState = <GlobalState> state;
        } else {
            this.localState = state;
        }
    }

    set grepcProvider(value: GrepcViewProvider) {
        this._grepcProvider = value;
    }

    private getState() {
        return this._isGlobalState
            ? this.globalState
            : this.localState;
    }

    public getRulesMap(): Map<string, Rule> {
        let value = this.getState()?.get<[string, Rule][]>(RuleFactory.RULES_MAP_KEY_ID, []) ?? [];
        let map: Map<string, Rule> = new Map(value);
        return map;
    }

    public getRulesArray(): Rule[] {
        const rulesArray = this.getState()?.get<Rule[]>(RuleFactory.RULES_ARRAY_KEY_ID) ?? [];
        console.log('getRulesArray() is called. updating $enabledRules');
        this._enabledRules.next(rulesArray.filter(rule => rule.enabled));
        return rulesArray;
    }

    disableRules() {
        const rulesArray = this.getRulesArray().map(value => {
            value.enabled = false;
            return value;
        });
        const rulesMap = this.getRulesMap();
        const newRulesMap = new Map();
        rulesMap.forEach((value, key) => {
            value.enabled = false;
            newRulesMap.set(key, value);
        });
        this.updateRules(newRulesMap, rulesArray);
    }

    enableRules() {
        const rulesArray = this.getRulesArray().map(value => {
            value.enabled = true;
            return value;
        });
        const rulesMap = this.getRulesMap();
        const newRulesMap = new Map();
        rulesMap.forEach((value, key) => {
            value.enabled = true;
            newRulesMap.set(key, value);
        });
        this.updateRules(newRulesMap, rulesArray);
    }

    public addRule(title: string, regEx: string | undefined, bgColor: string | undefined) {
        this._grepcProvider?.addRule(title, regEx, bgColor);
    }

    /**
     * ** Warning: This will push the rules to webview **
     * @param rulesMap 
     * @param rulesArray 
     */
    public updateRules(rulesMap: Map<string, Rule>, rulesArray: Rule[]) {
        console.log('Updating rules in state:', Array.from(rulesMap.entries()));
        this._enabledRules.next(rulesArray.filter(rule => rule.enabled));
        this.getState()?.update(RuleFactory.RULES_MAP_KEY_ID, Array.from(rulesMap.entries()));
        this.getState()?.update(RuleFactory.RULES_ARRAY_KEY_ID, rulesArray);
        this._grepcProvider?.pushRules();
    }
    /**
     * This method will purely only update the states without pushing the states to the webview.
     * @param rulesMap 
     * @param rulesArray 
     */
    public updateRulesLocally(rulesMap: Map<string, Rule>, rulesArray: Rule[]) {
        console.log('Updating rules in state:', Array.from(rulesMap.entries()));
        this._enabledRules.next(rulesArray.filter(rule => rule.enabled));
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

    pushOccurrences(rule: Rule, occurrences: number) {
        //console.log('push occurrences', JSON.stringify(rule), occurrences);
        this._grepcProvider?.webview?.postMessage({
            type: 'ruleOccurrences',
            id: rule.id,
            occurrences: occurrences
        });
    }

    /**
     * recast the current enabled rules for use in triggerUpdateDecorations.
     * For more info, see DecorationTypeManager::enableDecorationDetection
     */
    recastEnabledRules() {
        this.getRulesArray();
    }

    parseRules(mapData: string, arrayData: string) {
        try {
            console.log('parsing data:', mapData);
            let parse = JSON.parse(mapData);
            let rulesMap: Map<string, Rule> = new Map<string, Rule>(parse);
            let rulesArray = JSON.parse(arrayData);
            this.updateRulesLocally(rulesMap, rulesArray);
        }
        catch (e) {
            console.error(`Unable to parse JSON map in pushRules().`, e);
        }
    };
}

