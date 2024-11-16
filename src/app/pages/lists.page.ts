import { Component, inject } from '@angular/core';

import {
  ActionSheetController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { SpacialParentFocusableDirective } from 'src/shared/spacial-navigation/spacial-parent-focusable.directive';
@Component({
  selector: 'wk-lists',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    SpacialParentFocusableDirective,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Lists</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (ready) {
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 1 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 1</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 2 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 2</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 3 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 3</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 4 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 4</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 5 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 5</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 6 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 6</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 7 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 7</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 8 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 8</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 9 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 9</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 10 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 10</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 11 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 11</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 12 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 12</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 13 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 13</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 14 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 14</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 15 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 15</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 16 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 16</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 17 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 17</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 18 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 18</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 19 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 19</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 20 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 20</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 21 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 21</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 22 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 22</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 23 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 23</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 24 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 24</ion-label>
          </ion-item>
        </ion-list>
        <ion-list lines="full">
          <ion-list-header>
            <ion-icon name="folder-outline"></ion-icon>
            <ion-label> Folder 25 </ion-label>
          </ion-list-header>
          <ion-item button routerLink="./filer">
            <ion-label>Filer 25</ion-label>
          </ion-item>
        </ion-list>
      }
    </ion-content>
  `,
})
export default class ListsPage {
  ready = false;
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

  constructor() {
    setTimeout(() => {
      this.ready = true;
    }, 1000);
  }
}
