import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DrawingCanvasComponent } from './drawing-canvas/drawing-canvas.component';

@NgModule({
  entryComponents: [
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  declarations: [
    DrawingCanvasComponent
  ],
  exports: [
    DrawingCanvasComponent
  ]
})
export class CanvasModule {}
