import { Component, AfterViewInit } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { MapSocketService } from '../../map-socket.service';

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

  redraw() {


    super.redraw();
    if (!this.maps.imageLoaded() || !this.maps.image.complete ) { return; }
    if (!this.maps.ui) {
      console.log("Drawing blurred");
      this.context.filter = 'blur(30px)';
      this.context.drawImage(this.maps.image, 0, 0);
    } else {
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.filter = '';
      this.context.fillStyle = "#00000088";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

  }
}
