import { EventEmitter, Injectable } from '@angular/core';

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
  FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT,
  ROOT_FOCUS_KEY,
  getFocusableNodesByStatus,
  getNodeFocusKey,
  setAllNodesDisabled,
  setFocusableStatus,
} from './lib/spacial-node';

interface HTMLElementOverlay extends HTMLElement {
  onDidDismiss: () => Promise<any>;
  dismiss: () => Promise<any>;
}

@Injectable({
  providedIn: 'root',
})
export class SpacialNavigationService {
  timer: any;

  spacialNavigation: SpacialNavigation;

  private initialized = false;

  private overlayVisible: HTMLElementOverlay | null = null;

  onFocused = new EventEmitter<{
    newItem: FocusableNode;
    oldItem?: FocusableNode;
  }>();

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private router: Router,
    private location: Location
  ) {}

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

    this.spacialNavigation.onFocused = ({ newItem, oldItem }) => {
      this.onFocused.emit({ newItem, oldItem });
    };

    this.spacialNavigation.log('initialize', 'initialized');

    this.hackIonicModals();

    this.overrideBrowserService();

    this.listenForBodyChange();

    // this.spacialNavigation.update();

    // Refresh focusable items when navigation ends
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        setTimeout(() => {
          this.spacialNavigation.log('route change', 'navigation ended');
          this.refreshFocusableNodes();
        }, 500);
      });
  }

  private listenForBodyChange() {
    // Select the node that will be observed for mutations
    const targetNode = document.body;

    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    let _timer = null;
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
        if (_timer) {
          clearTimeout(_timer);
        }

        _timer = setTimeout(() => {
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
        this.spacialNavigation.visualDebugger?.toggleDebugMode();
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
      const overlay: HTMLElementOverlay = await ctrl.getTop();

      if (overlay) {
        return overlay;
      }
    }

    return null;
  }

  debounceUpdate() {
    if (!this.initialized) {
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      //  this.update();
    }, 200);
  }

  update() {
    this.timer = null;
    // this.spacialNavigation.update();
  }

  private registerNewFocusableNodes(rootElement: HTMLElement = document.body) {
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

    const groupNode = true;

    if (groupNode) {
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
    } else {
      for (const node of nodesToRegister) {
        let parentFocusKey = null;
        // Get closest parent focus key from attribute
        let parentNode = node.closest(
          `[${FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT}]`
        );
        if (!parentNode) {
          // Get the closet .ion-page
          parentNode = node.closest('.ion-page');
        }

        if (parentNode && parentNode instanceof HTMLElement) {
          parentFocusKey = getNodeFocusKey(parentNode);
          if (!parentFocusKey) {
            this.spacialNavigation.registerParentNode({
              node: parentNode,
              focusKey: ROOT_FOCUS_KEY,
            });
          }
        }

        this.spacialNavigation.registerNode({
          node,
          origin: 'makeFocusableNodes',
          parentFocusKey: parentFocusKey ?? ROOT_FOCUS_KEY,
        });
      }
    }
  }

  private refreshFocusableNodes() {
    if (!this.initialized) {
      return;
    }

    // TODO REFACTOR
    if (this.overlayVisible) {
      // Make all elements not focusable anymore
      this.handleFocusableNodeOnOverlayDidPresent(this.overlayVisible);
    } else {
      this.registerNewFocusableNodes();

      // // First remove all disabled and active focusable items on visible pages
      // let firstElementOnPage = null;
      // document
      //   .querySelectorAll<HTMLElement>(`.ion-page:not(.ion-page-hidden)`)
      //   .forEach((node) => {
      //     [
      //       ...getFocusableNodesByStatus({
      //         status: 'disabled',
      //         parent: node,
      //       }),
      //       ...getFocusableNodesByStatus({
      //         status: 'active',
      //         parent: node,
      //       }),
      //     ].forEach((node) => {
      //       if (!firstElementOnPage) {
      //         firstElementOnPage = node;
      //       }
      //       setFocusableStatus(node, 'pending');
      //     });
      //   });

      // // Last disable all focusable items on hidden pages
      // document
      //   .querySelectorAll<HTMLElement>(`.ion-page.ion-page-hidden`)
      //   .forEach((node) => {
      //     [
      //       ...getFocusableNodesByStatus({
      //         status: 'active',
      //         parent: node,
      //       }),
      //       ...getFocusableNodesByStatus({
      //         status: 'pending',
      //         parent: node,
      //       }),
      //     ].forEach((node) => {
      //       setFocusableStatus(node, 'disabled');
      //     });
      //   });
    }

    this.update();
  }

  private onOverlayDidPresent(overlay: HTMLElementOverlay) {
    const focusKey = this.spacialNavigation.currentFocusableFocusKey;

    this.spacialNavigation.log(
      'onOverlayDidPresent',
      `overlay presented due to click on ${focusKey}`,
      overlay
    );

    overlay.onDidDismiss().then(() => {
      this.spacialNavigation.log('onOverlayDidPresent', 'overlay dismissed');

      this.overlayVisible = null;

      this.refreshFocusableNodes();

      // Restore focus
      this.spacialNavigation.focusByFocusKey(focusKey);

      this.spacialNavigation.log(
        'onOverlayDidPresent',
        'restore focus',
        focusKey
      );
    });

    // Hide all focusable items
    this.handleFocusableNodeOnOverlayDidPresent(overlay);

    this.update();
  }

  private handleFocusableNodeOnOverlayDidPresent(overlay: HTMLElementOverlay) {
    // Make all focusable nodes disabled
    setAllNodesDisabled();

    this.registerNewFocusableNodes(overlay);

    // Make all disabled focusable nodes pending
    getFocusableNodesByStatus({
      status: 'disabled',
      parent: overlay,
    }).forEach((node) => {
      setFocusableStatus(node, 'pending');
    });
  }

  onPageDidEnter() {
    this.refreshFocusableNodes();
  }
}
