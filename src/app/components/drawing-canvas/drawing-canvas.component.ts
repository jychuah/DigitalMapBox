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
    this.subscribe("draw");
    this.subscribe("erase");
  }

  connect() {
    this.events.subscribe("drawing", (data) => {
      this.onDrawingEvent(data);
    });
    this.events.subscribe("erasing", (data) => {
      this.onErasingEvent(data);
    });
  }

  drawLine(vector: Vector, emit: boolean = false){
    this.context.beginPath();
    this.context.moveTo(vector.p0.x, vector.p0.y);
    this.context.lineTo(vector.p1.x, vector.p1.y);
    this.context.strokeStyle = vector.c ? vector.c : this.maps.current.color;
    this.context.lineWidth = vector.w;
    this.context.stroke();
    this.context.closePath();


    if (!emit) { return; }

    this.maps.emit('drawing', vector);
    this.maps.current.state.vectors.push(vector);
  }

  onMouseDown(p) {
    if (this.maps.mouseEvent === 'draw') {
      this.drawing = true;
    }
    if (this.maps.mouseEvent === 'erase') {
      this.erasing = true;
    }
    this.current = p;
  }

  generateVector(p: Point) : Vector {
    let vector = {
      p0: this.current,
      p1: p,
      w: 2 / this.maps.current.state.viewport.scale,
      c: this.maps.penColor
    } 
    return vector;
  }

  vectorDistance(v1: Vector, v2: Vector) {
    return Math.min(this.pointDistance(v1.p0, v2), this.pointDistance(v1.p1, v2));
  }

  pointDistance(p: Point, v: Vector) {
    var A = p.x - v.p0.x;
    var B = p.y - v.p0.y;
    var C = v.p1.x - v.p0.x;
    var D = v.p1.y - v.p0.y;
  
    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;
  
    var xx, yy;
  
    if (param < 0) {
      xx = v.p0.x;
      yy = v.p0.y;
    }
    else if (param > 1) {
      xx = v.p1.x;
      yy = v.p1.y;
    }
    else {
      xx = v.p0.x + param * C;
      yy = v.p0.y + param * D;
    }
  
    var dx = p.x - xx;
    var dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onMouseUp(p) {
    if (!this.visible) return;
    if (this.drawing) {
      this.drawLine(this.generateVector(p), true);
    }
    this.drawing = false;
    this.erasing = false;
  }

  onMouseMove(p) {
    if (!this.visible) return;
    if (this.drawing) {
      this.drawLine(this.generateVector(p), true);
    }
    if (this.erasing) {
      this.erase(this.generateVector(p), true);
    }
    this.current = p;
  }

  erase(v: Vector, emit: boolean = false) {
    this.maps.current.state.vectors = this.maps.current.state.vectors.filter(
      (vector) => {
        return this.vectorDistance(v, vector) > 10 / this.maps.current.state.viewport.scale;
      }
    )
    this.redraw();

    if (!emit) { return; }

    this.maps.emit('erasing', v);
  }


  onDrawingEvent(data) {
    this.drawLine(data);
  }

  onErasingEvent(data) {
    this.erase(data);
  }

  drawVectors() {
    this.maps.current.state.vectors.forEach(
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
