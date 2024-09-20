import { Component, OnInit } from '@angular/core';
import { RuleService } from '../../services/rule.service';

@Component({
    selector: 'app-edit-mode',
    standalone: true,
    imports: [],
    templateUrl: './edit-mode.component.html',
    styleUrl: './edit-mode.component.css',
})
export class EditModeComponent implements OnInit {
    ruleArray = '';

    constructor(protected ruleService: RuleService) {}

    ngOnInit() {
        this.ruleArray = JSON.stringify(
            this.ruleService.getRuleArray(),
            undefined,
            '    ',
        );
    }

    onBlur(rules: EventTarget | null) {
        if (rules instanceof HTMLElement) {
            const htmlEvent = rules as HTMLElement;
            if (this.ruleService.areValidRules(htmlEvent.innerHTML)) {
                this.ruleService.pushNewRuleArray(htmlEvent.innerHTML);
            }
        }
    }
}
