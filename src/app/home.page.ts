import { Component } from '@angular/core';
import MovieItemComponent from 'src/shared/movie-item.component';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'wk-home',
  standalone: true,
  imports: [MovieItemComponent, IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <wk-movie-item [index]="1"></wk-movie-item>
    </ion-content>
  `,
})
export default class HomePage {}
