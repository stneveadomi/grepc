import * as vscode from 'vscode';
import { GlobalState } from '../utilities/types';
import { Rule } from './rule';
import { Observable, Subject, shareReplay } from 'rxjs';
import { GrepcViewProvider } from '../viewProviders/grepcViewProvider';
import { LocationState, reverseMap } from './locationState';
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
    /**
     * locked serves as pseudo mutual exclusion lock to prevent race conditions when we are updating rule state.
     * This hopefully serves to prevent any strange behavior.
     */
    public locked = false;

    constructor(
        state: vscode.Memento | GlobalState,
        isGlobalState: boolean,
        public readonly location: LocationState,
        private readonly logger: vscode.LogOutputChannel,
    ) {
        this._isGlobalState = isGlobalState;
        if (isGlobalState) {
            this.globalState = <GlobalState>state;
            this.globalState.setKeysForSync([RuleFactory.RULES_MAP_KEY_ID, RuleFactory.RULES_ARRAY_KEY_ID, RuleFactory.STORED_VERSION_KEY_ID]);
        } else {
            this.localState = state;
        }
    }

    set grepcProvider(value: GrepcViewProvider) {
        this._grepcProvider = value;
    }

    get rulesCount() {
        return this.getRulesArray().length;
    }

    get enabledRulesCount() {
        return this.getRulesArray().filter((rule) => rule.enabled).length;
    }

    /**
     * Async overwrite rules map into storage.
     * @param map
     */
    private async setRulesMap(map: Map<string, Rule> | undefined) {
        this.logger.trace(`[EXT] [${reverseMap(this.location)}] setting rule map of size: ${map?.size}`);
        await this.getState()?.update(RuleFactory.RULES_MAP_KEY_ID, Array.from(map?.entries() ?? []));
    }

    /**
     * Async overwrite rules array into storage.
     * @param array
     */
    private async setRulesArray(array: Rule[] | undefined) {
        this.logger.trace(`[EXT] [${reverseMap(this.location)}] setting rule array of size: ${array?.length}`);
        await this.getState()?.update(RuleFactory.RULES_ARRAY_KEY_ID, array);
    }

    private getState() {
        return this._isGlobalState ? this.globalState : this.localState;
    }

    public getRulesMap(): Map<string, Rule> {
        const map = new Map<string, Rule>(this.getState()?.get<[string, Rule][]>(RuleFactory.RULES_MAP_KEY_ID, []) ?? []);
        this.cleanOccurrenceData(...map.values());
        return map;
    }

    public getRulesArray(): Rule[] {
        const array = this.getState()?.get<Rule[]>(RuleFactory.RULES_ARRAY_KEY_ID) ?? [];
        this.cleanOccurrenceData(...array);
        return array;
    }

    public getRule(id: string) {
        return this.getRulesMap().get(id);
    }

    public getEnabledRules() {
        const enabledRules = [];
        for (const rule of this.getRulesArray()) {
            if (rule.enabled) {
                enabledRules.push(rule);
            }
        }

        return enabledRules;
    }

    public getEnabledRuleIdSet() {
        const enabledSet = new Set();
        for (const rule of this.getRulesArray()) {
            if (rule.enabled) enabledSet.add(rule.id);
        }

        return enabledSet;
    }

    hasRule(ruleId: string) {
        return this.getRulesMap().has(ruleId);
    }

    /**
     * This method is here for backwards compatibility.
     * @param rules
     */
    private cleanOccurrenceData(...rules: Rule[]) {
        for (const rule of rules) {
            if (Object.hasOwn(rule, 'occurrences')) {
                this.logger.info(`[EXT] [${reverseMap(this.location)}] Deleting property 'occurrences' from rule ID: ${rule.id}.`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                delete (rule as any).occurrences;
            }
            if (Object.hasOwn(rule, 'lineRanges')) {
                this.logger.info(`[EXT] [${reverseMap(this.location)}] Deleting property 'lineRanges' from rule ID: ${rule.id}.`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                delete (rule as any).lineRanges;
            }
        }
    }

    async disableRules() {
        const rulesArray = this.getRulesArray().map((value) => {
            value.enabled = false;
            return value;
        });
        const rulesMap = this.getRulesMap();
        const newRulesMap = new Map();
        rulesMap.forEach((value, key) => {
            value.enabled = false;
            newRulesMap.set(key, value);
        });
        await this.updateRules(newRulesMap, rulesArray);
    }

    async enableRules() {
        const rulesArray = this.getRulesArray().map((value) => {
            value.enabled = true;
            return value;
        });
        const rulesMap = this.getRulesMap();
        const newRulesMap = new Map();
        rulesMap.forEach((value, key) => {
            value.enabled = true;
            newRulesMap.set(key, value);
        });
        await this.updateRules(newRulesMap, rulesArray);
    }

    /**
     * Adds an existing rule to the current rule factory.
     *
     * This method will recastEnabledRules.
     *
     * Throws exception if id already exists within factory.
     * @param rule
     */
    public async addRule(rule: Rule) {
        this.logger.info(`[EXT] [${reverseMap(this.location)}] Adding rule of ID ${rule.id}`);
        const rulesMap = this.getRulesMap();
        if (rulesMap.has(rule.id)) {
            throw Error(`Rule ID: ${rule.id} cannot be added to rule factory due to conflict.`);
        }

        rulesMap.set(rule.id, rule);
        const rulesArray = this.getRulesArray();
        rulesArray.push(rule);
        await this.updateRules(rulesMap, rulesArray);
    }

    /**
     * updateRules will push the arguments into the VS Code storage and recast the enabled rules.
     *
     * ** Warning: This will push the rules to webview **
     * ** Warning: This will overwrite the stored rules **
     * @param rulesMap
     * @param rulesArray
     */
    public async updateRules(rulesMap: Map<string, Rule>, rulesArray: Rule[]) {
        this.logger.debug(
            `[EXT] [${reverseMap(this.location)}] updateRules: overwrite stored rules and pushing rule to webview. ${rulesMap.size} ${rulesArray.length}`,
        );
        if (rulesMap.size !== rulesArray.length) {
            this.logger.error(`[EXT] [${reverseMap(this.location)}] rulesMap ${rulesMap.size} does not match rulesArray ${rulesArray.length}`);
        }
        await this.setRulesMap(rulesMap);
        await this.setRulesArray(rulesArray);
        this.recastEnabledRules();
        this._grepcProvider?.pushRules();
    }
    /**
     * This method will purely only update the states without pushing the states to the webview.
     * @param rulesMap
     * @param rulesArray
     */
    public async updateRulesLocally(rulesMap: Map<string, Rule>, rulesArray: Rule[]) {
        this.logger.debug(`[EXT] [${reverseMap(this.location)}] updateRulesLocally: overwrite stored rules. ${rulesMap.size} ${rulesArray.length}`);
        if (rulesMap.size !== rulesArray.length) {
            this.logger.error(`[EXT] [${reverseMap(this.location)}] rulesMap ${rulesMap.size} does not match rulesArray ${rulesArray.length}`);
        }
        await this.setRulesMap(rulesMap);
        await this.setRulesArray(rulesArray);
        this.recastEnabledRules();
    }

    /**
     * updateRuleWithNoSideEffects - What this means is the rule will be updated <b>WITHOUT</b> triggering an $enableRules cast
     * or without triggering a push to the webview. This is ideally only used when decorations are updated.
     * @param rule
     */
    public async updateRuleWithNoSideEffects(rule: Rule) {
        this.logger.debug(`[EXT] [${reverseMap(this.location)}] updateRuleWithNoSideEffects: overwrite stored rule ${rule.id}`);

        const newRules = this.getRulesMap();
        newRules.set(rule.id, rule);
        // calls setter with logic.
        await this.setRulesMap(newRules);
        // calls setter with logic
        await this.setRulesArray(
            this.getRulesArray().map((value) => {
                if (value.id === rule.id) {
                    return rule;
                }
                return value;
            }),
        );
    }

    /**
     * This will take each rule and set all drop down toggles to closed.
     */
    public async minimizeAll() {
        const rulesArray = this.getRulesArray().map((rule) => {
            rule.expanded = false;
            rule.decorationExpanded = false;
            rule.occurrencesExpanded = false;
            return rule;
        });
        const rulesMap = this.getRulesMap();
        const newRulesMap = new Map();
        rulesMap.forEach((value, key) => {
            value.expanded = false;
            value.decorationExpanded = false;
            value.occurrencesExpanded = false;
            newRulesMap.set(key, value);
        });
        this.updateRules(newRulesMap, rulesArray);
    }

    public async removeRule(id: string) {
        this.logger.info(`[EXT] [${reverseMap(this.location)}] Removing rule with ID: ${id}`);
        const rulesMap = this.getRulesMap();
        const rule = rulesMap.get(id);
        if (!rule) {
            this.logger.error(`[EXT] [${reverseMap(this.location)}] Unable to find rule id in rule map to delete: ${id}`);
            return;
        }

        if (!rulesMap.delete(id)) {
            throw new Error(`RulesMap: cannot find ID ${id} to delete.`);
        }

        const rulesArray = this.getRulesArray().filter((val) => val.id !== rule.id);

        this.logger.debug(`[EXT] [${reverseMap(this.location)}] Rules after removal: map ${rulesMap.size} array ${rulesArray.length}`);
        await this.updateRules(rulesMap, rulesArray);
    }

    /**
     * Will attempt to push occurrences. If webview is not available (tab closed), it will no-op.
     * @param ruleId
     * @param ranges
     */
    pushOccurrenceLineData(ruleId: string, ranges: LineRange[]) {
        if (!this._grepcProvider?.webview) {
            this.logger.debug(`[RF] [${reverseMap(this.location)}] Unable to push occurrences as grepc provider webview is undefined.`);
            return;
        }
        this._grepcProvider?.webview?.postMessage({
            type: 'occurrenceLineDataUpdate',
            id: ruleId,
            ranges: JSON.stringify(ranges),
        });
    }

    pushOccurrenceCount(ruleId: string, count: number) {
        if (!this._grepcProvider?.webview) {
            this.logger.debug(`[RF] [${reverseMap(this.location)}] Unable to push occurrences as grepc provider webview is undefined.`);
            return;
        }
        this._grepcProvider?.webview?.postMessage({
            type: 'occurrenceCountUpdate',
            id: ruleId,
            count,
        });
    }

    /**
     * recast the current enabled rules for use in triggerUpdateDecorations.
     * For more info, see DecorationTypeManager::enableDecorationDetection
     */
    recastEnabledRules() {
        this._enabledRules.next(this.getRulesArray().filter((rule) => rule.enabled));
    }

    parseRules(mapData: string, arrayData: string) {
        this.logger.debug(`[EXT] [${reverseMap(this.location)}] Parsing rules.`);
        if (this.locked) {
            this.logger.debug(`[EXT] [${reverseMap(this.location)}] Unable to parse rules as rule factory is locked. Try again later :)`);
            return;
        }

        try {
            const rulesMap: Map<string, Rule> = new Map<string, Rule>(JSON.parse(mapData));
            const rulesArray = JSON.parse(arrayData);
            if (rulesMap.size !== rulesArray.length) {
                this.logger.error(`[EXT] [${reverseMap(this.location)}] Rules map and array are incoherent. Throwing error.`);
            }
            this.updateRulesLocally(rulesMap, rulesArray);
        } catch (e) {
            this.logger.error(`[EXT] [${reverseMap(this.location)}] parseRules(): Unable to parse JSON map.`, e, mapData, arrayData);
        }
    }
}
