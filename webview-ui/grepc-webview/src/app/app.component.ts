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
    new Rule('Rule 1'),
    new Rule('Rule 2')
  ];

  logRules() {
    this.rules.forEach(rule => {
      console.log(rule);
    });
  }
}
