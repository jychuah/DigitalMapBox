import { Component, OnInit } from '@angular/core';
import { faEraser } from '@fortawesome/free-solid-svg-icons';
import { MapSocketService } from '../../map-socket.service';
import { Events } from '@ionic/angular';
@Component({
  selector: 'control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss'],
})
export class ControlComponent implements OnInit {
  public faEraser: any = faEraser;
  public gmlayer: boolean = false;
  public erasing: boolean = false;
  public drawing: boolean = false;
  public revealing: boolean = false;

  constructor(public maps: MapSocketService,  private events: Events) { }

  ngOnInit() {}

  penColor($event) {
    this.maps.penColor = $event;
  }

  isDrawing() : boolean {
    return this.maps.mouseEvent === "draw" || this.maps.mouseEvent === "gmdraw";
  }

  isErasing() : boolean {
    return this.maps.mouseEvent === "erase" || this.maps.mouseEvent === "gmerase"; 
  }

  lockToggle() {
    this.setDrawingEvents();
    this.maps.current.state.viewport.center = this.maps.server.localViewport.center;
    this.maps.current.state.viewport.scale = this.maps.server.localViewport.scale;
    this.events.publish("redraw");
  }

  drawClick() {
    this.erasing = false;
    this.drawing = !this.drawing;
    this.revealing = false;
    this.setDrawingEvents();
  }

  eraseClick() {
    this.erasing = !this.erasing;
    this.drawing = false;
    this.revealing = false;
    this.setDrawingEvents();
  }

  setDrawingEvents() {
    this.maps.mouseEvent = null;
    if (this.erasing) {
      this.maps.mouseEvent = (this.maps.viewLocked ? '' : 'gm') + 'erase';
    }
    if (this.drawing) {
      this.maps.mouseEvent = (this.maps.viewLocked ? '' : 'gm') + 'draw';
    }
  }

  setRevealing() {
    this.erasing = false;
    this.drawing = false;
    this.revealing = !this.revealing;
    if (this.revealing) {
      this.maps.mouseEvent = 'reveal';
    } else {
      this.maps.mouseEvent = null;
    }
  }

  notesChange($event) {
    this.maps.updateView(this.maps.server.currentView);
  }
}
