import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderCheckboxComponent } from './slider-checkbox.component';
import { FormControl } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SliderCheckboxComponent', () => {
    let component: SliderCheckboxComponent;
    let fixture: ComponentFixture<SliderCheckboxComponent>;
    const inputControl = new FormControl<boolean | null>(false);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SliderCheckboxComponent, BrowserAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(SliderCheckboxComponent);
        component = fixture.componentInstance;
        component.control = inputControl;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
