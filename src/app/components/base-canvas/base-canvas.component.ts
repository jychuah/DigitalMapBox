import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'base-canvas',
  templateUrl: './base-canvas.component.html'
})
export class BaseCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', {static: false}) canvasEl: ElementRef;
  canvas: any;
  context: any;
  previousCall: number = null;

  constructor(public platform: Platform) { }

  ngAfterViewInit() {
    this.canvas = this.canvasEl.nativeElement;
    this.context = this.canvas.getContext('2d');
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('mouseout', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('mousemove', (e) => this.throttleMouseMove(e), false);
    
    //Touch support for mobile devices
    this.canvas.addEventListener('touchstart', (e) => this.onMouseDown(e), false);
    this.canvas.addEventListener('touchend', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('touchcancel', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('touchmove', (e) => this.throttleMouseMove(e), false);
    this.previousCall = new Date().getTime();
    this.platform.ready().then(
      () => {
        this.onResize();
        this.platform.resize.subscribe(() => {
          this.onResize();
        });
      }
    )
  }

  throttleMouseMove(e) {
    let time = new Date().getTime();
    if ((time - this.previousCall) < 10) { return; }
    this.previousCall = time;
    this.onMouseMove(e);
  }


  onMouseDown(e) {
  }

  onMouseUp(e) {
  }

  onMouseMove(e) {
  }

  // make the canvas fill its parent
  onResize() {
    this.canvas.width = this.platform.width();
    this.canvas.height = this.platform.height();
  }
}
