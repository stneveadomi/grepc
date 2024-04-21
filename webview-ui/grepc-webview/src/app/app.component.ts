import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RuleComponent } from './rule/rule.component';
import { Rule } from '../models/rule';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RuleService } from '../services/rule.service';
import { AddRuleComponent } from './add-rule/add-rule.component';
import { ExtensionService } from '../services/extension.service';
import { GlobalStylesService } from '../services/global-styles.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RuleComponent, AddRuleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  $rules = this.ruleService.$rules;

  constructor(
    protected ruleService: RuleService,
    protected globalStylesService: GlobalStylesService
  ) {}

  ngOnInit(): void {
      this.ruleService.requestRules();
  }

  @HostListener("window:message", ['$event'])
  onPostMessage(event: MessageEvent) {
    //console.log('Received message event on webview', event);
    if(event?.data?.type === 'rules')  {
      console.log(
        "Post message received: " + event?.data?.type + event?.data?.type 
      );
      this.ruleService.parseRules(event.data?.mapData, event.data?.arrayData);
    }
  }
}
