import { Component, OnInit } from '@angular/core';
import { faEraser, faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { MapSocketService } from '../../map-socket.service';
import { Events } from '@ionic/angular';
@Component({
  selector: 'control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss'],
})
export class ControlComponent implements OnInit {
  public faEraser: any = faEraser;
  public faUserSecret: any = faUserSecret;
  public gmlayer: boolean = false;
  public erasing: boolean = false;
  public drawing: boolean = false;
  public revealing: boolean = false;
  public gm: boolean = false;

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
    if (this.erasing) {
      this.maps.mouseEvent = (this.gm ? 'gm' : '') + 'erase';
    }
    if (this.drawing) {
      this.maps.mouseEvent = (this.gm ? 'gm' : '') + 'draw';
    }
  }

  lockToggle() {

  }

  gmToggle() {
    this.setDrawingEvents();
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
    //this.maps.updateView(this.maps.server.currentView);
  }
}
