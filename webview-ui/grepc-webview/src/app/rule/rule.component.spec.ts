import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleComponent } from './rule.component';
import { Rule } from '../../models/rule';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('RuleComponent', () => {
    let component: RuleComponent;
    let fixture: ComponentFixture<RuleComponent>;
    const injectedRule: Rule = new Rule('title');

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RuleComponent, BrowserAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(RuleComponent);
        component = fixture.componentInstance;
        component.rule = injectedRule;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
