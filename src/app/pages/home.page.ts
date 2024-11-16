import { Component } from '@angular/core';

import { IonButton, IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import MovieItemComponent from 'src/shared/movie-item.component';
import MediaScrollViewComponent from 'src/shared/spacial-navigation/media-scroll-view.component';
import { SpacialFocusableDirective } from 'src/shared/spacial-navigation/spacial-focusable.directive';
import { SpacialParentFocusableDirective } from 'src/shared/spacial-navigation/spacial-parent-focusable.directive';
@Component({
  selector: 'wk-home',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonSpinner,
    MediaScrollViewComponent,
    MovieItemComponent,
    SpacialFocusableDirective,
    SpacialParentFocusableDirective,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="flex flex-col justify-between h-full">
        @if (selectedUpNextToWatch) {
          <div class="h-fit overflow-y-auto">
            @if (selectedUpNextToWatchLoading) {
              <ion-spinner></ion-spinner>
            } @else {
              <ion-button>Watch Trailer</ion-button>
              <ion-button>Watch Episode</ion-button>
            }
          </div>
        }

        <wk-media-scroll-view parentFocusKey="homeTrending" title="Trending">
          @for (movie of movies; track movie.index) {
            <wk-movie-item
              wkSnFocusable
              snParentFocusKey="homeTrending"
              [snPreventScrollOnFocus]="true"
              [snFocusKey]="'home-movie-' + movie.index"
              [index]="movie.index"
              [title]="movie.title"
              (snFocus)="onSpacialFocused(movie)"
            ></wk-movie-item>
          }
        </wk-media-scroll-view>
      </div>
    </ion-content>
  `,
})
export default class HomePage {
  selectedUpNextToWatch: { title: string; releaseDate: string } | undefined = undefined;
  selectedUpNextToWatchLoading = false;

  movies = [
    { title: 'Movie 1', releaseDate: '2024-01-01', index: 1 },
    { title: 'Movie 2', releaseDate: '2024-01-02', index: 2 },
    { title: 'Movie 3', releaseDate: '2024-01-03', index: 3 },
    { title: 'Movie 4', releaseDate: '2024-01-04', index: 4 },
    { title: 'Movie 5', releaseDate: '2024-01-05', index: 5 },
    { title: 'Movie 6', releaseDate: '2024-01-06', index: 6 },
    { title: 'Movie 7', releaseDate: '2024-01-07', index: 7 },
    { title: 'Movie 8', releaseDate: '2024-01-08', index: 8 },
    { title: 'Movie 9', releaseDate: '2024-01-09', index: 9 },
    { title: 'Movie 10', releaseDate: '2024-01-10', index: 10 },
    { title: 'Movie 11', releaseDate: '2024-01-11', index: 11 },
    { title: 'Movie 12', releaseDate: '2024-01-12', index: 12 },
    { title: 'Movie 13', releaseDate: '2024-01-13', index: 13 },
    { title: 'Movie 14', releaseDate: '2024-01-14', index: 14 },
    { title: 'Movie 15', releaseDate: '2024-01-15', index: 15 },
    { title: 'Movie 16', releaseDate: '2024-01-16', index: 16 },
    { title: 'Movie 17', releaseDate: '2024-01-17', index: 17 },
    { title: 'Movie 18', releaseDate: '2024-01-18', index: 18 },
    { title: 'Movie 19', releaseDate: '2024-01-19', index: 19 },
    { title: 'Movie 20', releaseDate: '2024-01-20', index: 20 },
  ];

  onSpacialFocused(movie: { title: string; releaseDate: string; index: number }) {
    this.selectedUpNextToWatch = movie;

    this.selectedUpNextToWatchLoading = true;

    setTimeout(() => {
      this.selectedUpNextToWatchLoading = false;
    }, 1000);
  }
}
