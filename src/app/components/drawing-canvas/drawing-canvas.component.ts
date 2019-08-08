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
  vectors: any[] = [];

  constructor(public platform: Platform,
     public maps: MapSocketService, 
     public events: Events) {
     super(platform, events);
  }

  connect() {
    this.events.subscribe("drawing", (data) => {
      this.onDrawingEvent(data);
    });
    this.events.subscribe("sync", (state) => {
      this.vectors = state.vectors;
      this.redraw();
    });
  }

  drawLine(data, emit: boolean = false){
    this.context.beginPath();
    this.context.moveTo(data.x0, data.y0);
    this.context.lineTo(data.x1, data.y1);
    this.context.strokeStyle = data.color;
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.closePath();

    if (!emit) { return; }

    this.vectors.push(data);

    this.maps.emit('drawing', {
      x0: data.x0,
      y0: data.y0,
      x1: data.x1,
      y1: data.y1,
      color: data.color
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
    let vector = {
      x0: this.current.x,
      y0: this.current.y,
      x1: e.clientX||e.touches[0].clientX, 
      y1: e.clientY||e.touches[0].clientY, 
      color: this.current.color, 
    }
    this.drawLine(vector, true);
  }

  onMouseMove(e) {
    if (!this.drawing) { return; }
    let vector = {
      x0: this.current.x,
      y0: this.current.y,
      x1: e.clientX||e.touches[0].clientX, 
      y1: e.clientY||e.touches[0].clientY, 
      color: this.current.color, 
    }
    this.drawLine(vector, true);
    this.current.x = e.clientX||e.touches[0].clientX;
    this.current.y = e.clientY||e.touches[0].clientY;
  }

  onColorUpdate(e) {
    this.current.color = e.target.className.split(' ')[1];
  }

  onDrawingEvent(data){
    this.drawLine(data);
  }

  redraw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.vectors.forEach(
      (vector) => {
        this.drawLine(vector);
      }
    )
  }
}
