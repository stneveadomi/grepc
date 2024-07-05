import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RuleComponent } from './rule/rule.component';
import { Rule } from '../models/rule';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RuleService } from '../services/rule.service';
import { AddRuleComponent } from './add-rule/add-rule.component';
import { ExtensionService } from '../services/extension.service';
import { GlobalStylesService } from '../services/global-styles.service';
import { DragService } from '../services/drag.service';
import { LoggerService } from '../services/logger.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RuleComponent, AddRuleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  $rules = this.ruleService.$rules;
  _location: string | undefined = undefined;

  @ViewChild('dropOverlay')
  dropOverlay: ElementRef | undefined;

  constructor(
    protected ruleService: RuleService,
    protected extension: ExtensionService,
    protected globalStylesService: GlobalStylesService,
    protected dragService: DragService,
    protected logger: LoggerService
  ) { }

  get location(): string | undefined {
    return this._location;
  }

  set location(location: string) {
    this._location = location;
    this.dragService.location = location;
  }

  showDropOverlay() {
    return this.dragService.showDropOverlay();
  }

  ngOnInit(): void {
    this.ruleService.requestRules();
  }

  ngAfterViewInit() {
    this.dragService.addEventListeners();
  }

  ngOnDestroy(): void {
    this.dragService.removeEventListeners();
  }

  @HostListener("window:message", ['$event'])
  onPostMessage(event: MessageEvent) {
    switch(event?.data?.type) {
      case 'addRule':
        let rule = new Rule((<string> event?.data?.title).toUpperCase());
        rule.regularExpression = event?.data?.regEx ?? '';
        if(rule.regularExpression) {
          rule.enabled = true;
        }
        rule.backgroundColor = event?.data?.bgColor ?? '';
        this.ruleService.addRule(rule);
        break;
      case 'rules':
        this.location = event.data?.originLocation;
        this.extension.location = this.location;
        this.logger.location = event.data?.originLocation;
        this.ruleService.parseRules(event.data?.mapData, event.data?.arrayData);
        break;
      case 'ruleDecorationUpdate':
        const id = event?.data?.id;
        const ranges = event?.data?.ranges;
        const occurences = event?.data?.occurrences;
        this.ruleService.updateDecorations(id, JSON.parse(ranges), occurences);
        break;
      case 'dragstart':
        this.dragService.dragOriginLocation = event?.data?.originLocation;
        break;
      case 'dragend':
        this.dragService.dragOriginLocation = undefined;
        break;
    }
  }
}
