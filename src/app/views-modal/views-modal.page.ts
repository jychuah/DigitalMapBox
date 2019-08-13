import { Component, OnInit } from '@angular/core';
import { View } from '../types';
import { MapSocketService } from '../map-socket.service';
import { Events } from '@ionic/angular';

@Component({
  selector: 'app-views-modal',
  templateUrl: './views-modal.page.html',
  styleUrls: ['./views-modal.page.scss'],
})
export class ViewsModalPage implements OnInit {

  constructor(public maps: MapSocketService, public events: Events) { }

  ngOnInit() {
  }

  createView(name: string, color: string = "white") {
    let newView: View = {
      name: name,
      color: color,
      state: {
        viewport: JSON.parse(JSON.stringify(this.maps.current.state.viewport)),
        vectors: [ ]
      }
    }
  }

  selectColor($event, viewname: string) {
    this.maps.getView(viewname).color = $event;
    this.events.publish("redraw");
  }

  selectView(viewname: string) {
    console.log("Selected view", viewname);
  }

  newView() {
    
  }
}
