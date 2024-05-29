import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RuleComponent } from './rule/rule.component';
import { Rule } from '../models/rule';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RuleService } from '../services/rule.service';
import { AddRuleComponent } from './add-rule/add-rule.component';
import { ExtensionService } from '../services/extension.service';
import { GlobalStylesService } from '../services/global-styles.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RuleComponent, AddRuleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  $rules = this.ruleService.$rules;

  constructor(
    protected ruleService: RuleService,
    protected globalStylesService: GlobalStylesService
  ) {}

  ngOnInit(): void {
    this.ruleService.requestRules();
  }

  @HostListener("window:message", ['$event'])
  onPostMessage(event: MessageEvent) {
    switch(event?.data?.type) {
      case 'addRule':
        let rule = new Rule((<string> event?.data?.title).toUpperCase());
        rule.regularExpression = event?.data?.regEx ?? '';
        if(rule.regularExpression) {
          rule.enabled = true;
        }
        rule.backgroundColor = event?.data?.bgColor ?? '';
        this.ruleService.addRule(rule);
        break;
      case 'rules':
        this.ruleService.parseRules(event.data?.mapData, event.data?.arrayData);
        break;
      case 'ruleDecorationUpdate':
        const id = event?.data?.id;
        const ranges = event?.data?.ranges;
        const occurences = event?.data?.occurrences;
        this.ruleService.updateDecorations(id, JSON.parse(ranges), occurences);
    }
  }
}
