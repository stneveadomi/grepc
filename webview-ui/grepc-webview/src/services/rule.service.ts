import { Injectable } from '@angular/core';
import { OccurrenceData, Rule } from '../models/rule';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { ExtensionService } from './extension.service';
import { LineRange as OccurrenceLineData } from '../models/line-range';
import { RuleComponent } from '../app/rule/rule.component';
import { LoggerService } from './logger.service';

@Injectable({
    providedIn: 'root',
})
export class RuleService {
    private _ruleMap = new Map<string, Rule>();
    private _rulesArray: Rule[] = [];
    private _rules = new BehaviorSubject<Rule[]>([]);

    private _ruleIdToComponent = new Map<string, RuleComponent>();

    private _isAwaitingRulesResponse: Promise<void> | undefined = undefined;

    private _isAwaitingRulesResolveReject: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { resolve: any; reject: any } | undefined = undefined;

    constructor(
        private extensionService: ExtensionService,
        private logger: LoggerService,
    ) {}

    public readonly $rules: Observable<Rule[]> = this._rules
        .asObservable()
        .pipe(shareReplay(1));

    public register(id: string, ruleComp: RuleComponent) {
        this._ruleIdToComponent.set(id, ruleComp);
    }

    public deregister(id: string) {
        this._ruleIdToComponent.delete(id);
    }

    /**
     * This method is intended to be used from the message event to parse data from the extension.
     * This is indirectly triggered from any call to requestRules().
     * @param data string representing an Array.from(Map::entries) that can be converted to Map<string, Rule>
     */
    public parseRules(mapData: string, arrayData: string) {
        try {
            this._ruleMap = new Map(JSON.parse(mapData));
            this._rulesArray = JSON.parse(arrayData);
            this.logger.debug(
                'overwriting rule state from extension: ruleMap ' +
                    this._ruleMap.size +
                    ' ruleArray ' +
                    this._rulesArray.length,
            );
            if (this._ruleMap.size !== this._rulesArray.length) {
                const str = `Rule Incoherency: rule map size: ${this._ruleMap.size} - rule array size: ${this._rulesArray.length}`;
                this.logger.error(str);
                throw new Error(str);
            }

            this._rules.next(this._rulesArray);
            this._isAwaitingRulesResolveReject?.resolve();
        } catch (e) {
            this.logger.error(`Unable to parse JSON map in pushRules(). ${e}`);
            this._isAwaitingRulesResolveReject?.reject();
        } finally {
            if (this._isAwaitingRulesResponse) {
                this.logger.debug('Clearing awaitingRulesResponse');
            }
            this._isAwaitingRulesResponse = undefined;
        }
    }

    /**
     * This pushes all rules to the extension via post message.
     * This also triggers the $rules observable to cast the current set of rules.
     */
    public pushRules() {
        this.logger.debug(
            'RuleService::pushRules _rulesArray = ' +
                JSON.stringify(this._rulesArray),
        );
        this.logger.debug(
            'Pushing new rules to extension ' +
                JSON.stringify(Array.from(this._ruleMap.entries())),
        );
        this.pushRulesToExtension();
        this.pushRulesLocally();
    }

    public pushRulesLocally() {
        this._rules.next(this._rulesArray);
    }

    /**
     * This only pushes the current rules to the extension.
     * This does NOT update the $rules observable.
     * Note: This is called by RuleService::pushRules()
     */
    public pushRulesToExtension() {
        this.logger.debug('pushing rule state to extension.');
        this.extensionService.postMessage({
            type: 'rules',
            mapData: JSON.stringify(Array.from(this._ruleMap.entries())),
            arrayData: JSON.stringify(this._rulesArray),
        });
    }

    /**
     * This method sends a message event to the extension to request an updated
     * rules map from storage.
     */
    public requestRules() {
        this.extensionService.postMessage({ type: 'rulesRequest' });
        this._isAwaitingRulesResponse = new Promise((resolve, reject) => {
            // assign resolve and reject to be called by other members of this class.
            this._isAwaitingRulesResolveReject = { resolve, reject };
        });
    }

    /**
     * This adds a rule to the local map while triggering $rules update and extension update.
     * @param rule rule to be added
     */
    public addRule(rule: Rule) {
        this._ruleMap.set(rule.id!, rule);
        this._rulesArray.push(rule);
        this.pushRules();
    }

    public getRuleArray() {
        return this._rulesArray;
    }

    public getRule(id: string): Rule | undefined {
        return this._ruleMap.get(id);
    }

    areValidRules(innerHTML: string): boolean {
        try {
            JSON.parse(innerHTML) as Rule[];
            return true;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
            return false;
        }
    }

    pushNewRuleArray(innerHTML: string) {
        const ruleArray = JSON.parse(innerHTML) as Rule[];
        const ruleMap = new Map<string, Rule>();
        for (const rule of ruleArray) {
            ruleMap.set(rule.id, rule);
        }

        this._rulesArray = ruleArray;
        this._ruleMap = ruleMap;
        this.pushRules();
    }

    /**
     * Update the rule in the current map and array.
     * @param rule rule to be updated by id in the map and array
     */
    public updateRule(rule: Rule) {
        this.logger.debug(`Updating rule ${rule.title}`);
        this._ruleMap.set(rule.id!, rule);
        this._rulesArray = this._rulesArray.map((value) => {
            if (value.id === rule.id) {
                return rule;
            }
            return value;
        });
    }

    /**
     * This removes a rule from local map while triggering $rules update and extension update.
     * @param id rule to be removed
     */
    public removeRule(id: string) {
        this._ruleMap.delete(id);
        this._rulesArray = this._rulesArray.filter((rule) => rule.id !== id);
        this._rules.next(this._rulesArray);
    }

    /**
     * Given two rules, swap the positions of the rules in the ruleArray.
     * This assumes ruleA and ruleB are in the rulesArray.
     * @param ruleA
     * @param ruleB
     */
    public swapPositions(ruleA: Rule, ruleB: Rule) {
        const ruleAIndex = this._rulesArray.indexOf(ruleA);
        const ruleBIndex = this._rulesArray.indexOf(ruleB);
        this.logger.debug(
            `Swapping positions of rule ${ruleA.title}:${ruleAIndex} and rule ${ruleB.title}:${ruleBIndex}`,
        );

        this._rulesArray[ruleAIndex] = ruleB;
        this._rulesArray[ruleBIndex] = ruleA;
        this.pushRules();
    }

    updateOccurrenceLineData(id: string, ranges: OccurrenceLineData[]) {
        // this.logger.debug(
        //     `updateOccurrenceData: rule ${id} - occurrences - ${occurrences} `,
        // );
        // TODO: Review occurrence update and usage of isAwaitingRulesResponse

        if (this._isAwaitingRulesResponse) {
            this._isAwaitingRulesResponse
                .then(() => {
                    this._updateOccurrenceLineData(id, ranges);
                })
                .catch((reason) =>
                    this.logger.error(
                        `isAwaitingRulesResponse exception caught. Reason: ${reason}`,
                    ),
                );
        } else {
            this._updateOccurrenceLineData(id, ranges);
        }
    }

    private _updateOccurrenceLineData(
        id: string,
        ranges: OccurrenceLineData[],
    ) {
        const ruleComponent = this._ruleIdToComponent.get(id);
        if (ruleComponent) {
            ruleComponent.occurrenceData = new OccurrenceData(
                ranges.length,
                ranges,
            );
        }
    }

    setOnlyOccurrenceCount(id: string, count: number) {
        const ruleComponent = this._ruleIdToComponent.get(id);
        if (ruleComponent) {
            ruleComponent.occurrenceData = new OccurrenceData(count);
        }
    }

    public jumpToLine(lineRange: OccurrenceLineData) {
        if (lineRange) {
            this.extensionService.postMessage({
                type: 'jumpToLine',
                data: JSON.stringify(lineRange),
            });
        }
    }
}
