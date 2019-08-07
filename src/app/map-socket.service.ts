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
    this.events.publish("reconnect");
  }

  subscribe(eventName): Observable<any> {
    return new Observable(
      (observer) => {
        this.socket.on(eventName, (data) => observer.next(data));
      }
    )
  }

  emit(event: string, data: any = "") {
    this.socket.emit(event, data);
  }
}
