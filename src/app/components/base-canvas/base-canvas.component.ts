import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { Point } from '../../types';

@Component({
  selector: 'base-canvas',
  templateUrl: './base-canvas.component.html'
})
export class BaseCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', {static: false}) canvasEl: ElementRef;
  canvas: any;
  context: any;
  previousCall: number = null;
  background: string = null;

  constructor(public platform: Platform, 
              public events: Events, 
              public maps: MapSocketService) { }

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
    );
    this.connect();
    this.events.subscribe("sync", () => {
      this.redraw();
    });
    this.events.subscribe("redraw", () => {
      this.redraw();
    });
    this.events.subscribe("viewport", () => {
      this.redraw();
    });
  }

  applyTransforms() {
    this.context.setTransform(
      1, 0, 0, 1,
      this.platform.width() / 2,
      this.platform.height() / 2
    )
    this.context.scale(
      this.maps.current.state.viewport.scale, 
      this.maps.current.state.viewport.scale
    )
    this.context.translate(
      -this.maps.current.state.viewport.center.x,
      -this.maps.current.state.viewport.center.y
    );
  }

  getLocalPoint(p: Point) : Point {
    p.x -= this.platform.width() / 2;
    p.y -= this.platform.height() / 2;
    p.x /= this.maps.current.state.viewport.scale;
    p.y /= this.maps.current.state.viewport.scale;
    p.x += this.maps.current.state.viewport.center.x;
    p.y += this.maps.current.state.viewport.center.y;
    return p;
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

  connect() {
  }

  // make the canvas fill its parent
  onResize() {
    this.canvas.width = this.platform.width();
    this.canvas.height = this.platform.height();
    this.redraw();
  }

  redraw() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    if (this.background) {
      this.context.fillStyle = this.background;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.applyTransforms();
  }
}
