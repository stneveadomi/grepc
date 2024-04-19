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
  ) {

  }
  
  public readonly $rules: Observable<Rule[]> = this._rules.asObservable();

  parseRules(data: string) {
    try {
      this._ruleMap = new Map(JSON.parse(data));
      this._rules.next(this.getRules());
    }
    catch (e) {
      console.error(`Unable to parse JSON map in pushRules().`, e);
    }
  }

  pushRules() {
    console.log('Pushing new rules to extension', JSON.stringify(Array.from(this._ruleMap.entries())));

    this.extensionService.postMessage({type: 'rules', data: JSON.stringify(Array.from(this._ruleMap.entries()))});
    this._rules.next(this.getRules());
  }

  requestRules() {
    console.log('Requesting rules from extension');
    this.extensionService.postMessage({type: 'rulesRequest'});
  }

  public getRules(): Rule[] {
    return Array.from(this._ruleMap.values());
  }

  public addRule(rule: Rule) {
    this._ruleMap.set(rule.id, rule);
    this.pushRules();
  }

  public updateRules(rules: Map<string, Rule>) {
    //todo: 
  }

  public removeRule(id: string) {
    this._ruleMap.delete(id);
    this.pushRules();
  }
}
