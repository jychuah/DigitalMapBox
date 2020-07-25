import { Injectable, NgZone } from '@angular/core';
import * as io from 'socket.io-client';
import { Events, Platform } from '@ionic/angular';
import { ServerState, Region, Vector} from './types';

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
    viewport: {
      width: 0,
      height: 0
    },
    camera: {
      center: {
        x: 0,
        y: 0
      },
      scale: 1.0,
    },
    regions: [ ],
    vectors: [ ]
  }
  public image: any = new Image();
  private ipRegex = new RegExp(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
  public penColor: string = "#ffffff";

  public localCameras: any = {
    gm: this.server.camera,
    player: this.server.camera
  }

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

  onResize() {
    let time = new Date().getTime();
    if ((time - this.previousCall) < 10) { return; }
    this.previousCall = time;
  }

  regionHandler(region: Region) {
    let index = this.server.regions.findIndex(r => r.id === region.id);
    if (index > -1) {
      this.server.regions[index] = region;
    } else {
      this.server.regions.push(region);
    }
    this.events.publish("redraw");
  }

  publishRegion(region: Region) {
    this.emit("region", region);
  }

  publishVector(vector: Vector) {
    this.emit("vector");
  }

  publishCamera(camera: string) {
    this.socket.emit("camera", this.localCameras[camera]);
  }

  erasingHandler(erasedIDs) {
    this.server.vectors = this.server.vectors.filter(
      (vector) => !erasedIDs.includes(vector)
    );
    this.events.publish("redraw");
  }

  connect() {
    console.log("Connecting to", this.url);
    this.socket = io(this.url);
    this.socket.on("DigitalMapBox", (data) => {
      if (data.event == "sync") {
        this.server = data.data;
        this.image.src = this.url + this.server.path;
        this.localCameras.player = this.server.camera;
        this.localCameras.gm = this.server.camera;
        console.log("Sync state", this.server);
        console.log("Loading", this.image.src);
      }
      if (data.event == "camera") {
        this.server.camera = data.data;
        this.localCameras.player = data.data;
        this.events.publish("redraw");
      }
      if (data.event == "vector") {
        this.server.vectors.push(data.data);
      }
      if (data.event == "region") {
        this.regionHandler(data.data);
      }
      if (data.event == "erasing") {
        this.erasingHandler(data.data);
      }
      this.events.publish(data.event, data.data);
    });
  }

  emit(event: string, data: any = "") {
    this.socket.emit(event, data);
  }
}
