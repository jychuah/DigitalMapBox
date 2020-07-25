import { Component, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { MapSocketService } from '../../map-socket.service';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events } from '@ionic/angular';
import { Vector, Point } from '../../types';
import { faEraser, faUserSecret } from '@fortawesome/free-solid-svg-icons';
import * as uuidv4 from 'uuid/v4';
@Component({
  selector: 'control-canvas',
  templateUrl: './control-canvas.component.html',
  styleUrls: ['./control-canvas.component.scss']
})
export class ControlCanvasComponent extends BaseCanvasComponent implements AfterViewInit {
  public faEraser: any = faEraser;
  socketEvents: Observable<any> = null;
  current: Point = {
    x: 0,
    y: 0
  }
  tool: string = "";
  active: boolean = false;

  constructor(public platform: Platform,
              public events: Events,
              public maps: MapSocketService) {
    super(platform, events, maps);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  isTool(tool: string) {
    return this.tool === tool;
  }

  setTool(tool: string) {
    this.tool = tool;
  }

  onMouseDown(p) {
    if (this.tool === "") return;
    this.active = true;
    this.current = p;
  }

  generateVector(p: Point) : Vector {
    let vector = {
      p0: this.current,
      p1: p,
      w: 2 / this.maps.localCameras[this.group].scale,
      c: this.maps.penColor,
      id: uuidv4().substring(0, 8)
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

  pushVector(p) {
    let vector: Vector = this.generateVector(p);
    this.maps.server
    this.maps.publishVector(vector);
    this.events.publish("drawing", vector);
  }

  onMouseUp(p) {
    if (!this.visible) return;
    if (this.tool === "draw" && this.active) {
      this.pushVector(p);
    }
    this.active = false;
  }

  onMouseMove(p) {
    if (!this.visible) return;
    if (this.tool === "draw" && this.active) {
      this.pushVector(p);
    }
    this.current = p;
  }

  erase(v: Vector, emit: boolean = false) {
    this.maps.server.vectors = this.maps.server.vectors.filter(
      (vector) => {
        return this.vectorDistance(v, vector) > 10 / this.maps.server.camera.scale;
      }
    )
    this.redraw();

    if (!emit) { return; }

    this.maps.emit('erasing', v);
  }

  redraw() {
    if (!this.visible) return;
    super.redraw();
  }
}
