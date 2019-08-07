import { Component, ViewChild, ElementRef } from '@angular/core';
import { MapSocketService } from '../map-socket.service';
import { Observable } from 'rxjs';
import { Platform, ModalController } from '@ionic/angular';
import { FileModalPage } from '../file-modal/file-modal.page';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  constructor(private maps: MapSocketService, private platform: Platform,
              private modalController: ModalController) {
  }

  async presentFileModal() {
    const modal = await this.modalController.create({
      component: FileModalPage,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
  }
}
