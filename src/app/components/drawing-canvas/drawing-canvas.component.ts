import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { MapSocketService } from '../../map-socket.service';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events } from '@ionic/angular';

@Component({
  selector: 'drawing-canvas',
  templateUrl: './drawing-canvas.component.html'
})
export class DrawingCanvasComponent extends BaseCanvasComponent implements AfterViewInit {
  drawing: boolean = false;
  socketEvents: Observable<any> = null;
  current: any = {
    color: 'black'
  }

  constructor(public platform: Platform,
     public maps: MapSocketService, 
     private events: Events) {
    super(platform);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.connect();
    this.events.subscribe("reconnect", () => {
      this.connect();
    });
  }

  connect() {
    this.socketEvents = this.maps.subscribe("drawing");
    this.socketEvents.subscribe(
      (data) => {
        this.onDrawingEvent(data);
      }
    );
  }

  drawLine(x0, y0, x1, y1, color, emit: boolean = false){
    this.context.beginPath();
    this.context.moveTo(x0, y0);
    this.context.lineTo(x1, y1);
    this.context.strokeStyle = color;
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.closePath();

    if (!emit) { return; }

    this.maps.emit('drawing', {
      x0: x0,
      y0: y0,
      x1: x1,
      y1: y1,
      color: color
    });
  }

  onMouseDown(e) {
    this.drawing = true;
    this.current.x = e.clientX||e.touches[0].clientX;
    this.current.y = e.clientY||e.touches[0].clientY;
  }

  onMouseUp(e) {
    if (!this.drawing) { return; }
    this.drawing = false;
    this.drawLine(
      this.current.x, 
      this.current.y, 
      e.clientX||e.touches[0].clientX, 
      e.clientY||e.touches[0].clientY, 
      this.current.color, 
      true
    );
  }

  onMouseMove(e) {
    if (!this.drawing) { return; }
    this.drawLine(
      this.current.x, 
      this.current.y, 
      e.clientX||e.touches[0].clientX, 
      e.clientY||e.touches[0].clientY, 
      this.current.color, 
      true
    );
    this.current.x = e.clientX||e.touches[0].clientX;
    this.current.y = e.clientY||e.touches[0].clientY;
  }

  onColorUpdate(e) {
    this.current.color = e.target.className.split(' ')[1];
  }

  onDrawingEvent(data){
    this.drawLine(
      data.x0, 
      data.y0, 
      data.x1, 
      data.y1, 
      data.color
    );
  }
}
