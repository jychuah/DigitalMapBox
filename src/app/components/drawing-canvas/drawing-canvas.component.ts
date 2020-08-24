import { Component, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Platform } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events, AlertController } from '@ionic/angular';
import { Vector, Point } from '../../types';
import { faEraser } from '@fortawesome/free-solid-svg-icons';
import * as uuidv4 from 'uuid/v4';
@Component({
  selector: 'drawing-canvas',
  templateUrl: './drawing-canvas.component.html',
  styleUrls: ['./drawing-canvas.component.scss']
})
export class DrawingCanvasComponent extends BaseCanvasComponent implements AfterViewInit {
  @Input('toolbar') toolbar: boolean = false;
  drawing: boolean = false;
  erasing: boolean = false;
  current: Point = {
    x: 0,
    y: 0
  }
  public faEraser: any = faEraser;
  tool: string = "";
  active: boolean = false;

  constructor(public platform: Platform,
              public events: Events,
              public maps: MapSocketService,
              public alertController: AlertController) {
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

  isTool(tool: string) {
    return this.tool === tool;
  }

  setTool(tool: string) {
    this.tool = tool;
  }

  generateVector(p: Point) : Vector {
    let vector = {
      p0: this.current,
      p1: p,
      w: 4 / this.maps.localCameras[this.group].scale,
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
    this.maps.server.vectors.push(vector);
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
  }

  onMouseDown(p) {
    if (this.tool === "") return;
    this.active = true;
    this.current = p;
  }

  onMouseUp(p) {
    if (!this.visible) return;
    this.mouseEventCallback(p);
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

  async resetClickHandler() {
    const alert = await this.alertController.create({
      header: "Reset",
      message: "Are you sure you wish to erase all drawings?",
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'light'
        },
        {
          text: 'Erase',
          cssClass: 'danger',
          handler: () => {
            this.maps.publishResetVectors();
          }
        }
      ]
    });
    await alert.present();
  }

  redraw() {
    if (!this.visible) return;
    super.redraw();
    this.drawVectors();
  }
}
