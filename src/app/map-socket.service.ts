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
    currentView: -1
  }
  public image: any = new Image();
  public current: View = this.server.global;
  public isLocal: boolean = false;
  private ipRegex = new RegExp(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
  public localViewportMetrics: any = null;

  previousCall: number = null;

  constructor(public events: Events, public zone: NgZone, public platform: Platform) { 
    this.url = window.location.origin.slice(0, -(window.location.port.length + 1)) + ":3000";
    this.connect();
    this.image.onload = () => {
      console.log("Image Loaded. Publishing redraw event.");
      this.events.publish("imageloadcomplete");
      this.events.publish("redraw")
    }
    this.determineLocalIp();
    this.previousCall = new Date().getTime();
  }

  imageLoaded() : boolean {
    return this.server.path && this.server.path.length > 0;
  }

  determineLocalIp() {
    window['RTCPeerConnection'] = this.getRTCPeerConnection();

    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(pc.setLocalDescription.bind(pc));

    pc.onicecandidate = (ice) => {
      this.zone.run(() => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          return;
        }
        let localIp = this.ipRegex.exec(ice.candidate.candidate)[1];
        if (localIp === this.server.ip) {
          this.isLocal = true;
          console.log("This client is local to the server");
          this.platform.ready().then(
            () => {
              this.onResize();
              this.platform.resize.subscribe(() => {
                this.onResize();
              });
            }
          );
        }
        pc.onicecandidate = () => {};
        pc.close();
      });
    };
  }

  onResize() {
    let time = new Date().getTime();
    if ((time - this.previousCall) < 10) { return; }
    this.previousCall = time;
    if (this.isLocal) {
      this.emit(
        'localviewport', 
        {
          width: this.platform.width(), 
          height: this.platform.height() 
        }
      );
    }
  }

  private getRTCPeerConnection() {
    if ("RTCPeerConnection" in window) {
      return window["RTCPeerConnection"];
    }
    if ("mozRTCPeerConnection" in window) {
      return window["mozRTCPeerConnection"];
    }
    if ("webkitRTCPeerConnection" in window) {
      return window["webkitRTCPeerConnection"];
    }
    return null;
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
        this.determineLocalIp();
      }
      if (data.event == "localviewport") {
        this.localViewportMetrics = data.data;
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
        this.globalViewReset();''
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
