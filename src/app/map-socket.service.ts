import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Events } from '@ionic/angular';
import { ServerState, State, View } from './types';

@Injectable({
  providedIn: 'root'
})
export class MapSocketService {
  socket: any = null;
  url: string = "http://localhost:3000";

  public server: ServerState = {
    path: "",
    ip: "",
    hostname: "",
    global: {
      name: "global",
      color: "#ffffff",
        state: {
        vectors: [ ],
        viewport: {
          center: {
            x: 0,
            y: 0
          },
          scale: 1.0
        }
      }
    },
    views: [ ],
    currentView: ""
  }
  public image: any = new Image();
  public current: View = this.server.global;

  constructor(public events: Events) { 
    this.url = window.location.origin.slice(0, -(window.location.port.length + 1)) + ":3000";
    this.connect();
    this.image.onload = () => {
      console.log("Image Loaded. Publishing redraw event.");
      this.events.publish("redraw")
    }
  }

  imageLoaded() : boolean {
    return this.server.path && this.server.path.length > 0;
  }

  connect() {
    console.log("Connecting to", this.url);
    this.socket = io(this.url);
    this.socket.on("DigitalMapBox", (data) => {
      if (data.event == "sync") {
        this.server = data.data;
        this.image.src = this.url + this.server.path;
        this.setCurrentView();
        console.log("Loading", this.image.src);
      }
      if (data.event == "viewport") {
        this.current.state.viewport = data.data;
      }
      if (data.event == "drawing") {
        this.current.state.vectors.push(data.data);
      }
      if (data.event == "changeview") {
        this.setCurrentView(data.data);
      }
      if (data.event == "newview") {
        this.server.views.push(data.data);
      }
      this.events.publish(data.event, data.data);
    });
  }

  emit(event: string, data: any = "") {
    this.socket.emit(event, data);
  }
  
  setCurrentView(viewname: string = "") {
    this.server.currentView = viewname;
    this.current = this.getView(viewname);
    this.events.publish("redraw");
  }

  getView(viewname: string = null) {
    if (!viewname || viewname.length == 0) {
      return this.server.global;
    }
    return this.server.views.find((view) => view.name == viewname);
  }
}
