import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events, Platform } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { ViewPort, Point } from '../../types';
import { ThrowStmt } from '@angular/compiler';

@Component({
  selector: 'mini-map-canvas',
  templateUrl: './mini-map-canvas.component.html',
  styleUrls: ['./mini-map-canvas.component.scss'],
})
export class MiniMapCanvasComponent extends BaseCanvasComponent implements AfterViewInit {
  dx: number = 0;
  dy: number = 0;
  dWidth: number = 0;
  dHeight: number = 0;
  scale: number = 1.0;
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

  constructor(public platform: Platform, 
              public events: Events, 
              public maps: MapSocketService,
              private el: ElementRef) { 
    super(platform, events, maps);
  }

  connect() {
    super.connect();
    this.events.subscribe("viewport", (viewport) => {
      this.localView = viewport;
      this.redraw();
    });
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
      this.maps.state.viewport = this.localView;
      this.events.publish("redraw");
    }
    this.dragging = false;
  }

  onMouseMove(e) {
    if (!this.dragging) { return; }
    this.localView.center = this.getLocalPoint(e);
    this.redraw();
  }

  calculateLocalRect() {
    // TODO: Apply viewport scaling
    this.localRect.x = (-this.platform.width() / 2 + this.localView.center.x) * this.scale + this.dx;
    this.localRect.y = (-this.platform.height() / 2 + this.localView.center.y) * this.scale + this.dy;
    this.localRect.width = this.platform.width() * this.scale;
    this.localRect.height = this.platform.height() * this.scale;
  }

  redraw() {
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
    this.context.strokeStyle = "white";
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