import { Component, ViewChild, ElementRef } from '@angular/core';
import { MapSocketService } from '../map-socket.service';
import { Observable } from 'rxjs';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  events: Observable<any>;
  @ViewChild('canvas', {static: false}) canvasEl: ElementRef;
  canvas: any;
  context: any;
  drawing: boolean = false;
  current: any = {
    color: 'black'
  }

  previousCall: any = new Date().getTime();

  constructor(private maps: MapSocketService, private platform: Platform) {
  }

  ionViewDidEnter() {
    this.canvas = this.canvasEl.nativeElement;
    this.context = this.canvas.getContext('2d');
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('mouseout', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    
    //Touch support for mobile devices
    this.canvas.addEventListener('touchstart', (e) => this.onMouseDown(e), false);
    this.canvas.addEventListener('touchend', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('touchcancel', (e) => this.onMouseUp(e), false);
    this.canvas.addEventListener('touchmove', (e) => this.onMouseMove(e), false);
    this.previousCall = new Date().getTime();
    this.events = this.maps.connect("http://localhost:3000");
    this.events.subscribe(
      (event) => {
        this.onDrawingEvent(event);
      }
    );
    this.platform.ready().then(
      () => {
        this.onResize();
        this.platform.resize.subscribe(() => {
          this.onResize();
        });
      }
    )
  }



  drawLine(x0, y0, x1, y1, color, emit: boolean = false){
    this.context.beginPath();
    this.context.moveTo(x0, y0);
    this.context.lineTo(x1, y1);
    this.context.strokeStyle = color;
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.closePath();

    if (!emit) { return; }
    var w = this.canvas.width;
    var h = this.canvas.height;

    this.maps.emit('drawing', {
      x0: x0,
      y0: y0,
      x1: x1,
      y1: y1,
      color: color
    });
  }

  onMouseDown(e) {
    this.drawing = true;
    this.current.x = e.clientX||e.touches[0].clientX;
    this.current.y = e.clientY||e.touches[0].clientY;
  }

  onMouseUp(e) {
    if (!this.drawing) { return; }
    this.drawing = false;
    this.drawLine(
      this.current.x, 
      this.current.y, 
      e.clientX||e.touches[0].clientX, 
      e.clientY||e.touches[0].clientY, 
      this.current.color, 
      true
    );
  }

  onMouseMove(e) {
    if (!this.drawing) { return; }
    let time = new Date().getTime();
    if ((time - this.previousCall) < 10) { return; }
    this.previousCall = time;
    this.drawLine(
      this.current.x, 
      this.current.y, 
      e.clientX||e.touches[0].clientX, 
      e.clientY||e.touches[0].clientY, 
      this.current.color, 
      true
    );
    this.current.x = e.clientX||e.touches[0].clientX;
    this.current.y = e.clientY||e.touches[0].clientY;
  }

  onColorUpdate(e) {
    this.current.color = e.target.className.split(' ')[1];
  }

  onDrawingEvent(data){
    var w = this.canvas.width;
    var h = this.canvas.height;
    this.drawLine(
      data.x0, 
      data.y0, 
      data.x1, 
      data.y1, 
      data.color
    );
  }

    // make the canvas fill its parent
    onResize() {
      this.canvas.width = this.platform.width();
      this.canvas.height = this.platform.height();
    }

}
