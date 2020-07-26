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
  constructor(public platform: Platform,
    public events: Events,
    public maps: MapSocketService) { 
    super(platform, events, maps);
    this.background = null;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  connect() {
    this.events.subscribe("region", (region) => {
      this.drawRegion(region);
    });
    this.events.subscribe("hideregion", (region) => {
      this.redraw();
    });
  }

  clearRegion(r: Region) {
    this.context.clearRect(r.p.x, r.p.y, r.w, r.h);
  }

  drawRegion(r: Region) {
    if (r.revealed) {
      this.clearRegion(r);
    }
  }

  drawMapFill() {
    if (!this.maps.imageLoaded() || !this.maps.image.complete ) { return; }
    this.context.filter = 'blur(30px)';
    this.context.drawImage(this.maps.image, 0, 0);
    this.context.filter = '';
  }

  redraw() {
    if (!this.visible) return;
    super.redraw();
    this.drawMapFill();    
    this.maps.server.regions.forEach(
      (region) => {
        this.drawRegion(region);
      }
    )
  }
}
