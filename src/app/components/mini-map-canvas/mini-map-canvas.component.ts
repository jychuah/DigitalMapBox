import { Component, AfterViewInit } from '@angular/core';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events, Platform } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';

@Component({
  selector: 'mini-map-canvas',
  templateUrl: './mini-map-canvas.component.html',
  styleUrls: ['./mini-map-canvas.component.scss'],
})
export class MiniMapCanvasComponent extends BaseCanvasComponent implements AfterViewInit {

  constructor(public platform: Platform, 
              public events: Events, 
              public maps: MapSocketService) { 
    super(platform, events, maps);
  }


}
