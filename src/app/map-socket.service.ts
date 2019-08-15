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

  public mouseEvent: string = null;
  public ui: boolean = false;

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
        },
        regions: [ ]
      }
    },
    views: [ ],
    currentView: -1
  }
  public image: any = new Image();
  public current: View = this.server.global;

  constructor(public events: Events) { 
    this.url = window.location.origin.slice(0, -(window.location.port.length + 1)) + ":3000";
    this.connect();
    this.image.onload = () => {
      console.log("Image Loaded. Publishing redraw event.");
      this.events.publish("imageloadcomplete");
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
        this.setCurrentView(this.server.currentView);
        console.log("Loading", this.image.src);
      }
      if (data.event == "viewport") {
        this.current.state.viewport = data.data;
      }
      if (data.event == "drawing") {
        this.current.state.vectors.push(data.data);
      }
      if (data.event == "setview") {
        this.setCurrentView(data.data);
      }
      if (data.event == "newview") {
        this.server.views.push(data.data);
      }
      if (data.event == "updateview") {
        let view = this.getView(data.data.index);
        view.name = data.data.name;
        view.color = data.data.color;
        this.events.publish("redraw");
      }
      if (data.event == "deleteview") {
        this.viewDeleted(data.data);
      }
      if (data.event == "reveal") {
        this.current.state.regions = data.data;
      }
      this.events.publish(data.event, data.data);
    });
  }

  emit(event: string, data: any = "") {
    this.socket.emit(event, data);
  }

  setCurrentView(viewIndex: number = -1) {
    this.server.currentView = viewIndex;
    this.current = this.getView(viewIndex);
    this.events.publish("viewport");
    this.events.publish("redraw");

  }
  
  changeCurrentView(viewIndex: number = -1) {
    this.setCurrentView(viewIndex);
    this.emit("setview", viewIndex);
  }

  getView(viewIndex: number = -1) {
    if (viewIndex == -1) {
      return this.server.global;
    }
    return this.server.views[viewIndex];
  }

  newView(view) {
    this.server.views.push(view);
    this.emit("newview", view);
  }

  updateView(viewIndex) {
    let view = this.getView(viewIndex);
    this.emit("updateview", {
      index: viewIndex,
      name: view.name,
      color: view.color
    });
  }

  viewDeleted(viewIndex: number) {
    if (this.server.currentView == viewIndex) {
      this.server.currentView -= 1;
      this.changeCurrentView(this.server.currentView);
    }
    this.server.views.splice(viewIndex, 1);
  }

  deleteView(viewIndex: number) {
    this.viewDeleted(viewIndex);
    this.emit("deleteview", viewIndex);
  }

  toggleUI() {
    this.ui = !this.ui;
    this.events.publish("redraw");
  }
}
