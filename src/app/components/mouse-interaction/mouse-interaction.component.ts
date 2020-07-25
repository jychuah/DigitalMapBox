import { Component, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Platform, Events } from '@ionic/angular';
import { MapSocketService } from '../../map-socket.service';
import { Point } from '../../types';

@Component({
  selector: 'mouse-interaction',
  templateUrl: './mouse-interaction.component.html'
})
export class MouseInteractionComponent implements AfterViewInit {
  @ViewChild('div', {static: false}) divEl: ElementRef;
  @Input('groups') groups: string[] = [ "" ];
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
      x: 0,
      y: 0
    }
    if ("clientX" in e) {
      p.x = e.clientX;
      p.y = e.clientY;
    } else if (e.touches[0]) {
      p.x = e.touches[0].clientX;
      p.y = e.touches[0].clientY;
    } else if (e.changedTouches[0]) {
      p.x = e.changedTouches[0].clientX;
      p.y = e.changedTouches[0].clientY;
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
    console.log("mousedown");
    let event = {
      type: "mouseDown",
      data: this.getLocalPoint(e)
    }
    this.events.publish("group", event);
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
