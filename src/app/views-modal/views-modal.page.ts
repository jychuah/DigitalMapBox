import { Component, OnInit } from '@angular/core';
import { View } from '../types';
import { MapSocketService } from '../map-socket.service';
import { Events, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-views-modal',
  templateUrl: './views-modal.page.html',
  styleUrls: ['./views-modal.page.scss'],
})
export class ViewsModalPage implements OnInit {

  constructor(public maps: MapSocketService, public events: Events, public alerts: AlertController) { }

  ngOnInit() {
  }



  selectColor($event, viewIndex: number) {
    this.maps.getView(viewIndex).color = $event;
    this.maps.updateView(viewIndex);
    this.events.publish("redraw");
  }

  async presentAlertViewName(callback, viewname: string = "") {
    const alert = await this.alerts.create(
      {
        header: "Please enter a name for this view",
        inputs: [
          {
            name: "viewname",
            type: "text",
            placeholder: "View Name",
            value: viewname
          }
        ],
        buttons: [
          {
            text: "Cancel",
            role: "cancel",
            cssClass: "secondary"
          },
          {
            text: "OK",
            handler: (data) => {
              callback(data.viewname);
            }
          }
        ]
      }
    );
    await alert.present();
  }

  changeViewName(currentName: string, viewIndex: number) {
    this.presentAlertViewName(
      (viewname) => {
        this.maps.server.views[viewIndex].name = viewname;
        this.maps.updateView(viewIndex);
      },
      currentName
    )
  }

  createView() {
    this.presentAlertViewName(
      (viewname) => {
        let newView: View = {
          name: viewname,
          color: "#ffffff",
          state: {
            viewport: JSON.parse(JSON.stringify(this.maps.current.state.viewport)),
            vectors: [ ],
            regions: [ ]
          }
        }
        this.maps.newView(newView);
      }
    )
  }
}
