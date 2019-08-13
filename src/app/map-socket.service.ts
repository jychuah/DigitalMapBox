import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Events } from '@ionic/angular';
import { State } from './types';

@Injectable({
  providedIn: 'root'
})
export class MapSocketService {
  socket: any = null;
  url: string = "http://localhost:3000";

  public state: State = {
    path: "",
    ip: "",
    hostname: "",
    vectors: [ ],
    viewport: {
      center: {
        x: 0,
        y: 0
      },
      scale: 1.0
    }
  }
  public penColor: string = "white";
  public image: any = new Image();

  constructor(public events: Events) { 
    this.url = window.location.origin.slice(0, -(window.location.port.length + 1)) + ":3000";
    this.connect();
    this.image.onload = () => {
      console.log("Image Loaded. Publishing redraw event.");
      this.events.publish("redraw")
    }
  }

  imageLoaded() : boolean {
    return this.state.path && this.state.path.length > 0;
  }

  connect() {
    console.log("Connecting to", this.url);
    this.socket = io(this.url);
    this.socket.on("DigitalMapBox", (data) => {
      if (data.event == "sync") {
        this.state = data.data;
        this.image.src = this.url + this.state.path;
        console.log("Loading", this.image.src);
      }
      if (data.event == "viewport") {
        this.state.viewport = data.data;
      }
      if (data.event == "drawing") {
        this.state.vectors.push(data.data);
      }
      this.events.publish(data.event, data.data);
    });
  }

  emit(event: string, data: any = "") {
    this.socket.emit(event, data);
  }
}
