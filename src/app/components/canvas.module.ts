import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BaseCanvasComponent } from './base-canvas/base-canvas.component';
import { MapCanvasComponent } from './map-canvas/map-canvas.component';
import { DrawingCanvasComponent } from './drawing-canvas/drawing-canvas.component';
import { MapNavComponent } from './map-nav/map-nav.component';
import { MiniMapCanvasComponent} from './mini-map-canvas/mini-map-canvas.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  entryComponents: [
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  declarations: [
    DrawingCanvasComponent,
    MapNavComponent,
    BaseCanvasComponent,
    MapCanvasComponent,
    MiniMapCanvasComponent
  ],
  exports: [
    DrawingCanvasComponent,
    MapNavComponent,
    BaseCanvasComponent,
    MapCanvasComponent,
    MiniMapCanvasComponent
  ]
})
export class CanvasModule {}
