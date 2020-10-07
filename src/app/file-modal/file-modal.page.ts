import { Component, OnInit } from '@angular/core';
import { MapSocketService } from '../map-socket.service';
import { Observable } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { Events } from '@ionic/angular';
@Component({
  selector: 'app-file-modal',
  templateUrl: './file-modal.page.html',
  styleUrls: ['./file-modal.page.scss'],
})
export class FileModalPage implements OnInit {
  public loading: boolean = true;
  socketEvents: Observable<any> = null;
  public subdirs: string[] = [];
  public images: string[] = [];

  constructor(public maps: MapSocketService, 
              private modal: ModalController,
              private events: Events) { }

  ngOnInit() {
    this.events.subscribe("filelist", (data) => {
      this.subdirs = data.subdirs;
      this.images = data.images;
      this.loading = false;
    });
    this.maps.emit('filelist', this.maps.path);
  }

  imgPath(image) {
    return this.maps.url + this.maps.path + "/" + image;
  }

  dirUp() {
    this.maps.path = this.maps.path.slice(0, -1).split("/").slice(0, -1).join("/");
    this.maps.emit('filelist', this.maps.path);
  }

  navigate(subdir) {
    this.loading = true;
    this.subdirs = [ ];
    this.images = [ ];
    this.maps.path += "/" + subdir;
    this.maps.emit('filelist', this.maps.path);
  }

  select(image) {
    this.maps.emit('imageload', this.maps.path + "/" + image);
    this.modal.dismiss();
  }

}
