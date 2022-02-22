import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {FormsModule} from "@angular/forms";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DEFAULT_CONFIG, NgForageOptions} from "ngforage";

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		BrowserAnimationsModule
	],
	providers: [{
		provide: DEFAULT_CONFIG,
		useValue: {
			name: 'WebBefragung'
		} as NgForageOptions
	}],
	bootstrap: [AppComponent]
})
export class AppModule {
}
