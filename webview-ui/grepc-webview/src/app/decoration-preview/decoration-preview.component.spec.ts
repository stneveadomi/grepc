import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecorationPreviewComponent } from './decoration-preview.component';

describe('DecorationPreviewComponent', () => {
  let component: DecorationPreviewComponent;
  let fixture: ComponentFixture<DecorationPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecorationPreviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DecorationPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
