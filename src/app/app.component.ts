import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import {
  IonApp,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonRouterLink,
  IonRouterOutlet,
  IonSplitPane,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  archiveOutline,
  archiveSharp,
  bookmarkOutline,
  bookmarkSharp,
  heartOutline,
  heartSharp,
  homeOutline,
  mailOutline,
  mailSharp,
  paperPlaneOutline,
  paperPlaneSharp,
  trashOutline,
  trashSharp,
  tvOutline,
  warningOutline,
  warningSharp,
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
    { title: 'Home', url: '/tabs/home', icon: 'home', focusKey: 'menu_home' },
    { title: 'Movies', url: '/tabs/movies', icon: 'tv', focusKey: 'menu_movies' },
    { title: 'Buttons', url: '/tabs/buttons', icon: 'mail', focusKey: 'menu_buttons' },
    { title: 'Overlays', url: '/tabs/overlays', icon: 'paper-plane', focusKey: 'menu_overlays' },
    // { title: 'Favorites', url: '/folder/favorites', icon: 'heart' },
    // { title: 'Archived', url: '/folder/archived', icon: 'archive' },
    // { title: 'Trash', url: '/folder/trash', icon: 'trash' },
    // { title: 'Spam', url: '/folder/spam', icon: 'warning' },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];

  private spacialNavigationService = inject(SpacialNavigationService);

  constructor() {
    addIcons({
      homeOutline,
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
