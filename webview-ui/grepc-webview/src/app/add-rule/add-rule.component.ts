import { Component } from '@angular/core';
import { RuleService } from '../../services/rule.service';
import { Rule } from '../../models/rule';

@Component({
  selector: 'app-add-rule',
  standalone: true,
  imports: [],
  templateUrl: './add-rule.component.html',
  styleUrl: './add-rule.component.css'
})
export class AddRuleComponent {

  counter = 0;

  constructor(
    private ruleService: RuleService
  ) {}

  addEmptyRule() {
    console.log('Adding new rule.');
    this.ruleService.addRule(new Rule(`Rule ${this.counter++}`));
  }
}
