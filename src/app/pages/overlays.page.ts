import { Component, inject } from '@angular/core';

import {
  ActionSheetController,
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

import ButtonsPage from './buttons.page';

@Component({
  selector: 'wk-overlays',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Overlays</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content sn-focuskey="overlays">
      <ion-button sn-focuskey="action-sheet" sn-parent-focuskey="overlays" (click)="presentActionSheet()"
        >Action Sheet</ion-button
      >
      <!-- modal -->
      <ion-button sn-focuskey="modal" sn-parent-focuskey="overlays" (click)="presentModal()">Modal</ion-button>
      <!-- alert -->
      <ion-button sn-focuskey="alert" sn-parent-focuskey="overlays" (click)="presentAlert()">Alert</ion-button>
      <!-- selected -->
    </ion-content>
  `,
})
export default class OverlaysPage {
  private actionSheetCtrl = inject(ActionSheetController);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

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

  async presentModal() {
    const modal = await this.modalCtrl.create({
      component: ButtonsPage,
    });
    await modal.present();
  }

  async presentAlert() {
    const alert = await this.alertCtrl.create({
      message: 'Test',
      inputs: [
        {
          placeholder: 'Name',
        },
        {
          placeholder: 'Nickname (max 8 characters)',
          attributes: {
            maxlength: 8,
          },
        },
        {
          type: 'number',
          placeholder: 'Age',
          min: 1,
          max: 100,
        },
        {
          type: 'textarea',
          placeholder: 'A little about yourself',
        },
      ],
      buttons: ['OK', 'Cancel'],
    });
    await alert.present();
  }
}
