import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapSocketService } from '../map-socket.service';
import { Platform, ModalController } from '@ionic/angular';
import { FileModalPage } from '../file-modal/file-modal.page';
import { ViewsModalPage } from '../views-modal/views-modal.page';
import { ToastController, Events, AlertController } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
  public saving: boolean = false;

  constructor(public maps: MapSocketService, private platform: Platform,
              private modalController: ModalController, private events: Events,
              private toast: ToastController, private alerts: AlertController,
              private activated: ActivatedRoute) {
  }

  ngAfterViewInit() {
    this.maps.emit('sync');
    this.events.subscribe("savecomplete", () => {
      this.saving = false;
      this.toastSaved();
    });
    this.events.subscribe("shutdown", () => {
      this.toastShutdown();
    });
    this.activated.queryParams.subscribe(
      (params) => {
        if (params.local && params.local === "true") {
          this.maps.notifyIsLocal();
        }
      }
    )
  }

  notesChange($event) {
    this.maps.updateView(this.maps.server.currentView);
  }

  async toastShutdown() {
    const toast = await this.toast.create({
      message: 'Shutting Down',
      duration: 10000,
      position: "middle"
    });
    toast.present(); 
  }

  async toastSaved() {
    const toast = await this.toast.create({
      message: 'Saved!',
      duration: 2000,
      position: "bottom"
    });
    toast.present();
  }

  async presentFileModal() {
    const modal = await this.modalController.create({
      component: FileModalPage,
    });
    await modal.present();
    await modal.onWillDismiss();
  }

  async presentViewsModal() {
    const modal = await this.modalController.create({
      component: ViewsModalPage,
    });
    await modal.present();
    await modal.onWillDismiss();
  }

  currentViewInfo() {
    if (this.maps.server.currentView == -1) {
      return "(Global)"
    }
    return this.maps.current.name;
  }

  saveMetadata() {
    this.saving = true;
    this.maps.emit('save');
  }

  filenameInfo() {
    if (!this.maps.server.path || !this.maps.server.path.length) {
      return "(None)";
    }
    return this.maps.server.path;
  }

  connectionInfo() {
    if (!this.maps.ui) {
      return this.maps.server.hostname + " (" + this.maps.server.ip + ")";
    }
    return ((this.maps.socket.connected) ? "Connected to " : "Disconnected from ") + this.maps.url;
  }

  layerStyle(mouseEvent: string) {
    if (mouseEvent === this.maps.mouseEvent) {
      return "primary";
    }
    return "light"
  }

  setMouseEvents(mouseEvent: string) {
    if (this.maps.mouseEvent === mouseEvent) {
      this.maps.mouseEvent = null;
    } else {
      this.maps.mouseEvent = mouseEvent;
    }
  }

  async presentShutdownAlert() {
    const alert = await this.alerts.create(
      {
        header: "Shut down Digital Map Box?",
        buttons: [
          {
            text: "Cancel",
            role: "cancel",
            cssClass: "secondary",
          },
          {
            text: "Shut down",
            handler: () => {
              this.maps.emit("shutdown");
            }
          }
        ]
      }
    )
    await alert.present();
  }

  async presentFanAlert() {
    const alert = await this.alerts.create(
      {
        header: "Fan Control",
        buttons: [
          {
            text: "On",
            role: "cancel",
            cssClass: "primary",
            handler: () => {
              this.maps.emit("fan", 1);
            }
          },
          {
            text: "Off",
            cssClass: "secondary",
            handler: () => {
              this.maps.emit("fan", 0);
            }
          }
        ]
      }
    )
    await alert.present();
  }
}
