import { Component, inject } from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  ActionSheetController,
} from '@ionic/angular/standalone';
@Component({
  selector: 'wk-buttons',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Buttons</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-button (click)="presentActionSheet()">
        BTN 0 (action sheet)
      </ion-button>
      <div style="display: flex; gap: 10px; justify-content: space-between">
        <ion-button>BTN -1</ion-button>
        <ion-button (click)="presentActionSheet()">
          BTN 0 (action sheet)
        </ion-button>
      </div>

      <ion-button>BTN 1</ion-button>
      <ion-button (click)="presentActionSheet()"
        >BTN 2 (action sheet)</ion-button
      >

      <ion-button>BTN 3</ion-button>
      <ion-button (click)="presentActionSheet()"
        >BTN 4 (action sheet)</ion-button
      >

      <ion-button>BTN 5</ion-button>

      <div class="flex gap-2 justify-between mb-4">
        <ion-button size="small">Random 1</ion-button>
        <ion-button size="large">Random 2</ion-button>
        <ion-button>Random 3</ion-button>
      </div>

      <div class="flex gap-2 justify-around mb-4">
        <ion-button size="large">Random 4</ion-button>
        <ion-button size="small">Random 5</ion-button>
        <ion-button>Random 6</ion-button>
        <ion-button size="large">Random 7</ion-button>
      </div>

      <div class="flex gap-2 justify-evenly mb-4">
        <ion-button>Random 8</ion-button>
        <ion-button size="small">Random 9</ion-button>
        <ion-button size="large">Random 10</ion-button>
        <ion-button>Random 11</ion-button>
        <ion-button size="small">Random 12</ion-button>
      </div>

      <div class="flex gap-2 justify-between mb-4">
        <ion-button size="large">Random 13</ion-button>
        <ion-button>Random 14</ion-button>
      </div>

      <div class="flex gap-2 justify-center mb-4">
        <ion-button size="small">Random 15</ion-button>
        <ion-button size="large">Random 16</ion-button>
        <ion-button>Random 17</ion-button>
      </div>

      <div class="flex gap-2 justify-around mb-4">
        <ion-button>Random 18</ion-button>
        <ion-button size="large">Random 19</ion-button>
        <ion-button size="small">Random 20</ion-button>
        <ion-button>Random 21</ion-button>
      </div>

      <div class="flex gap-2 justify-between mb-4">
        <ion-button size="small">Random 22</ion-button>
        <ion-button>Random 23</ion-button>
        <ion-button size="large">Random 24</ion-button>
        <ion-button>Random 25</ion-button>
      </div>
    </ion-content>
  `,
})
export default class ButtonsPage {
  private actionSheetCtrl = inject(ActionSheetController);

  async presentActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Actions',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          data: {
            action: 'delete',
          },
        },
        {
          text: 'Share',
          data: {
            action: 'share',
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
          data: {
            action: 'cancel',
          },
        },
      ],
    });

    await actionSheet.present();
  }
}
