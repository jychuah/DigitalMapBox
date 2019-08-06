import { Component, ViewChild, ElementRef } from '@angular/core';
import { MapSocketService } from '../map-socket.service';
import { Observable } from 'rxjs';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  constructor(private maps: MapSocketService, private platform: Platform) {
  }
}
