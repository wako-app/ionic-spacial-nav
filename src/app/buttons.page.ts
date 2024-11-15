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

      <div
        class="flex gap-2 justify-evenly"
        wkSnFocusable
        snFocusKey="BTN_GROUP_1"
        snIsParent
      >
        <ion-button
          wkSnFocusable
          snFocusKey="BTN_3"
          snParentFocusKey="BTN_GROUP_1"
          >BTN 3</ion-button
        >
        <ion-button
          wkSnFocusable
          snFocusKey="BTN_4"
          snParentFocusKey="BTN_GROUP_1"
          (click)="presentActionSheet()"
          >BTN 4 (action sheet)</ion-button
        >
      </div>

      <ion-button>BTN 5</ion-button>

      <div>
        <div class="flex gap-2">
          <ion-button>Button 1</ion-button>
          <ion-button>Button 2</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 3</ion-button>
          <ion-button>Button 4</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 5</ion-button>
          <ion-button>Button 6</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 7</ion-button>
          <ion-button>Button 8</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 9</ion-button>
          <ion-button>Button 10</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 11</ion-button>
          <ion-button>Button 12</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 13</ion-button>
          <ion-button>Button 14</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 15</ion-button>
          <ion-button>Button 16</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 17</ion-button>
          <ion-button>Button 18</ion-button>
        </div>
        <div class="flex gap-2">
          <ion-button>Button 19</ion-button>
          <ion-button>Button 20</ion-button>
        </div>
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
