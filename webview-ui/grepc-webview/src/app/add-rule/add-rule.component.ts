import { Component } from '@angular/core';
import { RuleService } from '../../services/rule.service';
import { Rule } from '../../models/rule';
import { LoggerService } from '../../services/logger.service';

@Component({
    selector: 'app-add-rule',
    standalone: true,
    imports: [],
    templateUrl: './add-rule.component.html',
    styleUrl: './add-rule.component.css',
})
export class AddRuleComponent {
    constructor(
        private ruleService: RuleService,
        private logger: LoggerService,
    ) {}

    addEmptyRule() {
        this.logger.info('Creating new empty rule');
        this.ruleService.addRule(new Rule(''));
    }
}
