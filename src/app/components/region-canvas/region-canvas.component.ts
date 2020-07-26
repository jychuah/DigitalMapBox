import { Component } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { FogCanvasComponent } from '../fog-canvas/fog-canvas.component';
import { MapSocketService } from '../../map-socket.service';
import { Region } from '../../types';

@Component({
  selector: 'region-canvas',
  templateUrl: './region-canvas.component.html',
  styleUrls: ['./region-canvas.component.scss'],
})
export class RegionCanvasComponent extends FogCanvasComponent {
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
  }

  drawRegion(r: Region) {
    this.context.strokeStyle = "#ffffff";
    this.context.lineWidth = 1;
    if (r.revealed) {
      this.context.clearRect(r.p.x, r.p.y, r.w, r.h);
    }
    this.context.strokeRect(r.p.x, r.p.y, r.w, r.h);
    console.log("Drawing", r);
  }

  drawMapFill() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillStyle = "#00000088";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.applyTransforms();
  }
}
