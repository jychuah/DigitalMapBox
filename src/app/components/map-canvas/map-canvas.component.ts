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
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  redraw() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.style = "black";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    super.redraw();
    this.context.drawImage(this.maps.image, 0, 0);
  }
}
