import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrencesComponent } from './occurrences.component';
import { Rule } from '../../models/rule';

describe('OccurrencesComponent', () => {
  let component: OccurrencesComponent;
  let fixture: ComponentFixture<OccurrencesComponent>;
  let injectedRule: Rule = new Rule(
    'title'
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OccurrencesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OccurrencesComponent);
    component = fixture.componentInstance;
    component.rule = injectedRule;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
