import { Component, Input } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { FogCanvasComponent } from '../fog-canvas/fog-canvas.component';
import { MapSocketService } from '../../map-socket.service';
import { Region, Point } from '../../types';
import * as uuidv4 from 'uuid/v4';
@Component({
  selector: 'region-canvas',
  templateUrl: './region-canvas.component.html',
  styleUrls: ['./region-canvas.component.scss'],
})
export class RegionCanvasComponent extends FogCanvasComponent {
  @Input('toolbar') toolbar: boolean = false;
  currentRegion: Region = null;
  previousDim: Point = null
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
  }

  pushCurrentRegion() {
    this.maps.server.regions.push(this.currentRegion);
    this.events.publish("region", this.currentRegion);
    this.context.clearRect(
      this.currentRegion.p.x - 3, this.currentRegion.p.y - 3,
      this.currentRegion.w + 6, this.currentRegion.h + 6);
    this.drawRegion(this.currentRegion);
    this.currentRegion = null;
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
  }
}
