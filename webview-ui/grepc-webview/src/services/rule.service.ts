import { Injectable } from '@angular/core';
import { Rule } from '../models/rule';
import { BehaviorSubject, Observable, Subject, share, shareReplay } from 'rxjs';
import { ExtensionService } from './extension.service';

@Injectable({
  providedIn: 'root'
})
export class RuleService {
  private _ruleMap: Map<string, Rule> = new Map();
  private _rulesArray: Rule[] = [];
  private _rules = new BehaviorSubject<Rule[]>([]);


  constructor(
    private extensionService: ExtensionService
  ) { }
  
  public readonly $rules: Observable<Rule[]> = this._rules.asObservable().pipe(shareReplay(1));

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
    }
    catch (e) {
      console.error(`Unable to parse JSON map in pushRules().`, e);
    }
  }

  /**
   * This pushes all rules to the extension via post message.
   * This also triggers the $rules observable to cast the current set of rules.
   */
  public pushRules() {
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

  public updateTitle(oldKey: string, newKey: string, rule: Rule) {
    this._ruleMap.delete(oldKey);
    rule.id = newKey;
    this._ruleMap.set(newKey, rule);
    this._rulesArray = this._rulesArray.map(curRule => {
      if(curRule.id === oldKey) {
        curRule.id = rule.id;
      }
      return curRule;
    });
    console.log("updateTitle - updated rules array", this._rulesArray);
  }

  updateOccurrences(id: any, occurrences: any) {
    console.log('updating occurrences on rule id:' + id, occurrences);
    const rule = this._ruleMap.get(id);
    if(rule) {
      rule.occurrences = occurrences;
      this.updateRule(rule);
      this.pushRulesLocally();
    }
  }
}
