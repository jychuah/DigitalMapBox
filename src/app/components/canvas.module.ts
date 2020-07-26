import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BaseCanvasComponent } from './base-canvas/base-canvas.component';
import { MapCanvasComponent } from './map-canvas/map-canvas.component';
import { DrawingCanvasComponent } from './drawing-canvas/drawing-canvas.component';
import { MapNavComponent } from './map-nav/map-nav.component';
import { MiniMapCanvasComponent} from './mini-map-canvas/mini-map-canvas.component';
import { ColorSelectComponent } from './color-select/color-select.component';
import { FormsModule } from '@angular/forms';
import { FogCanvasComponent } from './fog-canvas/fog-canvas.component';
import { RegionCanvasComponent } from './region-canvas/region-canvas.component';
import { ControlComponent } from './control/control.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  entryComponents: [
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    FontAwesomeModule
  ],
  declarations: [
    DrawingCanvasComponent,
    MapNavComponent,
    BaseCanvasComponent,
    MapCanvasComponent,
    MiniMapCanvasComponent,
    ColorSelectComponent,
    FogCanvasComponent,
    ControlComponent,
    RegionCanvasComponent
  ],
  exports: [
    DrawingCanvasComponent,
    MapNavComponent,
    BaseCanvasComponent,
    MapCanvasComponent,
    MiniMapCanvasComponent,
    ColorSelectComponent,
    FogCanvasComponent,
    ControlComponent,
    RegionCanvasComponent
  ]
})
export class CanvasModule {}
