import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MapSocketService } from '../map-socket.service';
import { Platform, ModalController } from '@ionic/angular';
import { FileModalPage } from '../file-modal/file-modal.page';
import { Events } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
  public ui: boolean = false;
  public serverInfo: any = {
    "ip": "",
    "hostname": "",
    "filename": ""
  }

  constructor(private maps: MapSocketService, private platform: Platform,
              private modalController: ModalController, private events: Events) {
  }

  ngAfterViewInit() {
    this.events.subscribe('info', (data) => {
      this.serverInfo = data;
    });
    this.maps.emit('info');
  }

  async presentFileModal() {
    const modal = await this.modalController.create({
      component: FileModalPage,
    });
    await modal.present();
    await modal.onWillDismiss();
  }


  toggleUI() {
    this.ui = !this.ui;
  }

  filenameInfo() {
    if (!this.serverInfo.filename || !this.serverInfo.filename.length) {
      return "(None)";
    }
    return this.serverInfo.filename;
  }

  connectionInfo() {
    if (!this.ui) {
      return this.serverInfo.hostname + " (" + this.serverInfo.ip + ")";
    }
    return ((this.maps.socket.connected) ? "Connected to " : "Disconnected from ") + this.maps.url;
  }
}
