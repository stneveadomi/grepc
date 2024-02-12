import { Component, Input, OnInit } from '@angular/core';
import {MatExpansionModule} from '@angular/material/expansion';

@Component({
  selector: 'app-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.css'],
  imports: [MatExpansionModule],
  standalone: true
})
export class RowComponent implements OnInit {
  @Input() body: any;
  @Input() header: any;

  constructor() { }

  ngOnInit() {
  }

}
