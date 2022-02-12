import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {FormsModule} from "@angular/forms";
import { WebStorageModule } from 'ngx-store';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent
  ],
	imports: [
		BrowserModule,
		FormsModule,
  WebStorageModule.forRoot(),
  BrowserAnimationsModule
	],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
