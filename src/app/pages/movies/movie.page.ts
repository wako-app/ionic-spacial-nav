import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  download,
  downloadOutline,
  heart,
  heartOutline,
  logoYoutube,
  play,
  shareSocial,
  shareSocialOutline,
} from 'ionicons/icons';

interface Movie {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  year: number;
  rating: string;
  duration: string;
}

@Component({
  selector: 'app-movie-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        @if (movie) {
          <ion-title>{{ movie.title }}</ion-title>
        }
      </ion-toolbar>
    </ion-header>

    @if (isLoading) {
      <ion-content fullscreen>
        <ion-spinner class="center"></ion-spinner>
      </ion-content>
    }

    @if (movie) {
      <ion-content>
        <div class="relative">
          <img [src]="movie.imageUrl" [alt]="movie.title" class="w-full h-[300px] object-cover" />
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-24"></div>
        </div>

        <div class="px-4 -mt-12 relative z-10">
          <h1 class="text-2xl font-bold text-white mb-2">{{ movie.title }}</h1>
          <div class="flex items-center gap-3 text-gray-300 mb-4">
            <span>{{ movie.year }}</span>
            <span>{{ movie.rating }}</span>
            <span>{{ movie.duration }}</span>
          </div>

          <div class="flex gap-3 mb-6">
            <ion-button expand="block" color="primary">
              <ion-icon name="play" slot="start"></ion-icon>
              Watch Now
            </ion-button>
            <ion-button expand="block" color="secondary">
              <ion-icon name="logo-youtube" slot="start"></ion-icon>
              Trailer
            </ion-button>
          </div>

          <p class="text-gray-200 leading-relaxed mb-6">
            {{ movie.description }}
          </p>

          <ion-list>
            <ion-item>
              <ion-icon name="heart-outline" slot="start"></ion-icon>
              <ion-label>Add to Favorites</ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="share-social-outline" slot="start"></ion-icon>
              <ion-label>Share</ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="download-outline" slot="start"></ion-icon>
              <ion-label>Download</ion-label>
            </ion-item>
          </ion-list>
        </div>
      </ion-content>
    }
  `,
})
export default class MoviePage implements OnInit {
  isLoading = true;
  movie?: Movie;
  private route = inject(ActivatedRoute);

  constructor() {
    addIcons({
      heart,
      heartOutline,
      shareSocial,
      shareSocialOutline,
      download,
      downloadOutline,
      play,
      logoYoutube,
    });
  }

  ngOnInit() {
    this.loadMovie(Number(this.route.snapshot.paramMap.get('id') ?? 1));
  }

  private loadMovie(index: number) {
    this.isLoading = true;
    setTimeout(() => {
      // Fake movie data - in real app would fetch from API
      this.movie = {
        id: index,
        title: 'The Matrix',
        description:
          'A computer programmer discovers that reality as he knows it is a simulation created by machines, and joins a rebellion to break free from the system.',
        imageUrl: 'https://picsum.photos/800/600',
        year: 1999,
        rating: 'R',
        duration: '2h 16m',
      };
      this.isLoading = false;
    }, 1000);
  }
}
