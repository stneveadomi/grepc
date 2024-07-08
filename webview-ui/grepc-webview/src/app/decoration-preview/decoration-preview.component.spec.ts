import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecorationPreviewComponent } from './decoration-preview.component';
import { Rule } from '../../models/rule';

describe('DecorationPreviewComponent', () => {
    let component: DecorationPreviewComponent;
    let fixture: ComponentFixture<DecorationPreviewComponent>;
    const injectedRule: Rule = new Rule('title');

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DecorationPreviewComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(DecorationPreviewComponent);
        component = fixture.componentInstance;
        component.rule = injectedRule;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
