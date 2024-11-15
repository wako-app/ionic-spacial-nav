import { EventEmitter, Injectable, inject } from '@angular/core';

import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';
// import { BrowserService } from '@wako-app/mobile-sdk';
import { filter } from 'rxjs';
import { FocusableNode } from './lib/focusable-node';
import { SpacialNavigation } from './lib/spacial-navigation';
import {
  FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE,
  FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY,
  FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT,
  ROOT_FOCUS_KEY,
  getNodeFocusKey,
  getNodeParentFocusKey,
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

  private focusKeyToRestore: string | null = null;

  onFocused = new EventEmitter<{
    newItem: FocusableNode;
    oldItem?: FocusableNode;
  }>();

  initialize({
    debug = false,
    visualDebug = false,
  }: {
    debug?: boolean;
    visualDebug?: boolean;
  }) {
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
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
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
          this.spacialNavigation.log(
            'listenForBodyChange',
            'change detected in body'
          );

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
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
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

  private registerNewFocusableNodes({
    rootElement = document.body,
    isOverlayVisible = false,
  }: { rootElement?: HTMLElement; isOverlayVisible?: boolean } = {}) {
    const focusableSelectors = [
      `.ion-focusable:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}])`,
      `input[type="text"]:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}])`,
      `input[type="search"]:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}])`,
    ];

    const nodesToRegister: HTMLElement[] = [];

    const classToIgnore = ['menu-button-hidden', 'overlay-hidden'];
    rootElement
      .querySelectorAll<HTMLElement>(focusableSelectors.join(','))
      .forEach((node) => {
        if (classToIgnore.some((cls) => node.classList.contains(cls))) {
          return;
        }

        // Skip if parent has overlay-hidden class
        if (node.parentElement?.classList.contains('overlay-hidden')) {
          return;
        }

        nodesToRegister.push(node);
      });

    let groupNode = false;

    let parentFocusKey: string | null = null;

    if (isOverlayVisible) {
      // Overlay constraint
      if (!this.focusKeyToRestore) {
        this.focusKeyToRestore =
          this.spacialNavigation.currentlyFocusKey ?? null;
      }

      const fk = getNodeFocusKey(rootElement);
      if (fk) {
        parentFocusKey = fk;
      } else {
        groupNode = false;

        parentFocusKey = this.spacialNavigation.registerParentNode({
          node: rootElement,
          focusKey: `sn-parent-${rootElement.tagName}-${parentFkCount++}`,
          saveLastFocusedChild: true,
          constraintToParent: true,
        });
      }

      // UnRegistered nodes
      const unregisteredNodes = rootElement.querySelectorAll(
        `[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY}]`
      );

      unregisteredNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) {
          return;
        }
        let fk = getNodeFocusKey(node);
        let pk = getNodeParentFocusKey(node);

        if (fk && pk && pk !== parentFocusKey) {
          this.spacialNavigation.unregisterNode({
            focusKey: fk,
          });

          nodesToRegister.push(node);
        }
      });
    }

    let focusNode = isOverlayVisible;

    if (!groupNode) {
      for (const node of nodesToRegister) {
        // Get closest parent focus key from attribute
        let parentNode = node.closest(
          `[${FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT}]`
        );

        if (!parentNode) {
          // Get the closet .ion-page
          parentNode = node.closest('.ion-page');
        }

        if (
          !parentFocusKey &&
          parentNode &&
          parentNode instanceof HTMLElement
        ) {
          parentFocusKey = getNodeFocusKey(parentNode);
          if (!parentFocusKey) {
            this.spacialNavigation.registerParentNode({
              node: parentNode,
              focusKey: ROOT_FOCUS_KEY,
              saveLastFocusedChild: true,
              focusFirstChild: true,
            });
          }
        }

        this.spacialNavigation.registerNode({
          node,
          origin: 'makeFocusableNodes',
          parentFocusKey: parentFocusKey ?? ROOT_FOCUS_KEY,
          focusNode,
        });
        focusNode = false;
      }
    } else {
      // Group nodes that are in the same row by comparing their vertical positions
      const nodesByRow = new Map<number, HTMLElement[]>();
      const rowThreshold = 10; // Pixels threshold to consider elements in same row

      for (const node of nodesToRegister) {
        const rect = node.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;

        // Find existing row within threshold
        let foundRow = false;
        for (const [rowY, nodes] of nodesByRow.entries()) {
          if (Math.abs(rowY - centerY) <= rowThreshold) {
            nodes.push(node);
            foundRow = true;
            break;
          }
        }

        // Create new row if no matching row found
        if (!foundRow) {
          nodesByRow.set(centerY, [node]);
        }
      }

      // Sort nodes within each row by x position
      for (const nodes of nodesByRow.values()) {
        nodes.sort((a, b) => {
          const rectA = a.getBoundingClientRect();
          const rectB = b.getBoundingClientRect();
          return rectA.left - rectB.left;
        });
      }

      for (const [, nodes] of nodesByRow.entries()) {
        // Get common parent element for all nodes in this row
        const commonParent = nodes.reduce((parent, node) => {
          if (!parent) return node.parentElement;
          let currentParent = node.parentElement;
          while (currentParent) {
            if (parent.contains(currentParent)) return currentParent;
            if (currentParent.contains(parent)) return parent;
            currentParent = currentParent.parentElement;
          }
          return parent;
        }, null as HTMLElement | null);

        let parentFocusKey = null;

        if (commonParent) {
          parentFocusKey = this.spacialNavigation.registerParentNode({
            node: commonParent,
          });
        }

        for (const node of nodes) {
          this.spacialNavigation.registerNode({
            node,
            origin: 'makeFocusableNodes grouped',
            parentFocusKey: parentFocusKey ?? ROOT_FOCUS_KEY,
          });
        }
      }
    }
  }

  private refreshFocusableNodes() {
    if (!this.initialized) {
      return;
    }

    this.registerNewFocusableNodes({
      rootElement: this.overlayVisible ?? document.body,
      isOverlayVisible: !!this.overlayVisible,
    });
  }

  private onOverlayDidPresent(overlay: HTMLElementOverlay) {
    this.spacialNavigation.log(
      'onOverlayDidPresent',
      `overlay presented due to click on ${this.focusKeyToRestore}`,
      overlay
    );

    overlay.onDidDismiss().then(() => {
      this.spacialNavigation.log('onOverlayDidPresent', 'overlay dismissed');

      this.overlayVisible = null;

      this.refreshFocusableNodes();

      // Restore focus
      if (this.focusKeyToRestore) {
        this.spacialNavigation.log(
          'onOverlayDidPresent',
          'restore focus',
          this.focusKeyToRestore
        );
        this.spacialNavigation.focusByFocusKey(this.focusKeyToRestore);
        this.focusKeyToRestore = null;
      }

      this.spacialNavigation.log(
        'onOverlayDidPresent',
        'restore focus',
        this.focusKeyToRestore
      );
    });

    this.registerNewFocusableNodes({
      rootElement: overlay,
      isOverlayVisible: true,
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
