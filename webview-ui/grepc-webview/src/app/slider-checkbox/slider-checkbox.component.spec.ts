import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderCheckboxComponent } from './slider-checkbox.component';
import { FormControl, FormControlDirective } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SliderCheckboxComponent', () => {
  let component: SliderCheckboxComponent;
  let fixture: ComponentFixture<SliderCheckboxComponent>;
  let inputControl: FormControl<boolean | null> = new FormControl(false);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderCheckboxComponent, BrowserAnimationsModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SliderCheckboxComponent);
    component = fixture.componentInstance;
    component.control = inputControl;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
