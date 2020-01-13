import { Component, OnInit } from '@angular/core';
import { DrawingCanvasComponent } from '../drawing-canvas/drawing-canvas.component';
import { Platform, Events } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { Vector } from '../../types';

@Component({
  selector: 'gm-note-canvas',
  templateUrl: './gm-note-canvas.component.html',
  styleUrls: ['./gm-note-canvas.component.scss'],
})
export class GmNoteCanvasComponent extends DrawingCanvasComponent {

  constructor(public platform: Platform,
              public events: Events,
              public maps: MapSocketService) {
    super(platform, events, maps);
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.subscribe("gmdraw");
    this.subscribe("gmerase");
  }

  connect() {
    this.events.subscribe("gmdrawing", (data) => {
      this.onDrawingEvent(data);
    });
    this.events.subscribe("gmerasing", (data) => {
      this.onErasingEvent(data);
    });
  }

  drawLine(vector: Vector, emit: boolean = false){
    super.drawLine(vector, false);

    if (!emit) { return; }

    this.maps.emit('gmdrawing', vector);
    this.maps.current.state.gmnotes.push(vector);
  }

  onMouseDown(p) {
    if (this.maps.mouseEvent === 'gmdraw') {
      this.drawing = true;
    }
    if (this.maps.mouseEvent === 'gmerase') {
      this.erasing = true;
    }
    this.current = p;
  }

  
  onMouseUp(p) {
    if (this.drawing) {
      this.drawLine(this.generateVector(p), true);
    }
    this.drawing = false;
    this.erasing = false;
  }

  erase(v: Vector, emit: boolean = false) {
    this.maps.current.state.gmnotes = this.maps.current.state.gmnotes.filter(
      (vector) => {
        return this.vectorDistance(v, vector) > 10 / this.maps.current.state.viewport.scale;
      }
    )
    this.redraw();

    if (!emit) { return; }

    this.maps.emit('gmerasing', v);
  }


  drawVectors() {
    this.maps.current.state.gmnotes.forEach(
      (vector) => {
        this.drawLine(vector);
      }
    )
  }

}
