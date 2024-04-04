import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RuleComponent } from './rule/rule.component';
import { Rule } from '../models/rule';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RuleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  rules: Rule[] = [
    {enabled: true, decorationExpanded: false, expanded: false, id: 'Rule 1', regularExpression: /abc/, backgroundColor: ''},
    {enabled: true, decorationExpanded: false, expanded: false, id: 'Rule 2', regularExpression: /abc/, backgroundColor: ''}
  ];
}
