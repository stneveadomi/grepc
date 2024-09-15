import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    ChildDecorationComponent,
    ChildDecorationType,
} from './child-decoration.component';
import { Rule } from '../../../models/rule';
import { ReactiveFormsModule } from '@angular/forms';

describe('ChildDecorationComponent', () => {
    let component: ChildDecorationComponent;
    let fixture: ComponentFixture<ChildDecorationComponent>;
    const injectedRule: Rule = new Rule('title');

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ChildDecorationComponent,
                BrowserAnimationsModule,
                ReactiveFormsModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChildDecorationComponent);
        component = fixture.componentInstance;
        component.rule = injectedRule;
        component.id = ChildDecorationType.BEFORE;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
