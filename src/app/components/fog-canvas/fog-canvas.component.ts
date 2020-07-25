import { Component, AfterViewInit } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { MapSocketService } from '../../map-socket.service';
import { Point, Region } from '../../types';

@Component({
  selector: 'fog-canvas',
  templateUrl: './fog-canvas.component.html',
  styleUrls: ['./fog-canvas.component.scss'],
})
export class FogCanvasComponent extends BaseCanvasComponent {
  localRect: Region = {
    p: {
      x: 0,
      y: 0
    },
    w: 0,
    h: 0
  }
  drawing: boolean = false;

  constructor(public platform: Platform,
    public events: Events,
    public maps: MapSocketService) { 
    super(platform, events, maps);
    this.background = null;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.subscribe("reveal");
  }

  connect() {
    this.events.subscribe("reveal", (region) => {
      this.redraw();
    });
  }

  onMouseDown(p: Point) {
    this.drawing = true;
    this.localRect.p = p;
  }

  generateLocalRect(p: Point) {
    this.localRect.w = p.x - this.localRect.p.x;
    this.localRect.h = p.y - this.localRect.p.y;
  }
  
  onMouseMove(p: Point) {
    if (!this.drawing) { return; }
    this.generateLocalRect(p);
    this.redraw();
  }

  onMouseUp(p: Point) {
    if (!this.drawing) { return; }
    this.generateLocalRect(p);
    if (this.localRect.w < 0){
      this.localRect.p.x += this.localRect.w;
      this.localRect.w = -this.localRect.w;
    }
    if (this.localRect.h < 0) {
      this.localRect.p.y += this.localRect.h;
      this.localRect.h = -this.localRect.h;
    }
    let remaining = this.maps.current.state.regions.filter(
      (region) => {
        let contained = this.localRect.p.x < region.p.x &&
          this.localRect.p.x + this.localRect.w > region.p.x + region.w;
        contained = contained && this.localRect.p.y < region.p.y &&
          this.localRect.p.y + this.localRect.h > region.p.y + region.w;
        return !contained;
      }
    )
    remaining.push(JSON.parse(JSON.stringify(this.localRect)));
    this.maps.current.state.regions = remaining;
    this.redraw();
    this.drawing = false;
    this.maps.emit("reveal", this.maps.current.state.regions);
  }

  clearRegion(r: Region) {
    this.context.clearRect(r.p.x, r.p.y, r.w, r.h);
  }

  redraw() {
    if (!this.visible) return;
    super.redraw();
    if (!this.maps.imageLoaded() || !this.maps.image.complete ) { return; }
    if (!this.maps.ui) {
      this.context.filter = 'blur(30px)';
      this.context.drawImage(this.maps.image, 0, 0);
    } else {
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.filter = '';
      this.context.fillStyle = "#00000088";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.applyTransforms();
    if (this.drawing) {
      this.context.filter = '';
      this.clearRegion(this.localRect);
    }
    this.maps.current.state.regions.forEach(
      (region) => {
        this.clearRegion(region);
      }
    )
  }
}
