import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapSocketService {
  socket: any = null;
  events: Observable<any> = null;

  constructor() { 
  }

  connect(url: string): Observable<any> {
    this.socket = io(url);

    this.events = new Observable(
      (observer) => {
        this.socket.on('drawing', (data) => observer.next(data));
      }
    );
    return this.events;
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}
