import { Component, AfterViewInit, ElementRef, OnInit } from '@angular/core';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';
import { Events, Platform, AlertController } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { ViewPort, Camera, Point } from '../../types';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'dm-mini-map-canvas',
  templateUrl: './dm-mini-map-canvas.component.html',
  styleUrls: ['./dm-mini-map-canvas.component.scss'],
})
export class DmMiniMapCanvasComponent extends BaseCanvasComponent implements AfterViewInit, OnInit {
  dx: number = 0;
  dy: number = 0;
  dWidth: number = 0;
  dHeight: number = 0;
  scale: number = 1.0;
  rangeSlider: number = 50;
  viewscale: number = 1.0;
  draggableCamera: Camera = {
    center: {
      x: 0,
      y: 0
    },
    scale: 1.0
  }
  dragging: boolean = false;

  minp: number = 0;
  maxp: number = 100;
  minv: number = Math.log(0.1);
  maxv: number = Math.log(5);
  sliderScale: number = (this.maxv - this.minv) / (this.maxp - this.minp);
  previousCall: number = null;
  localViewportMetrics: any = null;
  localViewport: ViewPort = {
    width: 0,
    height: 0
  }

  currentCamera: string = "gm";

  constructor(public platform: Platform, 
              public events: Events, 
              public maps: MapSocketService,
              private el: ElementRef,
              private dom: DomSanitizer,
              public alertController: AlertController) { 
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
    this.events.subscribe("imageloadcomplete", () => {
      this.calculateMetrics();
    });
  }
  

  ngOnInit() {
    this.localViewport = {
      width: this.platform.width(),
      height: this.platform.height()
    }
    this.rangeSlider = this.getRangeSlider(this.maps.localCameras[this.currentCamera].scale);
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('mouseout', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('mousemove', (e) => this.throttleMouseMove(e), false);
    
    //Touch support for mobile devices
    this.canvas.addEventListener('touchstart', (e) => this.onMouseDown(e), false);
    this.canvas.addEventListener('touchend', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('touchcancel', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('touchmove', (e) => this.throttleMouseMove(e), false);
    this.previousCall = new Date().getTime();
  }

  onResize() {
    this.canvas.width = this.platform.width();
    this.canvas.height = this.platform.height()
    this.localViewport.width = this.canvas.width;
    this.localViewport.height = this.canvas.height;
    this.calculateMetrics();
    this.redraw();
  }

  getBackgroundImage() {
    return this.dom.bypassSecurityTrustStyle("url('" + this.maps.image.src + "')");
  }

  throttleMouseMove(e) {
    let time = new Date().getTime();
    if ((time - this.previousCall) < 10) { return; }
    this.previousCall = time;
    this.onMouseMove(e);
  }

  calculateMetrics() {
    this.scale = Math.min(
      this.canvas.width / this.maps.image.width, 
      this.canvas.height / this.maps.image.height
    );
    this.dx = (this.canvas.width - this.maps.image.width * this.scale) / 2;
    this.dy = (this.canvas.height - this.maps.image.height * this.scale) / 2;
    this.dWidth = this.maps.image.width * this.scale;
    this.dHeight = this.maps.image.height * this.scale;
  }

  refreshFromEvent() {
    // Update the range slider from an outside event source
    this.rangeSlider = this.getRangeSlider(this.maps.localCameras[this.currentCamera].scale);
    this.redraw();    
  }

  scaleChange($event) {
    let result = Math.exp(this.minv + this.sliderScale * (this.rangeSlider - this.minp));
    this.maps.localCameras[this.currentCamera].scale = result;
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
    let boundingRect = this.el.nativeElement.getBoundingClientRect();
    click.x -= boundingRect.left;
    click.y -= boundingRect.top;
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
    let localRect = this.calculateLocalRect(
      this.localViewport, this.maps.localCameras[this.currentCamera]
    );
    if (click.x > localRect.x &&
        click.x < localRect.x + localRect.width &&
        click.y > localRect.y &&
        click.y < localRect.y + localRect.height) {
      this.dragging = true;
    }
  }

  onMouseUp(e) {
    if (this.dragging) {
      this.maps.localCameras.gm = this.draggableCamera;
      this.events.publish("viewport");
    }
    this.dragging = false;
    this.redraw();
  }

  onMouseMove(e) {
    if (!this.dragging) { return; }
    this.draggableCamera.center = this.getLocalPoint(e);
    this.redraw();
  }

  calculateLocalRect(viewport: ViewPort, camera: Camera) {
    let localRect = { 
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    let width = viewport.width || this.localViewport.width;
    let height = viewport.height || this.localViewport.height;
    localRect.x = (-width / 2 / camera.scale + camera.center.x) * this.scale + this.dx;
    localRect.y = (-height / 2 / camera.scale + camera.center.y) * this.scale + this.dy;
    localRect.width = width * this.scale / camera.scale;
    localRect.height = height * this.scale / camera.scale;
    return localRect;
  }

  drawViewPort(viewport: ViewPort, camera: Camera, color: string, fill: string = null) {
    let rect = this.calculateLocalRect(viewport, camera);
    this.context.strokeStyle = color;
    this.context.lineWidth = 3;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    if (fill) {
      let saveFill = this.context.fillStyle;
      this.context.fillStyle = fill;
      this.context.fillRect(rect.x, rect.y, rect.width, rect.height);
      this.context.fillStyle = saveFill;
    }
  }

  redraw() {
    if (!this.maps.imageLoaded() || !this.maps.image.complete) { return; }
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillStyle = "#00000000";
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.setTransform(this.scale, 0, 0, this.scale, this.dx, this.dy);
    // Draw server viewport, with player camera
    this.drawViewPort(this.maps.server.viewport, this.maps.localCameras.player, "#ffffff88", "#ffffff44");

    if (this.dragging) {
      this.drawViewPort(this.localViewport, this.draggableCamera, "#ffffff");
      return;
    }
    // Draw GM viewport and camera
    this.drawViewPort(this.localViewport, this.maps.localCameras.gm, "#ffffff", "#ffffffaa");
  }

  isCamera(camera: string) {
    return this.currentCamera == camera;
  }

  setCamera(camera: string) {
    this.currentCamera = camera;
  }

  snapToGM() {
    this.maps.localCameras.player = { ...this.maps.localCameras.gm };
    this.redraw();
  }

  snapToPlayer() {
    this.maps.localCameras.gm = { ...this.maps.localCameras.player };
    this.redraw();
  }

  send() {
    this.maps.publishCamera("gm");
  }


  async shutdownClickHandler() {
    const alert = await this.alertController.create({
      header: "Shutdown",
      message: "Are you sure you wish to shut down the server?",
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'light'
        },
        {
          text: 'Shutdown',
          cssClass: 'danger',
          handler: () => {
            this.maps.publishShutdown();
          }
        }
      ]
    });
    await alert.present();
  }
}
