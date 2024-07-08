import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrencesComponent } from './occurrences.component';
import { OccurrenceData, Rule } from '../../models/rule';

describe('OccurrencesComponent', () => {
    let component: OccurrencesComponent;
    let fixture: ComponentFixture<OccurrencesComponent>;
    const injectedRule: Rule = new Rule('title');
    const injectedOccurrenceData = new OccurrenceData();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OccurrencesComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(OccurrencesComponent);
        component = fixture.componentInstance;
        component.rule = injectedRule;
        component.occurrenceData = injectedOccurrenceData;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
