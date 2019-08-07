import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DrawingCanvasComponent } from './drawing-canvas/drawing-canvas.component';
import { MapNavComponent } from './map-nav/map-nav.component';

@NgModule({
  entryComponents: [
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  declarations: [
    DrawingCanvasComponent,
    MapNavComponent
  ],
  exports: [
    DrawingCanvasComponent,
    MapNavComponent
  ]
})
export class CanvasModule {}
