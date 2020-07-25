import { Component, AfterViewInit } from '@angular/core';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Platform, Events } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';

@Component({
  selector: 'map-canvas',
  templateUrl: './map-canvas.component.html',
  styleUrls: ['./map-canvas.component.scss'],
})
export class MapCanvasComponent extends BaseCanvasComponent implements AfterViewInit {

  constructor(public platform: Platform,
              public events: Events,
              public maps: MapSocketService) { 
    super(platform, events, maps);
    this.background = "black";
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  redraw() {
    if (!this.visible) return;
    super.redraw();
    if (!this.maps.imageLoaded() || !this.maps.image.complete ) { return; }
    this.context.drawImage(this.maps.image, 0, 0);
  }
}
