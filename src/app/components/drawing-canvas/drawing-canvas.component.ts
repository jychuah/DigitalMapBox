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
    this.mouseLayer = "drawing";
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
    this.context.strokeStyle = this.maps.current.color;
    this.context.lineWidth = vector.width;
    this.context.stroke();
    this.context.closePath();


    if (!emit) { return; }

    this.maps.emit('drawing', vector);
    this.maps.current.state.vectors.push(vector);
  }

  onMouseDown(p) {
    this.drawing = true;
    this.current = p;
  }

  generateVector(p) : Vector {
    let vector = {
      p0: this.current,
      p1: p,
      width: 2 / this.maps.current.state.viewport.scale
    } 
    return vector;
  }

  onMouseUp(p) {
    if (!this.drawing) { return; }
    this.drawing = false;
    this.drawLine(this.generateVector(p), true);
  }

  onMouseMove(p) {
    if (!this.drawing) { return; }
    this.drawLine(this.generateVector(p), true);
    this.current = p;
  }


  onDrawingEvent(data){
    this.drawLine(data);
  }

  redraw() {
    super.redraw();
    this.maps.current.state.vectors.forEach(
      (vector) => {
        this.drawLine(vector);
      }
    )
  }
}
