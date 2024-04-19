import { Injectable } from '@angular/core';
import { Rule } from '../models/rule';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ExtensionService } from './extension.service';

@Injectable({
  providedIn: 'root'
})
export class RuleService {
  private _ruleMap: Map<string, Rule> = new Map();
  private _rules = new BehaviorSubject<Rule[]>([]);

  constructor(
    private extensionService: ExtensionService
  ) {}
  
  public readonly $rules: Observable<Rule[]> = this._rules.asObservable();

  /**
   * This method is intended to be used from the message event to parse data from the extension.
   * This is indirectly triggered from any call to requestRules().
   * @param data string representing an Array.from(Map::entries) that can be converted to Map<string, Rule>
   */
  public parseRules(data: string) {
    try {
      this._ruleMap = new Map(JSON.parse(data));
      this._rules.next(this.getRules());
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
    this._rules.next(this.getRules());
  }

  /**
   * This only pushes the current rules to the extension.
   * This does NOT update the $rules observable.
   * Note: This is called by RuleService::pushRules()
   */
  public pushRulesToExtension() {
    this.extensionService.postMessage({type: 'rules', data: JSON.stringify(Array.from(this._ruleMap.entries()))});
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
   * get the current state of rules in Rule Service
   * @returns Rule[] stored in the Rule Service Map
   */
  public getRules(): Rule[] {
    return Array.from(this._ruleMap.values());
  }

  /**
   * This adds a rule to the local map while triggering $rules update and extension update.
   * @param rule rule to be added
   */
  public addRule(rule: Rule) {
    this._ruleMap.set(rule.id!, rule);
    this.pushRules();
  }

  /**
   * This removes a rule from local map while triggering $rules update and extension update.
   * @param id rule to be removed
   */
  public removeRule(id: string) {
    this._ruleMap.delete(id);
    this.pushRules();
  }

  public updateRule(oldKey: string, rule: Rule) {
    if(this._ruleMap.has(rule.id!)) {
      throw new Error('Collision with rule id:' + rule?.id);
    }

    this._ruleMap.delete(oldKey);
    this._ruleMap.set(rule.id!, rule);
  }
}
