import { Component, OnInit } from '@angular/core';
import { MapSocketService } from '../map-socket.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-file-modal',
  templateUrl: './file-modal.page.html',
  styleUrls: ['./file-modal.page.scss'],
})
export class FileModalPage implements OnInit {
  public loading: boolean = true;
  events: Observable<any> = null;
  public path: string = "/";
  public subdirs: string[] = [];
  public images: string[] = [];

  constructor(private maps: MapSocketService) { }

  ngOnInit() {
    this.events = this.maps.subscribe('filelist');
    this.events.subscribe(
      (data) => {
        this.subdirs = data.subdirs;
        this.images = data.images;
      }
    );
    this.maps.emit('filelist', this.path);
  }

  imgPath(image) {
    return this.maps.url + "/img" + this.path + image;
  }

  dirUp() {
    this.path = this.path.slice(0, -1).split("/").slice(0, -1).join("/");
    if (this.path == "") {
      this.path = "/";
    }
    this.maps.emit('filelist', this.path);
  }

  navigate(subdir) {
    this.path += subdir + "/";
    this.maps.emit('filelist', this.path);
  }

  select(image) {
    this.maps.emit('loadimage', this.path + image);
  }
}
