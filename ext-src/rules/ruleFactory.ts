import * as vscode from 'vscode';
import { GlobalState } from '../utilities/types';
import { Rule } from './rule';
import { Observable, Subject, shareReplay } from 'rxjs';
import { GrepcViewProvider } from '../viewProviders/grepcViewProvider';
import { LocationState } from './locationState';
import { LineRange } from './line-range';

export class RuleFactory {
    private readonly _isGlobalState;

    private localState: vscode.Memento | undefined = undefined;
    private globalState: GlobalState | undefined = undefined;
    private _enabledRules = new Subject<Rule[]>();

    private _grepcProvider: GrepcViewProvider | undefined = undefined;
    private static RULES_MAP_KEY_ID = 'rulesMap';
    private static RULES_ARRAY_KEY_ID = 'rulesArray';
    public static STORED_VERSION_KEY_ID = 'version';

    public readonly $enabledRules: Observable<Rule[]> = this._enabledRules.asObservable().pipe(shareReplay(1));

    constructor(
        state: vscode.Memento | GlobalState, 
        isGlobalState: boolean,
        public readonly location: LocationState,
        private readonly logger: vscode.LogOutputChannel
    ) {
        this._isGlobalState = isGlobalState;
        if(isGlobalState) {
            this.globalState = <GlobalState> state;
            this.globalState.setKeysForSync([
                RuleFactory.RULES_MAP_KEY_ID,
                RuleFactory.RULES_ARRAY_KEY_ID,
                RuleFactory.STORED_VERSION_KEY_ID
            ]);
        } else {
            this.localState = state;
        }
    }

    set grepcProvider(value: GrepcViewProvider) {
        this._grepcProvider = value;
    }

    get rulesCount() {
        return this.rulesArray.length;
    }

    get enabledRulesCount() {
        return this.rulesArray.filter(rule => rule.enabled).length;
    }

    private get rulesMap(): Map<string, Rule> {
        return new Map<string, Rule>(this.getState()?.get<[string, Rule][]>(RuleFactory.RULES_MAP_KEY_ID, []) ?? []);
    }

    private set rulesMap(map: Map<string,Rule> | undefined) {
        this.getState()?.update(RuleFactory.RULES_MAP_KEY_ID, Array.from(map?.entries() ?? []));
    }

    private get rulesArray(): Rule[] {
        return this.getState()?.get<Rule[]>(RuleFactory.RULES_ARRAY_KEY_ID) ?? [];
    }

    private set rulesArray(array: Rule[] | undefined) {
        this.getState()?.update(RuleFactory.RULES_ARRAY_KEY_ID, array);
    }

    private getState() {
        return this._isGlobalState
            ? this.globalState
            : this.localState;
    }

    public getRulesMap(): Map<string, Rule> {
        return this.rulesMap;
    }

    public getRulesArray(): Rule[] {
        const rulesArray = this.rulesArray;
        // Fix with issue #54
        //console.log('getRulesArray() is called. updating $enabledRules');
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
        this._enabledRules.next(rulesArray.filter(rule => rule.enabled));
        this.getState()?.update(RuleFactory.RULES_MAP_KEY_ID, Array.from(rulesMap.entries()));
        this.getState()?.update(RuleFactory.RULES_ARRAY_KEY_ID, rulesArray);
    }

    /**
     * updateRuleWithNoSideEffects - What this means is the rule will be updated <b>WITHOUT</b> triggering an $enableRules cast
     * or without triggering a push to the webview. This is ideally only used when decorations are updated.
     * @param rule 
     */
    public updateRuleWithNoSideEffects(rule: Rule) {
        let newRules = this.rulesMap;
        newRules.set(rule.id, rule);
        // calls setter with logic.
        this.rulesMap = newRules;
        // calls setter with logic
        this.rulesArray = this.rulesArray.map(value => {
            if(value.id === rule.id) {
                return rule;
            }
            return value;
        });

    }

    public removeRule(id: string) {
        this.logger.info('Removing rule with id: ' + id);
        const rulesMap = this.getRulesMap();
        const rule = rulesMap.get(id);
        if(!rule) {
            this.logger.error('Unable to find rule id in rule map to delete: ' + id);
            return;
        }
        rulesMap.delete(id);
        const rulesArray = this.getRulesArray().filter(val => val.id !== rule.id);

        this.updateRules(rulesMap, rulesArray);
    }

    pushOccurrences(rule: Rule, ranges: LineRange[], occurrences: number) {
        rule.lineRanges = ranges;
        rule.occurrences = occurrences;
        this.updateRuleWithNoSideEffects(rule);

        this._grepcProvider?.webview?.postMessage({
            type: 'ruleDecorationUpdate',
            id: rule.id,
            ranges: JSON.stringify(ranges),
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
            let parse = JSON.parse(mapData);
            let rulesMap: Map<string, Rule> = new Map<string, Rule>(parse);
            let rulesArray = JSON.parse(arrayData);
            this.updateRulesLocally(rulesMap, rulesArray);
        }
        catch (e) {
            this.logger.error(`parseRules:: Unable to parse JSON map.`, e, mapData, arrayData);
        }
    };
}

