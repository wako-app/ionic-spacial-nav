import { Component, HostListener, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonItem, NavController } from '@ionic/angular/standalone';
@Component({
  selector: 'wk-movie-item',
  standalone: true,
  imports: [IonItem],
  template: `
    <div class="w-32 h-40 bg-green-200/50 flex justify-center items-end relative p-4">
      <ion-item>{{ title }}</ion-item>

      <ion-item class="absolute top-2 right-2 rounded-full bg-white">{{ index }}</ion-item>
    </div>
  `,
})
export default class MovieItemComponent {
  @Input({ required: true }) index = 0;
  @Input({ required: true }) title!: string;

  private router = inject(Router);
  private navController = inject(NavController);

  @HostListener('click')
  onClick() {
    this.navController.navigateForward(`/tabs/movies/${this.index}`);
  }
}
