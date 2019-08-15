import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { Point } from '../../types';

@Component({
  selector: 'mouse-interaction',
  templateUrl: './mouse-interaction.component.html'
})
export class MouseInteractionComponent implements AfterViewInit {
  @ViewChild('div', {static: false}) divEl: ElementRef;
  div: any;
  previousCall: number = null;

  constructor(public platform: Platform, 
              public events: Events, 
              public maps: MapSocketService) { }

  ngAfterViewInit() {
    this.div = this.divEl.nativeElement;
    this.div.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    this.div.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    this.div.addEventListener('mouseout', (e) => this.onMouseUp(e), false);
    this.div.addEventListener('mousemove', (e) => this.throttleMouseMove(e), false);
    
    //Touch support for mobile devices
    this.div.addEventListener('touchstart', (e) => this.onMouseDown(e), false);
    this.div.addEventListener('touchend', (e) => this.onMouseUp(e), false);
    this.div.addEventListener('touchcancel', (e) => this.onMouseUp(e), false);
    this.div.addEventListener('touchmove', (e) => this.throttleMouseMove(e), false);
    this.previousCall = new Date().getTime();
  }

  applyTransforms() {
  }

  getLocalPoint(e) : Point {
    
    let p = {
      x: e.clientX, 
      y: e.clientY
    }
    if (!p.x) {
      p.x = e.touches[0].clientX;
    }
    if (!p.y) {
      p.y = e.touches[0].clientY;
    }
    p.x -= this.platform.width() / 2;
    p.y -= this.platform.height() / 2;
    p.x /= this.maps.current.state.viewport.scale;
    p.y /= this.maps.current.state.viewport.scale;
    p.x += this.maps.current.state.viewport.center.x;
    p.y += this.maps.current.state.viewport.center.y;
    return p;
  }

  throttleMouseMove(e) {
    let time = new Date().getTime();
    if ((time - this.previousCall) < 10) { return; }
    this.previousCall = time;
    this.onMouseMove(e);
  }

  onMouseDown(e) {
    if (this.maps.mouseEvent) {
      this.events.publish("mouseDown" + this.maps.mouseEvent, this.getLocalPoint(e));
    }
  }

  onMouseUp(e) {
    if (this.maps.mouseEvent) {
      this.events.publish("mouseUp" + this.maps.mouseEvent, this.getLocalPoint(e));
    }
  }

  onMouseMove(e) {
    if (this.maps.mouseEvent) {
      this.events.publish("mouseMove" + this.maps.mouseEvent, this.getLocalPoint(e));
    }
  }
}
