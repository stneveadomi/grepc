import { Injectable } from '@angular/core';
import { Rule } from '../models/rule';
import { BehaviorSubject, Observable, Subject, share, shareReplay } from 'rxjs';
import { ExtensionService, LogLevel } from './extension.service';
import { LineRange } from '../models/line-range';
import { RuleComponent } from '../app/rule/rule.component';

@Injectable({
  providedIn: 'root'
})
export class RuleService {
  private _ruleMap: Map<string, Rule> = new Map();
  private _rulesArray: Rule[] = [];
  private _rules = new BehaviorSubject<Rule[]>([]);

  private _ruleIdToComponent: Map<string, RuleComponent> = new Map();

  private _isAwaitingRulesResponse: Promise<void> | undefined  = undefined;
  private _isAwaitingRulesResolveReject: {resolve: any, reject: any} | undefined = undefined;

  constructor(
    private extensionService: ExtensionService
  ) { }
  
  public readonly $rules: Observable<Rule[]> = this._rules.asObservable().pipe(shareReplay(1));

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
      this._rules.next(this._rulesArray);
      this._isAwaitingRulesResolveReject?.resolve();
    }
    catch (e) {
      this.extensionService.log(LogLevel.ERROR, `Unable to parse JSON map in pushRules(). ${e}`);
      this._isAwaitingRulesResolveReject?.reject();
    }
    finally {
      if(this._isAwaitingRulesResponse) {
        this.extensionService.log(LogLevel.DEBUG, 'Clearing awaitingRulesResponse');
      }
      this._isAwaitingRulesResponse = undefined;
    }
  }

  /**
   * This pushes all rules to the extension via post message.
   * This also triggers the $rules observable to cast the current set of rules.
   */
  public pushRules() {
    this.extensionService.log(LogLevel.DEBUG, 'RuleService::pushRules _rulesArray = ' + JSON.stringify(this._rulesArray));
    this.extensionService.log(LogLevel.DEBUG, 'Pushing new rules to extension ' + JSON.stringify(Array.from(this._ruleMap.entries())));
    this.pushRulesToExtension();
    this._rules.next(this._rulesArray);
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
    this._clearOccurrenceData();
    this.extensionService.postMessage({
      type: 'rules', 
      mapData: JSON.stringify(Array.from(this._ruleMap.entries())),
      arrayData: JSON.stringify(this._rulesArray)
    });
  }

  /**
   * This is to clear occurance data in the rules array and map.
   * This data does not need to be stored in the backend.
   * Note: This is called by RuleService::pushRulesToExtension()
   */
  private _clearOccurrenceData() {
    this._rulesArray.map(rule =>{ 
      rule.occurrences = 0;
      rule.lineRanges = [];
      return rule;
    });

    this._ruleMap.forEach(rule => {
      if(rule) {
        rule.occurrences = 0;
        rule.lineRanges = [];
      }
    });
  }

  /**
   * This method sends a message event to the extension to request an updated
   * rules map from storage.
   */
  public requestRules() {
    this.extensionService.postMessage({type: 'rulesRequest'});
    this._isAwaitingRulesResponse = new Promise((resolve, reject) => {
      // assign resolve and reject to be called by other members of this class.
      this._isAwaitingRulesResolveReject = {resolve, reject};
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

  /**
   * Update the rule in the current map and array.
   * @param rule rule to be updated by id in the map and array
   */
  public updateRule(rule: Rule) {
    this.extensionService.log(LogLevel.DEBUG, `Updating rule ${rule.title}`);
    this._ruleMap.set(rule.id!, rule);
    this._rulesArray = this._rulesArray.map(value => {
      if(value.id === rule.id) {
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
    this._rulesArray = this._rulesArray.filter(rule => rule.id !== id);
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
    this.extensionService.log(LogLevel.DEBUG, `Swapping positions of rule ${ruleA.title}:${ruleAIndex} and rule ${ruleB.title}:${ruleBIndex}`);
    this._rulesArray[ruleAIndex] = ruleB;
    this._rulesArray[ruleBIndex] = ruleA;
    this._rules.next(this._rulesArray);
  }

  updateDecorations(id: string, ranges: LineRange[], occurrences: number) {
    if(this._isAwaitingRulesResponse) {
      this._isAwaitingRulesResponse.then(_ => {
        this._updateOccurrencesHelper(id, ranges, occurrences);
      })
      .catch((reason) => this.extensionService.log(LogLevel.ERROR, `isAwaitingRulesResponse exception caught. Reason: ${reason}`));
    }
    else {
      this._updateOccurrencesHelper(id, ranges, occurrences);
    }
  }

  private _updateOccurrencesHelper(id: string, ranges: LineRange[], occurrences: number) {
    const rule = this._ruleMap.get(id);
    if(rule) {
      rule.occurrences = occurrences;
      rule.lineRanges = ranges;
      this.updateRule(rule);
      this.pushRulesLocally();
    }
  }

  public jumpToLine(lineRange: LineRange) {
    if(lineRange) {
      this.extensionService.postMessage({
        type: "jumpToLine",
        data: JSON.stringify(lineRange)
      });
    }
  }
}
