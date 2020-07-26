import { Component, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { MapSocketService } from '../../map-socket.service';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events } from '@ionic/angular';
import { Vector, Point, Region } from '../../types';
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
  currentRegion: Region = null;
  previousDim: Point = null;

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
    if (this.tool === "region") {
      this.currentRegion = {
        p: this.current,
        w: 0,
        h: 0,
        id: uuidv4().substring(0, 8),
        revealed: false
      }
    }
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

  mouseEventCallback(p) {
    if (this.tool === "draw" && this.active) {
      this.pushVector(p);
    }
    if (this.tool === "erase" && this.active) {
      this.erase(this.generateVector(p));
    }
    if (this.tool === "region" && this.active) {
      this.previousDim = {
        x: this.currentRegion.w,
        y: this.currentRegion.h
      }
      this.currentRegion.w = p.x - this.currentRegion.p.x;
      this.currentRegion.h = p.y - this.currentRegion.p.y;
      this.redraw();
    }
  }

  pushCurrentRegion() {
    this.maps.server.regions.push(this.currentRegion);
    this.events.publish("region", this.currentRegion);
    this.context.clearRect(
      this.currentRegion.p.x - 3, this.currentRegion.p.y - 3,
      this.currentRegion.w + 6, this.currentRegion.h + 6);
    this.currentRegion = null;
  }

  onMouseUp(p) {
    if (!this.visible) return;
    this.mouseEventCallback(p);
    if (this.tool === "region" && this.active) {
      this.pushCurrentRegion();
    }
    this.active = false;
  }

  onMouseMove(p) {
    if (!this.visible) return;
    this.mouseEventCallback(p);
    this.current = p;
  }

  erase(v: Vector) {
    let keep: Vector[] = [];
    let remove: Vector[] = [];
    this.maps.server.vectors.forEach(
      (vector) => {
        if (this.vectorDistance(v, vector) < 10 / this.maps.localCameras[this.group].scale) {
          remove.push(vector);
        } else {
          keep.push(vector);
        }
      }
    )
    this.maps.server.vectors = keep;
    if (remove.length == 0) return;
    let erasedIDs: string[] = remove.map(
      (vector) => vector.id
    )
    this.maps.publishErase(erasedIDs);
    this.events.publish("erasing");
  }
  
  clearPreviousRegion() {
    if (this.currentRegion && this.previousDim) {
      this.context.clearRect(
        this.currentRegion.p.x, 
        this.currentRegion.p.y,
        this.previousDim.x,
        this.previousDim.y);
    }
  }

  drawCurrentRegion() {
    if (!this.currentRegion) return;
    let color = "#ffffff";
    let fill = "#ffffff88";
    this.context.strokeStyle = color;
    this.context.lineWidth = 3;
    this.context.strokeRect(
      this.currentRegion.p.x, 
      this.currentRegion.p.y, 
      this.currentRegion.w, 
      this.currentRegion.h);
    if (fill) {
      let saveFill = this.context.fillStyle;
      this.context.fillStyle = fill;
      this.context.fillRect(
        this.currentRegion.p.x, 
        this.currentRegion.p.y, 
        this.currentRegion.w, 
        this.currentRegion.h);
      this.context.fillStyle = saveFill;
    }
  }

  redraw() {
    if (!this.visible) return;
    super.redraw();
    this.clearPreviousRegion();
    this.drawCurrentRegion();
  }
}