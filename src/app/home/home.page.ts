import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapSocketService } from '../map-socket.service';
import { Platform, ModalController } from '@ionic/angular';
import { FileModalPage } from '../file-modal/file-modal.page';
import { ViewsModalPage } from '../views-modal/views-modal.page';
import { ToastController, Events, AlertController } from '@ionic/angular';
import { faEraser } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
  public faEraser: any = faEraser;
  public saving: boolean = false;
  public gmlayer: boolean = false;
  public erasing: boolean = false;
  public drawing: boolean = false;
  public revealing: boolean = false;

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

  penColor($event) {
    this.maps.penColor = $event;
  }

  isDrawing() : boolean {
    return this.maps.mouseEvent === "draw" || this.maps.mouseEvent === "gmdraw";
  }

  isErasing() : boolean {
    return this.maps.mouseEvent === "erase" || this.maps.mouseEvent === "gmerase"; 
  }

  gmlayerToggle() {
    this.setDrawingEvents();
  }

  drawClick() {
    this.erasing = false;
    this.drawing = !this.drawing;
    this.revealing = false;
    this.setDrawingEvents();
  }

  eraseClick() {
    this.erasing = !this.erasing;
    this.drawing = false;
    this.revealing = false;
    this.setDrawingEvents();
  }

  setDrawingEvents() {
    this.maps.mouseEvent = null;
    if (this.erasing) {
      this.maps.mouseEvent = (this.gmlayer ? 'gm' : '') + 'erase';
    }
    if (this.drawing) {
      this.maps.mouseEvent = (this.gmlayer ? 'gm' : '') + 'draw';
    }
  }

  setRevealing() {
    this.erasing = false;
    this.drawing = false;
    this.revealing = !this.revealing;
    if (this.revealing) {
      this.maps.mouseEvent = 'reveal';
    } else {
      this.maps.mouseEvent = null;
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
