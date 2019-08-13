import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'color-select',
  templateUrl: './color-select.component.html',
  styleUrls: ['./color-select.component.scss'],
})
export class ColorSelectComponent implements OnInit {
  @Input() color: string = "#4363d8";
  @Output() select = new EventEmitter<string>();

  picker: boolean = false;
  swatches: string[] = [
    "#ffffff",
    "#ffd8b1",
    "#fffac8",
    "#aaffc3",
    "#46f0f0",
    "#4363d8",
    "#911eb4",
    "#808080",
    "#000000"
  ]

  constructor() { }

  ngOnInit() {}

  togglePicker() {
    this.picker = !this.picker;
  }

  selectSwatch(swatch) {
    this.color = swatch;
    this.select.emit(swatch);
    this.picker = false;
  }



}
