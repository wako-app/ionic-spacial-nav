import { Component } from '@angular/core';
import MovieItemComponent from 'src/shared/movie-item.component';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import SpacialScrollViewComponent from 'src/shared/spacial-navigation/spacial-scroll-view.component';
import { SpacialFocusableDirective } from 'src/shared/spacial-navigation/spacial-focusable.directive';

@Component({
  selector: 'wk-home',
  standalone: true,
  imports: [
    MovieItemComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    SpacialScrollViewComponent,
    SpacialFocusableDirective,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="flex flex-col gap-4 p-4">
        <wk-spacial-scroll-view parentFocusKey="homeTrending" title="Trending">
          @for (movie of movies; track movie.index) {
          <wk-movie-item
            wkSnFocusable
            snParentFocusKey="homeTrending"
            [snFocusKey]="'movie-trending-' + movie.index"
            [index]="movie.index"
            [title]="movie.title"
          ></wk-movie-item>
          }
        </wk-spacial-scroll-view>
        <wk-spacial-scroll-view parentFocusKey="homePopular" title="Popular">
          @for (movie of movies; track movie.index) {
          <wk-movie-item
            wkSnFocusable
            snParentFocusKey="homePopular"
            [snFocusKey]="'movie-popular-' + movie.index"
            [index]="movie.index"
            [title]="movie.title"
          ></wk-movie-item>
          }
        </wk-spacial-scroll-view>
        <wk-spacial-scroll-view parentFocusKey="homeUpcoming" title="Upcoming">
          @for (movie of movies; track movie.index) {
          <wk-movie-item
            wkSnFocusable
            snParentFocusKey="homeUpcoming"
            [snFocusKey]="'movie-upcoming-' + movie.index"
            [index]="movie.index"
            [title]="movie.title"
          ></wk-movie-item>
          }
        </wk-spacial-scroll-view>
      </div>
    </ion-content>
  `,
})
export default class HomePage {
  movies = [
    { title: 'Movie 1', index: 1 },
    { title: 'Movie 2', index: 2 },
    { title: 'Movie 3', index: 3 },
    { title: 'Movie 4', index: 4 },
    { title: 'Movie 5', index: 5 },
    { title: 'Movie 6', index: 6 },
    { title: 'Movie 7', index: 7 },
    { title: 'Movie 8', index: 8 },
    { title: 'Movie 9', index: 9 },
    { title: 'Movie 10', index: 10 },
    { title: 'Movie 11', index: 11 },
    { title: 'Movie 12', index: 12 },
    { title: 'Movie 13', index: 13 },
    { title: 'Movie 14', index: 14 },
    { title: 'Movie 15', index: 15 },
    { title: 'Movie 16', index: 16 },
    { title: 'Movie 17', index: 17 },
    { title: 'Movie 18', index: 18 },
    { title: 'Movie 19', index: 19 },
    { title: 'Movie 20', index: 20 },
  ];
}
