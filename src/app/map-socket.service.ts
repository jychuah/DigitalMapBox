import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Events } from '@ionic/angular';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapSocketService {
  socket: any = null;
  url: string = "http://localhost:3000";

  constructor(public events: Events) { 
    this.connect()
  }

  connect(url: string = "http://localhost:3000") {
    this.url = url;
    this.socket = io(this.url);
    this.socket.on("DigitalMapBox", (data) => {
      this.events.publish(data.event, data.data);
    });
  }

  emit(event: string, data: any = "") {
    this.socket.emit(event, data);
  }
}
