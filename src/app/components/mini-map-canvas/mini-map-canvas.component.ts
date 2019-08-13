import { Component, AfterViewInit, ElementRef, OnInit } from '@angular/core';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events, Platform } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { ViewPort, Point } from '../../types';

@Component({
  selector: 'mini-map-canvas',
  templateUrl: './mini-map-canvas.component.html',
  styleUrls: ['./mini-map-canvas.component.scss'],
})
export class MiniMapCanvasComponent extends BaseCanvasComponent implements AfterViewInit, OnInit {
  dx: number = 0;
  dy: number = 0;
  dWidth: number = 0;
  dHeight: number = 0;
  scale: number = 1.0;
  rangeSlider: number = 50;
  viewscale: number = 1.0;
  localView: ViewPort = {
    center: {
      x: 0,
      y: 0
    },
    scale: 1.0
  }
  dragging: boolean = false;
  localRect: any = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }

  minp: number = 0;
  maxp: number = 100;
  minv: number = Math.log(0.1);
  maxv: number = Math.log(5);
  sliderScale: number = (this.maxv - this.minv) / (this.maxp - this.minp);

  constructor(public platform: Platform, 
              public events: Events, 
              public maps: MapSocketService,
              private el: ElementRef) { 
    super(platform, events, maps);
  }

  connect() {
    super.connect();
    this.events.subscribe("sync", () => {
      this.refreshFromEvent();
    });
    this.events.subscribe("viewport", () => {
      this.refreshFromEvent();
    });
  }
  
  ngOnInit() {
    this.localView = this.maps.current.state.viewport;
    this.rangeSlider = this.getRangeSlider(this.maps.current.state.viewport.scale);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  refreshFromEvent() {
    this.localView = this.maps.current.state.viewport;
    this.rangeSlider = this.getRangeSlider(this.maps.current.state.viewport.scale);
    this.redraw();    
  }

  scaleChange($event) {
    let result = Math.exp(this.minv + this.sliderScale * (this.rangeSlider - this.minp));
    this.maps.current.state.viewport.scale = result;
    this.maps.emit("viewport", this.maps.current.state.viewport);
    this.events.publish("viewport");
    this.redraw();
  }

  getRangeSlider(scale) {
    let log = Math.log(scale);
    return (log - this.minv) / this.sliderScale + this.minp;
  }

  getMinimapPoint(e) : Point {
    // get point on minimap element space
    let click: Point = {
      x: e.clientX||e.touches[0].clientX,
      y: e.clientY||e.touches[0].clientY
    }
    click.x -= this.el.nativeElement.offsetLeft;
    click.y -= this.el.nativeElement.offsetTop;
    return click;
  }

  getLocalPoint(e) : Point {
    // get map coordinate space
    let point = this.getMinimapPoint(e);
    point.x -= this.dx;
    point.y -= this.dy;
    point.x /= this.scale;
    point.y /= this.scale;
    return point;
  }

  onMouseDown(e) {
    let click = this.getMinimapPoint(e);
    if (click.x > this.localRect.x &&
        click.x < this.localRect.x + this.localRect.width &&
        click.y > this.localRect.y &&
        click.y < this.localRect.y + this.localRect.height) {
      this.dragging = true;
    }
  }

  onMouseUp(e) {
    if (this.dragging) {
      this.maps.current.state.viewport = this.localView;
      this.maps.emit("viewport", this.maps.current.state.viewport);
      this.events.publish("viewport");
    }
    this.dragging = false;
  }

  onMouseMove(e) {
    if (!this.dragging) { return; }
    this.localView.center = this.getLocalPoint(e);
    this.redraw();
  }

  calculateLocalRect() {
    this.localRect.x = (-this.platform.width() / 2 / this.maps.current.state.viewport.scale + this.localView.center.x) * this.scale + this.dx;
    this.localRect.y = (-this.platform.height() / 2 / this.maps.current.state.viewport.scale + this.localView.center.y) * this.scale + this.dy;
    this.localRect.width = this.platform.width() * this.scale / this.maps.current.state.viewport.scale;
    this.localRect.height = this.platform.height() * this.scale / this.maps.current.state.viewport.scale;
  }

  redraw() {
    if (!this.maps.imageLoaded() || !this.maps.image.complete) { return; }
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.style = "black";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.maps.image.complete) {
      return;
    }
    this.scale = Math.min(
      this.canvas.width / this.maps.image.width, 
      this.canvas.height / this.maps.image.height
    );
    this.dx = (this.canvas.width - this.maps.image.width * this.scale) / 2;
    this.dy = (this.canvas.height - this.maps.image.height * this.scale) / 2;
    this.context.setTransform(this.scale, 0, 0, this.scale, this.dx, this.dy);
    this.dWidth = this.maps.image.width * this.scale;
    this.dHeight = this.maps.image.height * this.scale;
    this.context.drawImage(this.maps.image, 0, 0);
    this.context.strokeStyle = this.maps.current.color;
    this.context.lineWidth = 3;
    this.calculateLocalRect();
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.strokeRect(
      this.localRect.x,
      this.localRect.y,
      this.localRect.width,
      this.localRect.height
    )
  }

  onResize() {
    this.canvas.width = this.el.nativeElement.clientWidth;
    this.canvas.height = this.el.nativeElement.clientHeight;
    this.viewscale = this.canvas.width / this.platform.width();
    this.redraw();
  }

}
