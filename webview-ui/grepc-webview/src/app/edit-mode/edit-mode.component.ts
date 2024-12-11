import { Component, OnInit } from '@angular/core';
import { RuleService } from '../../services/rule.service';
import { DomSanitizer } from '@angular/platform-browser';
import { decode } from 'html-entities';

@Component({
    selector: 'app-edit-mode',
    imports: [],
    templateUrl: './edit-mode.component.html',
    styleUrl: './edit-mode.component.css',
})
export class EditModeComponent implements OnInit {
    ruleArray = '';
    isValid = true;

    constructor(
        protected ruleService: RuleService,
        private sanitizer: DomSanitizer,
    ) {}

    ngOnInit() {
        this.ruleArray = JSON.stringify(
            this.ruleService.getRuleArray(),
            undefined,
            '    ',
        ).trim();
    }

    onBlur(rules: EventTarget | null) {
        if (rules instanceof HTMLElement) {
            const htmlEvent = rules as HTMLElement;
            if (
                (this.isValid = this.ruleService.areValidRules(
                    htmlEvent.innerHTML,
                ))
            ) {
                this.ruleService.pushNewRuleArray(decode(htmlEvent.innerHTML));
            }
        }
    }
}
