import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrenceDisplayComponent } from './occurrence-display.component';

describe('OccurrenceDisplayComponent', () => {
    let component: OccurrenceDisplayComponent;
    let fixture: ComponentFixture<OccurrenceDisplayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OccurrenceDisplayComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(OccurrenceDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
