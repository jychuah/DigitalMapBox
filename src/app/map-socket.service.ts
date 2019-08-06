import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapSocketService {
  socket: any = null;
  events: Observable<any> = null;
  url: string = "http://localhost:3000";

  constructor() { 
    this.connect()
  }

  connect(url: string = "http://localhost:3000") {
    this.url = url;
    this.socket = io(this.url);
  }

  subscribe(eventName): Observable<any> {
    return new Observable(
      (observer) => {
        this.socket.on(eventName, (data) => observer.next(data));
      }
    )
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}
