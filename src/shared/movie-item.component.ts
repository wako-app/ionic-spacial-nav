import { Component, Input } from '@angular/core';
import { IonItem } from '@ionic/angular/standalone';
@Component({
  selector: 'wk-movie-item',
  standalone: true,
  imports: [IonItem],
  template: `
    <div class="w-32 h-40 bg-green-200 flex justify-center items-center">
      <ion-item>{{ index }}</ion-item>
    </div>
  `,
})
export default class MovieItemComponent {
  @Input() index = 0;
}
