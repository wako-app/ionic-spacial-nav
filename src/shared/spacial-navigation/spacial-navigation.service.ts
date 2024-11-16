import { EventEmitter, Injectable, inject } from '@angular/core';

import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular/standalone';
// import { BrowserService } from '@wako-app/mobile-sdk';
import { filter } from 'rxjs';
import { FocusableNode } from './lib/focusable-node';
import { SpacialNavigation } from './lib/spacial-navigation';
import {
  FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE,
  FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT,
  FocusableStatus,
  getNodeFocusKey,
} from './lib/spacial-node';

interface HTMLElementOverlay extends HTMLElement {
  onDidDismiss: () => Promise<any>;
  dismiss: () => Promise<any>;
}

let parentFkCount = 0;
@Injectable({
  providedIn: 'root',
})
export class SpacialNavigationService {
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);
  private router = inject(Router);
  private location = inject(Location);

  timer: any;

  spacialNavigation!: SpacialNavigation;

  private initialized = false;

  private overlayVisible: HTMLElementOverlay | null = null;

  private focusKeyToRestoreStack: {
    overlay: HTMLElementOverlay;
    focusKeyToRestore: string;
  }[] = [];

  private parentFocusKeyIndex = 0;

  onFocused = new EventEmitter<{
    newItem: FocusableNode;
    oldItem?: FocusableNode;
  }>();

  initialize({ debug = false, visualDebug = false }: { debug?: boolean; visualDebug?: boolean }) {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    this.spacialNavigation = new SpacialNavigation({ debug, visualDebug });

    // this.spacialNavigation.onFocused = ({ newItem, oldItem }) => {
    //   this.onFocused.emit({ newItem, oldItem });
    // };

    this.hackIonicModals();

    this.overrideBrowserService();

    this.listenForBodyChange();

    // this.spacialNavigation.update();

    // Refresh focusable items when navigation ends
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.routeChange();
    });

    this.spacialNavigation.log('initialize', 'Service initialized');
  }

  private listenForBodyChange() {
    // Select the node that will be observed for mutations
    const targetNode = document.body;

    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    let mutationTimer: number | null | undefined = null;
    // Callback function to execute when mutations are observed
    const callback = (mutationList: MutationRecord[]) => {
      let hasChanged = true;

      // TODO Improve this
      for (const mutation of mutationList) {
        if (mutation.target instanceof HTMLElement) {
          continue;
        }

        hasChanged = true;
        break;
      }

      if (hasChanged) {
        if (mutationTimer) {
          clearTimeout(mutationTimer);
        }

        mutationTimer = setTimeout(() => {
          this.spacialNavigation.log('listenForBodyChange', 'change detected in body');

          this.refreshFocusableNodes();
        }, 100);
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    document.addEventListener('keyup', async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // toggle debugging
        this.spacialNavigation?.toggleDebug();
      }

      if (e.key === 'Backspace') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        const overlay = await this.getTopOverlay();
        if (overlay) {
          overlay.dismiss();
          return;
        }
        this.location.back();
      }
    });
  }

  private overrideBrowserService() {
    // const rawOpen = BrowserService.open;
    // BrowserService.open = (url: string, inAppBrowser = true) => {
    //   if (url.match('youtube.com')) {
    //     // Create url intent
    //     //url = url.replace(/https:\/\/(www\.)?youtube.com\//gi, 'youtube://');
    //     if (window['plugins'] && window['plugins'].intentShim) {
    //       const intentShim: any = window['plugins'].intentShim;
    //       intentShim.startActivity(
    //         {
    //           action: window['plugins'].intentShim.ACTION_VIEW,
    //           type: 'video/*',
    //           url: url,
    //           extras: {
    //             title: 'test',
    //           },
    //         },
    //         () => console.log('intentShim success'),
    //         (err) => console.log('intentShim err', err),
    //       );
    //     }
    //   }
    //   return rawOpen(url, inAppBrowser);
    // };
  }

  private hackIonicModals() {
    // Hack
    // const alertCtrlRawCreate = this.alertCtrl.create.bind(this.alertCtrl);

    // this.alertCtrl.create = this.overrideIonicOverlay(alertCtrlRawCreate);

    // const actionSheetCtrlRawCreate = this.actionSheetCtrl.create.bind(this.actionSheetCtrl);

    // this.actionSheetCtrl.create = this.overrideIonicOverlay(actionSheetCtrlRawCreate);

    // const ctrls = [this.alertCtrl, this.actionSheetCtrl, this.modalCtrl];

    setInterval(async () => {
      let overlayVisible: HTMLElementOverlay | null = null;

      const overlay = await this.getTopOverlay();

      if (overlay && !overlay.classList.contains('sn-overlay-handled')) {
        overlay.classList.add('sn-overlay-handled');
        this.overlayVisible = overlay;
        this.onOverlayDidPresent(overlay);
      }
      if (overlay) {
        overlayVisible = overlay;
      }

      this.overlayVisible = overlayVisible;
    }, 500);
  }

  private async getTopOverlay() {
    const ctrls = [this.alertCtrl, this.actionSheetCtrl, this.modalCtrl];

    for (const ctrl of ctrls) {
      const overlay = await ctrl.getTop();

      if (overlay) {
        return overlay;
      }
    }

    return null;
  }

  private getParentFocusKey() {
    return `sn-service-parent-${this.parentFocusKeyIndex++}`;
  }

  private isServiceParentFocusKey(focusKey: string) {
    return focusKey.startsWith('sn-service-parent-');
  }

  private disableAllActiveNodesInHiddenPage() {
    const status: FocusableStatus = 'active';
    const pages = document.querySelectorAll<HTMLElement>(`.ion-page-hidden:not(.sn-page-disabled)`);

    pages.forEach((page) => {
      this.spacialNavigation.log('disableAllActiveNodesInHiddenPage', page.tagName);
      const nodes = page.querySelectorAll<HTMLElement>(`[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}="${status}"]`);
      nodes.forEach((node) => {
        const fk = getNodeFocusKey(node);
        if (fk) {
          this.spacialNavigation.disableNode({ focusKey: fk });
        }
      });
      page.classList.add('sn-page-disabled');
    });
  }

  private enableAllDisabledNodesInVisiblePage() {
    const status: FocusableStatus = 'disabled';
    const pages = document.querySelectorAll<HTMLElement>(`.ion-page.sn-page-disabled:not(.ion-page-hidden)`);
    if (pages.length === 0) {
      return;
    }

    pages.forEach((page) => {
      this.spacialNavigation.log('enableAllDisabledNodesInVisiblePage', page.tagName);
      const nodes = page.querySelectorAll<HTMLElement>(`[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}="${status}"]`);
      nodes.forEach((node) => {
        const fk = getNodeFocusKey(node);
        if (fk) {
          this.spacialNavigation.enableNode({ focusKey: fk });
        }
      });
      page.classList.remove('sn-page-disabled');
    });
  }

  private registerNewFocusableNodes({ rootElement = document.body }: { rootElement?: HTMLElement } = {}) {
    const focusableSelectors = [
      `.ion-focusable:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}],[wksnfocusable],[wksnparentfocusable])`,
      `input[type="text"]:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}],[wksnfocusable],[wksnparentfocusable])`,
      `input[type="search"]:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}],[wksnfocusable],[wksnparentfocusable])`,
    ];

    const nodesToRegister: HTMLElement[] = [];

    const classToIgnore = ['menu-button-hidden', 'overlay-hidden'];
    rootElement.querySelectorAll<HTMLElement>(focusableSelectors.join(',')).forEach((node) => {
      if (classToIgnore.some((cls) => node.classList.contains(cls))) {
        return;
      }

      // Skip if parent has overlay-hidden class
      if (node.parentElement?.classList.contains('overlay-hidden')) {
        return;
      }

      nodesToRegister.push(node);
    });

    let parentFocusKey: string | null = null;

    if (this.overlayVisible) {
      // Overlay constraint
      if (!this.focusKeyToRestoreStack.find(({ overlay }) => overlay === this.overlayVisible)) {
        this.focusKeyToRestoreStack.push({
          overlay: this.overlayVisible,
          focusKeyToRestore: this.spacialNavigation.currentlyFocusKey ?? '',
        });
      }
      console.log('focusKeyToRestoreStack', this.focusKeyToRestoreStack);

      const fk = getNodeFocusKey(rootElement);
      if (fk) {
        parentFocusKey = fk;
      } else {
        parentFocusKey = this.spacialNavigation.registerParentNode({
          node: rootElement,
          focusKey: this.getParentFocusKey(),
          saveLastFocusedChild: true,
          constraintToParent: true,
        });
      }

      // UnRegistered nodes
      // const unregisteredNodes = rootElement.querySelectorAll(
      //   `[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY}]`
      // );

      // unregisteredNodes.forEach((node) => {
      //   if (!(node instanceof HTMLElement)) {
      //     return;
      //   }
      //   let fk = getNodeFocusKey(node);
      //   let pk = getNodeParentFocusKey(node);

      //   if (fk && pk && pk !== parentFocusKey) {
      //     this.spacialNavigation.unregisterNode({
      //       focusKey: fk,
      //     });

      //     nodesToRegister.push(node);
      //   }
      // });
    }

    for (const node of nodesToRegister) {
      // Get closest parent focus key from attribute
      let parentNode = node.closest<HTMLElement>(`[${FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT}]`);

      if (parentNode) {
        parentFocusKey = getNodeFocusKey(parentNode);
        break;
      }

      if (!parentNode) {
        // Get the closet .ion-page
        parentNode = node.closest('.ion-page:not(ion-app)');
      }

      if (!parentFocusKey && parentNode && parentNode instanceof HTMLElement) {
        parentFocusKey = getNodeFocusKey(parentNode);

        if (!parentFocusKey) {
          parentFocusKey = this.spacialNavigation.registerParentNode({
            node: parentNode,
            focusKey: this.getParentFocusKey(),
            saveLastFocusedChild: true,
            focusFirstChild: true,
          });
        }
      }
    }

    if (parentFocusKey) {
      let focusFirstNode = this.overlayVisible !== null;
      let firstFocusKey: string | null = null;

      for (const node of nodesToRegister) {
        const focusableNode = this.spacialNavigation.registerNode({
          node,
          origin: 'makeFocusableNodes',
          parentFocusKey: parentFocusKey,
          focusNode: focusFirstNode,
        });
        focusFirstNode = false;

        if (focusableNode && !firstFocusKey) {
          firstFocusKey = focusableNode.getFocusKey() ?? null;
        }
      }

      if (firstFocusKey && this.overlayVisible !== null) {
        this.spacialNavigation.focusByFocusKey(firstFocusKey);
      }
    }
  }

  private refreshFocusableNodes() {
    if (!this.initialized) {
      return;
    }

    this.disableAllActiveNodesInHiddenPage();
    this.enableAllDisabledNodesInVisiblePage();

    this.registerNewFocusableNodes({
      rootElement: this.overlayVisible ?? document.body,
    });
  }

  private onOverlayDidPresent(overlay: HTMLElementOverlay) {
    const focusKeyToRestore = this.focusKeyToRestoreStack[this.focusKeyToRestoreStack.length - 1];

    this.spacialNavigation.log(
      'onOverlayDidPresent',
      `overlay presented due to click on ${focusKeyToRestore?.focusKeyToRestore}`,
      overlay,
    );

    overlay.onDidDismiss().then(() => {
      this.spacialNavigation.log('onOverlayDidPresent', 'overlay dismissed');

      this.overlayVisible = null;

      this.refreshFocusableNodes();

      // Restore focus
      if (this.focusKeyToRestoreStack.length > 0) {
        let focusKeyToRestore = this.focusKeyToRestoreStack.pop();
        if (focusKeyToRestore) {
          this.spacialNavigation.log('onOverlayDidPresent', 'restore focus', focusKeyToRestore.focusKeyToRestore);
          this.spacialNavigation.focusByFocusKey(focusKeyToRestore.focusKeyToRestore);
        }
      }

      this.spacialNavigation.log('onOverlayDidPresent', `focusKeyToRestoreStack:`, this.focusKeyToRestoreStack);
    });

    this.registerNewFocusableNodes({
      rootElement: overlay,
    });
  }

  routeChange() {
    setTimeout(() => {
      this.spacialNavigation.log('routeChange', 'unregister deleted nodes');
      this.spacialNavigation.unregisterDeletedNodes();
      this.spacialNavigation.resetCurrentFocusedNodeNeighbors();
      this.refreshFocusableNodes();
    }, 100);
  }
}
