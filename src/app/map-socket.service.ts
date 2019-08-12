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
    this.connect();
    this.image.onload = () => {
      console.log("Image Loaded. Publishing redraw event.");
      this.events.publish("redraw")
    }
  }

  connect(url: string = "http://localhost:3000") {
    console.log("Connecting to", url);
    this.url = url;
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
      this.events.publish(data.event, data.data);
    });
  }

  emit(event: string, data: any = "") {
    this.socket.emit(event, data);
  }
}
