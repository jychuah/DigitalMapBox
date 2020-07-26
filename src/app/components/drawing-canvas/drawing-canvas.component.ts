import { Component, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { MapSocketService } from '../../map-socket.service';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events } from '@ionic/angular';
import { Vector, Point } from '../../types';
import * as uuidv4 from 'uuid/v4';
@Component({
  selector: 'drawing-canvas',
  templateUrl: './drawing-canvas.component.html'
})
export class DrawingCanvasComponent extends BaseCanvasComponent implements AfterViewInit {
  drawing: boolean = false;
  erasing: boolean = false;
  socketEvents: Observable<any> = null;
  current: Point = {
    x: 0,
    y: 0
  }

  constructor(public platform: Platform,
              public events: Events,
              public maps: MapSocketService) {
    super(platform, events, maps);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  connect() {
    this.events.subscribe("drawing", (data) => {
      this.onDrawingEvent(data);
    });
    this.events.subscribe("erasing", (data) => {
      this.redraw();
    });
  }

  drawLine(vector: Vector){
    this.context.beginPath();
    this.context.moveTo(vector.p0.x, vector.p0.y);
    this.context.lineTo(vector.p1.x, vector.p1.y);
    this.context.strokeStyle = vector.c ? vector.c : "#ffffff";
    this.context.lineWidth = vector.w;
    this.context.stroke();
    this.context.closePath();
  }
  
  onDrawingEvent(data) {
    this.drawLine(data);
  }


  drawVectors() {
    this.maps.server.vectors.forEach(
      (vector) => {
        this.drawLine(vector);
      }
    )
  }

  redraw() {
    if (!this.visible) return;
    super.redraw();
    this.drawVectors();
  }
}
