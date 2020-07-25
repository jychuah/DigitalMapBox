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
  @Input('group') group: string = "";
  @Input('id') id: string = "";
  canvas: any;
  context: any;
  background: string = null;
  visible: boolean = false;
  previousCall: number = null;
  
  constructor(public platform: Platform, 
              public events: Events, 
              public maps: MapSocketService) { }

  ngAfterViewInit() {
    this.initCanvas();
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
    this.events.subscribe("group", (event) => {
      let thisGroup: boolean = this.group === event.group;
      if (event.type === "visibility") {
        this.visible = thisGroup;
      }
      if (this.visible) {
        this.redraw();
      }

      if (!thisGroup) return;
    });
  }

  getLocalPoint(e) : Point {
    let p = {
      x: 0,
      y: 0
    }
    if ("clientX" in e) {
      p.x = e.clientX;
      p.y = e.clientY;
    } else if (e.touches[0]) {
      p.x = e.touches[0].clientX;
      p.y = e.touches[0].clientY;
    } else if (e.changedTouches[0]) {
      p.x = e.changedTouches[0].clientX;
      p.y = e.changedTouches[0].clientY;
    }
    p.x -= this.platform.width() / 2;
    p.y -= this.platform.height() / 2;
    let camera = this.maps.localCameras[this.group];
    p.x /= camera.scale;
    p.y /= camera.scale;
    p.x += camera.x;
    p.y += camera.y;
    return p;
  }

  throttleMouseMove(e) {
    let time = new Date().getTime();
    if ((time - this.previousCall) < 10) { return; }
    this.previousCall = time;
    this.onMouseMove(e);
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
    let camera = this.maps.localCameras[this.group];
    this.context.scale(
      camera.scale, 
      camera.scale
    )
    this.context.translate(
      -camera.center.x,
      -camera.center.y
    );
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
    if (!this.visible) return;
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
