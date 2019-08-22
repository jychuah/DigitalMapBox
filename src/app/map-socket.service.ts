import { Injectable, NgZone } from '@angular/core';
import * as io from 'socket.io-client';
import { Events, Platform } from '@ionic/angular';
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
        regions: [ ],
        gmnotes: [ ]
      }
    },
    views: [ ],
    currentView: -1,
    localViewport: {
      center: {
        x: 0,
        y: 0
      },
      scale: 1.0,
      width: 0,
      height: 0
    }
  }
  public image: any = new Image();
  public current: View = this.server.global;
  public isLocal: boolean = false;
  private ipRegex = new RegExp(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
  public penColor: string = "#ffffff";
  public viewLocked: boolean = false;

  previousCall: number = null;

  constructor(public events: Events, public zone: NgZone, public platform: Platform) { 
    this.url = window.location.origin.slice(0, -(window.location.port.length + 1)) + ":3000";
    this.connect();
    this.image.onload = () => {
      console.log("Image Loaded. Publishing redraw event.");
      this.events.publish("imageloadcomplete");
      this.events.publish("redraw")
    }
    this.previousCall = new Date().getTime();
  }

  imageLoaded() : boolean {
    return this.server.path && this.server.path.length > 0;
  }

  notifyIsLocal() {
    this.isLocal = true;
    console.log("This client is local to the server");
    this.platform.ready().then(
      () => {
        this.pushLocalViewport();
        this.platform.resize.subscribe(() => {
          this.onResize();
        });
      }
    );
  }

  pushLocalViewport() {
    this.server.localViewport.width = this.platform.width();
    this.server.localViewport.height = this.platform.height();
    this.emit('localviewport', this.server.localViewport);
  }

  onResize() {
    let time = new Date().getTime();
    if ((time - this.previousCall) < 10) { return; }
    this.previousCall = time;
    this.pushLocalViewport();
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
      if (data.event == "localviewport") {
        this.server.localViewport = data.data;
        this.events.publish("redraw");
      }
      if (data.event == "viewport") {
        this.current.state.viewport = data.data;
      }
      if (data.event == "drawing") {
        this.current.state.vectors.push(data.data);
      }
      if (data.event == "gmdrawing") {
        this.current.state.gmnotes.push(data.data);
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
        view.notes = data.data.notes;
        this.events.publish("redraw");
      }
      if (data.event == "globalreset") {
        this.globalViewReset();
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
    if (!("gmnotes" in this.current.state)) {
      this.current.state.gmnotes = [ ];
    }
    this.penColor = this.current.color;
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
      color: view.color,
      notes: view.notes
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

  globalViewReset() {
    this.server.global.state.vectors = [ ];
    this.server.global.state.regions = [ ];
    this.server.global.state.gmnotes = [ ];
    this.events.publish("redraw");
  }

  resetGlobalView() {
    this.globalViewReset();
    this.emit("globalreset");
  }

  toggleUI() {
    this.ui = !this.ui;
    this.events.publish("redraw");
  }
}
