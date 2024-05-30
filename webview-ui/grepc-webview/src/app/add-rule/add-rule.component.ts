import { Component } from '@angular/core';
import { RuleService } from '../../services/rule.service';
import { Rule } from '../../models/rule';
import { ExtensionService, LogLevel } from '../../services/extension.service';

@Component({
  selector: 'app-add-rule',
  standalone: true,
  imports: [],
  templateUrl: './add-rule.component.html',
  styleUrl: './add-rule.component.css'
})
export class AddRuleComponent {
  constructor(
    private ruleService: RuleService,
    private extension: ExtensionService
  ) {}

  addEmptyRule() {
    this.extension.log(LogLevel.INFO, 'Creating new empty rule');
    this.ruleService.addRule(new Rule(''));
  }
}
