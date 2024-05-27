import { Injectable } from '@angular/core';
import { Rule } from '../models/rule';
import { BehaviorSubject, Observable, Subject, share, shareReplay } from 'rxjs';
import { ExtensionService } from './extension.service';
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
      console.log('RuleService::parseRules -> ', mapData, arrayData);
      this._ruleMap = new Map(JSON.parse(mapData));
      this._rulesArray = JSON.parse(arrayData);
      this._rules.next(this._rulesArray);
      console.log('Attempting to resolve promise.')
      this._isAwaitingRulesResolveReject?.resolve();
    }
    catch (e) {
      console.error(`Unable to parse JSON map in pushRules().`, e);
      console.log('Attempting to reject promise');
      this._isAwaitingRulesResolveReject?.reject();
    }
    finally {
      if(this._isAwaitingRulesResponse) {
        console.log('Clearing awaitingRulesResponse');
      }
      this._isAwaitingRulesResponse = undefined;
    }
  }

  /**
   * This pushes all rules to the extension via post message.
   * This also triggers the $rules observable to cast the current set of rules.
   */
  public pushRules() {
    console.log('RuleService::pushRules _rulesArray =', JSON.stringify(this._rulesArray));
    console.log('Pushing new rules to extension', JSON.stringify(Array.from(this._ruleMap.entries())));
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
    console.log('pushing rules to extension');
    this.extensionService.postMessage({
      type: 'rules', 
      mapData: JSON.stringify(Array.from(this._ruleMap.entries())),
      arrayData: JSON.stringify(this._rulesArray)
    });
  }

  /**
   * This method sends a message event to the extension to request an updated
   * rules map from storage.
   */
  public requestRules() {
    console.log('Requesting rules from extension');
    this.extensionService.postMessage({type: 'rulesRequest'});
    console.log('Creating promise for awaiting rules response');
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
    this._ruleMap.set(rule.id!, rule);
    this._rulesArray = this._rulesArray.map(value => {
      if(value.id === rule.id) {
        return rule;
      }
      return value;
    });
    console.log('updateRule this._rulesArray ', this._rulesArray);
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
    console.log('Rules array before swap', JSON.stringify(this._rulesArray));
    this._rulesArray[ruleAIndex] = ruleB;
    this._rulesArray[ruleBIndex] = ruleA;
    console.log('Rules array after swap', JSON.stringify(this._rulesArray));
    this._rules.next(this._rulesArray);
  }

  updateDecorations(id: string, ranges: LineRange[], occurrences: number) {
    console.log('updating decorations on rule id:' + id, occurrences);
    if(this._isAwaitingRulesResponse) {
      console.log('Waiting for rules response to apply occurrences');
      this._isAwaitingRulesResponse.then(_ => {
        this._updateOccurrencesHelper(id, ranges, occurrences);
      })
      .catch(console.error);
    }
    else {
      console.log('No rules response promise. Applying occurrences');
      this._updateOccurrencesHelper(id, ranges, occurrences);
    }
  }

  private _updateOccurrencesHelper(id: string, ranges: LineRange[], occurrences: number) {
    const rule = this._ruleMap.get(id);
    if(rule) {
      rule.occurrences = occurrences;
      rule.lineRanges = ranges;
      console.log('rule.service updateOccurrences update rule', JSON.stringify(rule));
      this.updateRule(rule);
      this.pushRulesLocally();
    }
  }

  public jumpToLine(lineRange: LineRange) {
    if(lineRange) {
      console.log('jumping to line', lineRange);
      this.extensionService.postMessage({
        type: "jumpToLine",
        data: JSON.stringify(lineRange)
      });
    }
  }
}
