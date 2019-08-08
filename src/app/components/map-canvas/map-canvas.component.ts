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
  public image: any = new Image();

  constructor(public platform: Platform,
    public maps: MapSocketService, 
    public events: Events) { 
    super(platform, events);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.image.onload = () => {
      this.context.drawImage(this.image, 0, 0);
    }
  }

  redraw() {
    this.context.drawImage(this.image, 0, 0);
  }

  connect() {
    this.events.subscribe("imageload", (path) => {
      this.load(path);
    });
    this.events.subscribe("sync", (data) => {
      this.load(data.filename);
    });
  }

  load(imagePath) {
    this.image.src = this.maps.url + imagePath;
  }

}
