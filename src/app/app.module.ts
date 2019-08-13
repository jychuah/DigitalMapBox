import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MapSocketService } from './map-socket.service';
import { FileModalPageModule } from './file-modal/file-modal.module';
import { ViewsModalPageModule } from './views-modal/views-modal.module';

@NgModule({
  declarations: [
    AppComponent, 
  ],
  entryComponents: [
  ],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    FileModalPageModule,
    ViewsModalPageModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    MapSocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
