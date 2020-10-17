import { Component, Input } from '@angular/core';
import { Platform, Events, AlertController } from '@ionic/angular';
import { FogCanvasComponent } from '../fog-canvas/fog-canvas.component';
import { MapSocketService } from '../../map-socket.service';
import { Region, Point, Camera } from '../../types';
import * as uuidv4 from 'uuid/v4';
@Component({
  selector: 'region-canvas',
  templateUrl: './region-canvas.component.html',
  styleUrls: ['./region-canvas.component.scss'],
})
export class RegionCanvasComponent extends FogCanvasComponent {
  @Input('toolbar') toolbar: boolean = false;
  currentRegion: Region = null;
  highlightRegion: Region = null;
  previousDim: Point = null
  current: Point = {
    x: 0,
    y: 0
  }
  grab: Point = {
    x: 0,
    y: 0
  }
  tool: string = "";
  active: boolean = false;
  mode: string = "";

  constructor(public platform: Platform,
    public events: Events,
    public maps: MapSocketService,
    public alertController: AlertController) { 
    super(platform, events, maps);
    this.background = null;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  connect() {
    this.events.subscribe("region", (region) => {
      this.drawRegion(region);
    });
  }

  isTool(tool: string) {
    return this.tool === tool;
  }

  setTool(tool: string) {
    this.tool = tool;
    this.redraw();
  }

  between(min, p, max){
    let result = false;
    if ( min < max ){
      if ( p > min && p < max ){
        result = true;
      }
    }
    if ( min > max ){
      if ( p > max && p < min){
        result = true
      }
    }
    if ( p == min || p == max ){
      result = true;
    }
    return result;
  }
  
  pointInRect(x, y, left, top, right, bottom){
    let result = false;
    if (this.between(left, x, right) && this.between(top, y, bottom) ){
      result = true;
    }
    return result;
  }

  pointInRegion(p: Point, region: Region) {
    return this.pointInRect(
      p.x, p.y, region.p.x, region.p.y, region.p.x + region.w, region.p.y + region.h
    )
  }

  clearRegion(r: Region) {
    this.context.clearRect(r.p.x - 3, r.p.y - 3, r.w + 6, r.h + 6); 
  }

  findMatchingRegion(p: Point) {
    let found = this.maps.server.regions.find(
      (region) => this.pointInRegion(p, region)
    )
    return found;
  }

    mouseEventCallback(p) {
    if (this.tool === "region" && this.active) {
      this.previousDim = {
        x: this.currentRegion.w,
        y: this.currentRegion.h
      }
      this.currentRegion.w = p.x - this.currentRegion.p.x;
      this.currentRegion.h = p.y - this.currentRegion.p.y;
      this.clearPreviousRegion();
      this.drawCurrentRegion()
    }
    if (this.tool === "select") {
      let found = this.findMatchingRegion(p);
      if (!found) {
        found = null;
      }
      if (found != this.highlightRegion) {
        this.highlightRegion = found;
        this.redraw();
      }
      if (this.currentRegion) {
        if (this.mode === "move") {
          this.clearRegion(this.currentRegion);
          this.currentRegion.p = {
            x: p.x - this.grab.x,
            y: p.y - this.grab.y
          }
          this.drawCurrentRegion();
        }
        if (this.mode === "resize") {
          this.clearRegion(this.currentRegion);
          this.currentRegion.w = p.x + this.grab.x - this.currentRegion.p.x;
          this.currentRegion.h = p.y + this.grab.y - this.currentRegion.p.y;
          this.drawCurrentRegion();
        }
      }
    }
  }

  snapCurrentRegion() {
    let camera: Camera = {
      ...this.maps.localCameras.gm,
      x: (this.currentRegion.p.x + this.currentRegion.w) / 2,
      y: (this.currentRegion.p.y + this.currentRegion.h) / 2
    };
    this.maps.localCameras.gm = { ...camera };
    this.maps.localCameras.player = { ...camera };
    this.maps.publishCamera("player");
  }

  deleteCurrentRegion() {
    let index = this.maps.server.regions.findIndex(
      (region) => region.id === this.currentRegion.id
    );
    this.maps.publishEraseRegion(this.currentRegion.id);
    this.maps.server.regions.splice(index, 1);
    this.currentRegion = null;
    this.events.publish("redraw");
  }

  pushCurrentRegion() {
    this.maps.server.regions.push(this.currentRegion);
    this.events.publish("region", this.currentRegion);
    this.clearRegion(this.currentRegion);
    this.drawRegion(this.currentRegion);
    this.maps.publishRegion(this.currentRegion);
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
    if (this.tool === "select") {
      let found = this.findMatchingRegion(p);
      if (found) {
        this.currentRegion = found;

        let resizeTab: Region = this.getResizeTab();
        if (this.pointInRegion(p, resizeTab)) {
          this.mode = "resize";
          this.grab = {
            x: this.currentRegion.p.x + this.currentRegion.w - p.x,
            y: this.currentRegion.p.y + this.currentRegion.h - p.y
          }
        } else {
          this.mode = "move";
          this.grab = {
            x: p.x - this.currentRegion.p.x,
            y: p.y - this.currentRegion.p.y
          }
        }
        this.redraw();
      }
    }
  }

  onMouseUp(p) {
    if (!this.visible) return;
    this.mouseEventCallback(p);
    if (this.tool === "region" && this.active) {
      this.pushCurrentRegion();
    }
    if (this.tool === "select" && this.active) {
      if (this.mode === "move" || this.mode === "resize") {
        this.maps.publishRegion(this.currentRegion);
        this.events.publish("redraw", this.currentRegion);
      }
      this.mode = "";
    }

    this.active = false;
  }

  onMouseMove(p) {
    if (!this.visible) return;
    this.mouseEventCallback(p);
    this.current = p;
  }

  refillRegion(r: Region) {
    if (!r.revealed) {
      this.context.fillStyle = "#00000088";
      this.context.fillRect(r.p.x, r.p.y, r.w, r.h);
    } 
    this.drawRegion(r);
  }

  drawRegion(r: Region) {
    this.context.strokeStyle = "#ffffff";
    this.context.lineWidth = 1;
    if (r.revealed) {
      this.context.clearRect(r.p.x, r.p.y, r.w, r.h);
    }
    this.context.strokeRect(r.p.x, r.p.y, r.w, r.h);
  }

  drawMapFill() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillStyle = "#00000088";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.applyTransforms();
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

  strokeRegion(r: Region) {
    let color = "#ffffff";
    this.context.strokeStyle = color;
    this.context.lineWidth = 3;
    this.context.strokeRect(r.p.x, r.p.y, r.w, r.h);
  }

  drawHighlightRegion() {
    if (!this.highlightRegion) return;
    this.strokeRegion(this.highlightRegion);
  }

  getResizeTab() : Region {
    let tab = 60 / this.maps.localCameras[this.group].scale;
    if (this.currentRegion.w < tab || this.currentRegion.h < tab) {
      return {
        p: {
          x: this.currentRegion.p.x + this.currentRegion.w / 2,
          y: this.currentRegion.p.y + this.currentRegion.h / 2
        },
        w: this.currentRegion.w / 2,
        h: this.currentRegion.h / 2,
        id: "resizeTab",
        revealed: false
      }
    }
    return {
      p: {
        x: this.currentRegion.p.x + this.currentRegion.w - tab,
        y: this.currentRegion.p.y + this.currentRegion.h - tab,
      },
      w: tab,
      h: tab,
      id: "resizeTab",
      revealed: false
    }
  }

  drawCurrentRegion() {
    if (!this.currentRegion) return;
    let fill = "#ffffff44";
    this.strokeRegion(this.currentRegion);
    let saveFill = this.context.fillStyle;
    this.context.fillStyle = fill;
    this.context.fillRect(
      this.currentRegion.p.x, 
      this.currentRegion.p.y, 
      this.currentRegion.w, 
      this.currentRegion.h);
    this.context.fillStyle = saveFill;
    this.strokeRegion(this.getResizeTab());
  }

  toggleCurrentRegion() {
    this.currentRegion.revealed = !this.currentRegion.revealed;
    this.maps.publishRegion(this.currentRegion);
    if (this.currentRegion.revealed) {
      this.events.publish("region", this.currentRegion);
    } else {
      this.events.publish("redraw", this.currentRegion);
    }
    this.redraw();
  }

  async resetClickHandler() {
    const alert = await this.alertController.create({
      header: "Reset",
      message: "Are you sure you wish to erase all regions?",
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
            this.maps.publishResetRegions();
          }
        }
      ]
    });
    await alert.present();
  }

  redraw() {
    if (!this.visible) return;
    super.redraw();
    this.drawHighlightRegion();
    this.drawCurrentRegion();
  }
}
