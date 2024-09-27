import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditModeComponent } from './edit-mode.component';

describe('EditModeComponent', () => {
    let component: EditModeComponent;
    let fixture: ComponentFixture<EditModeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditModeComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditModeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
