import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonRouterLink,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  mailOutline,
  mailSharp,
  paperPlaneOutline,
  paperPlaneSharp,
  heartOutline,
  heartSharp,
  archiveOutline,
  archiveSharp,
  trashOutline,
  trashSharp,
  warningOutline,
  warningSharp,
  bookmarkOutline,
  bookmarkSharp,
  tvOutline,
} from 'ionicons/icons';

import { SpacialFocusableDirective } from 'src/shared/spacial-navigation/spacial-focusable.directive';
import { SpacialNavigationService } from 'src/shared/spacial-navigation/spacial-navigation.service';
import { SpacialParentFocusableDirective } from 'src/shared/spacial-navigation/spacial-parent-focusable.directive';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterLink,
    IonRouterOutlet,
    SpacialFocusableDirective,
    SpacialParentFocusableDirective,
  ],
})
export class AppComponent {
  public appPages = [
    { title: 'Movies', url: '/', icon: 'tv' },
    { title: 'Buttons', url: '/buttons', icon: 'mail' },
    { title: 'Overlays', url: '/overlays', icon: 'paper-plane' },
    // { title: 'Favorites', url: '/folder/favorites', icon: 'heart' },
    // { title: 'Archived', url: '/folder/archived', icon: 'archive' },
    // { title: 'Trash', url: '/folder/trash', icon: 'trash' },
    // { title: 'Spam', url: '/folder/spam', icon: 'warning' },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];

  private spacialNavigationService = inject(SpacialNavigationService);

  constructor() {
    addIcons({
      tvOutline,
      mailOutline,
      mailSharp,
      paperPlaneOutline,
      paperPlaneSharp,
      heartOutline,
      heartSharp,
      archiveOutline,
      archiveSharp,
      trashOutline,
      trashSharp,
      warningOutline,
      warningSharp,
      bookmarkOutline,
      bookmarkSharp,
    });

    this.spacialNavigationService.initialize({
      debug: true,
      visualDebug: true,
    });
  }
}
