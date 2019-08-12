import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { MapSocketService } from '../../map-socket.service';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events } from '@ionic/angular';
import { Vector, Point } from '../../types';

@Component({
  selector: 'drawing-canvas',
  templateUrl: './drawing-canvas.component.html'
})
export class DrawingCanvasComponent extends BaseCanvasComponent implements AfterViewInit {
  drawing: boolean = false;
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

  connect() {
    this.events.subscribe("drawing", (data) => {
      this.onDrawingEvent(data);
    });
  }

  drawLine(vector: Vector, emit: boolean = false){
    this.context.beginPath();
    this.context.moveTo(vector.p0.x, vector.p0.y);
    this.context.lineTo(vector.p1.x, vector.p1.y);
    this.context.strokeStyle = vector.color;
    this.context.lineWidth = vector.width;
    this.context.stroke();
    this.context.closePath();


    if (!emit) { return; }

    this.maps.emit('drawing', vector);
    this.maps.state.vectors.push(vector);

  }

  onMouseDown(e) {
    this.drawing = true;
    this.current = this.getLocalPoint(
      {
        x: e.clientX||e.touches[0].clientX,
        y: e.clientY||e.touches[0].clientY
      }
    );
  }

  eventToLocalPoint(e) : Point {
    return this.getLocalPoint({
      x: e.clientX||e.touches[0].clientX, 
      y: e.clientY||e.touches[0].clientY
    });
  }

  eventToVector(e) : Vector {
    let vector = {
      p0: this.current,
      p1: this.eventToLocalPoint(e),
      color: this.maps.penColor,
      width: 2 / this.maps.state.viewport.scale
    } 
    return vector;
  }

  onMouseUp(e) {
    if (!this.drawing) { return; }
    this.drawing = false;
    this.drawLine(this.eventToVector(e), true);
  }

  onMouseMove(e) {
    if (!this.drawing) { return; }
    this.drawLine(this.eventToVector(e), true);
    this.current = this.eventToLocalPoint(e);
  }


  onDrawingEvent(data){
    this.drawLine(data);
  }

  redraw() {
    super.redraw();
    this.maps.state.vectors.forEach(
      (vector) => {
        this.drawLine(vector);
      }
    )
  }
}
