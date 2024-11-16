import { Component } from '@angular/core';
import { IonTabs } from '@ionic/angular/standalone';

@Component({
  selector: 'wk-page-shell',
  standalone: true,
  imports: [IonTabs],
  template: '<ion-tabs></ion-tabs>',
})
export default class PageShellComponent {}
