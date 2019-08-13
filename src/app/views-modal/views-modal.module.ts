import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ViewsModalPage } from './views-modal.page';
import { CanvasModule } from '../components/canvas.module';

const routes: Routes = [
  {
    path: '',
    component: ViewsModalPage
  }
];

@NgModule({
  imports: [
    CanvasModule,
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ViewsModalPage]
})
export class ViewsModalPageModule {}
