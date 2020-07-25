import { Component, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { Point } from '../../types';

@Component({
  selector: 'base-canvas',
  templateUrl: './base-canvas.component.html'
})
export class BaseCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', {static: false}) canvasEl: ElementRef;
  @Input('visible') visible: boolean = false;
  canvas: any;
  context: any;
  background: string = null;

  constructor(public platform: Platform, 
              public events: Events, 
              public maps: MapSocketService) { }

  ngAfterViewInit() {
    this.initCanvas();
  }

  initCanvas() {
    this.canvas = this.canvasEl.nativeElement;
    this.context = this.canvas.getContext('2d');
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

  subscribe(mouseEvent: string) {
    this.events.subscribe("mouseDown" + mouseEvent, (e) => {
      this.onMouseDown(e);
    });
    this.events.subscribe("mouseUp" + mouseEvent, (e) => {
      this.onMouseUp(e);
    });
    this.events.subscribe("mouseMove" + mouseEvent, (e) => {
      this.onMouseMove(e);
    });
  }

  onMouseDown(e) {
  }

  onMouseUp(e) {
  }

  onMouseMove(e) {
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
