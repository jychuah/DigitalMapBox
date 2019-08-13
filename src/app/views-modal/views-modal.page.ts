import { Component, OnInit } from '@angular/core';
import { View, State } from '../types';
import { MapSocketService } from '../map-socket.service';
@Component({
  selector: 'app-views-modal',
  templateUrl: './views-modal.page.html',
  styleUrls: ['./views-modal.page.scss'],
})
export class ViewsModalPage implements OnInit {

  constructor(public maps: MapSocketService) { }

  ngOnInit() {
  }

  createView(name: string, color: string = "white") {
    let newView: View = {
      name: name,
      color: color,
      state: {
        viewport: JSON.parse(JSON.stringify(this.maps.current.viewport)),
        vectors: [ ]
      }
    }

  }

}
