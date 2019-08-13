import { Component, AfterViewInit } from '@angular/core';
import { MapSocketService } from '../map-socket.service';
import { Platform, ModalController } from '@ionic/angular';
import { FileModalPage } from '../file-modal/file-modal.page';
import { ViewsModalPage } from '../views-modal/views-modal.page';
import { ToastController, Events } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
  public ui: boolean = false;
  public saving: boolean = false;

  constructor(private maps: MapSocketService, private platform: Platform,
              private modalController: ModalController, private events: Events,
              private toast: ToastController) {
  }

  ngAfterViewInit() {
    this.maps.emit('sync');
    this.events.subscribe("savecomplete", () => {
      this.saving = false;
      this.toastSaved();
    });
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
    if (this.maps.server.currentView && this.maps.server.currentView.length) {
      return this.maps.server.currentView;
    }
    return "(Global)";
  }

  saveMetadata() {
    this.saving = true;
    this.maps.emit('save');
  }

  toggleUI() {
    this.ui = !this.ui;
  }

  filenameInfo() {
    if (!this.maps.server.path || !this.maps.server.path.length) {
      return "(None)";
    }
    return this.maps.server.path;
  }

  connectionInfo() {
    if (!this.ui) {
      return this.maps.server.hostname + " (" + this.maps.server.ip + ")";
    }
    return ((this.maps.socket.connected) ? "Connected to " : "Disconnected from ") + this.maps.url;
  }
}
