import { Injectable, inject } from '@angular/core';

import { Location } from '@angular/common';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular/standalone';
// import { BrowserService } from '@wako-app/mobile-sdk';
import { filter } from 'rxjs';
import { SpacialNavigation } from './lib/spacial-navigation';
import {
  FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE,
  FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT,
  FocusableStatus,
  getNodeByFocusKey,
  getNodeFocusKey,
  getNodeParentFocusKey,
} from './lib/spacial-node';

interface HTMLElementOverlay extends HTMLElement {
  onDidDismiss: () => Promise<any>;
  dismiss: () => Promise<any>;
}

interface OverlayHistoryEntry {
  focusKey: string;
  overlay: HTMLElementOverlay;
}

interface NavigationHistoryEntry {
  focusKey: string;
  route: string;
}

@Injectable({
  providedIn: 'root',
})
export class SpacialNavigationService {
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);
  private router = inject(Router);
  private location = inject(Location);

  private initialized = false;

  private overlayVisible: HTMLElementOverlay | null = null;

  private overlayHistory: OverlayHistoryEntry[] = [];
  private navigationHistory: NavigationHistoryEntry[] = [];
  private parentFocusKeyIndex = 0;

  private currentRoute?: string;

  spacialNavigation!: SpacialNavigation;

  initialize({ debug = false, visualDebug = false }: { debug?: boolean; visualDebug?: boolean }) {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    this.spacialNavigation = new SpacialNavigation({ debug, visualDebug });

    this.handleIonicOverlays();

    this.overrideBrowserService();

    this.listenForBodyChange();

    this.initializeRouterEvents();
  }

  private initializeRouterEvents() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd | NavigationStart =>
            event instanceof NavigationEnd || event instanceof NavigationStart,
        ),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart && this.currentRoute) {
          // Save the focused element of the current route
          const currentFocusKey = this.spacialNavigation.currentlyFocusKey;
          if (currentFocusKey) {
            const currentFocusNode = getNodeByFocusKey(currentFocusKey);
            if (!currentFocusNode) {
              return;
            }
            // Check if focus node is in an .ion-page but not ion-app
            const ionPage = currentFocusNode.closest('.ion-page');
            if (!ionPage || ionPage.tagName.toLowerCase() === 'ion-app') {
              return;
            }

            this.navigationHistory.push({
              focusKey: currentFocusKey,
              route: this.currentRoute,
            });
            this.spacialNavigation.log(
              'navigation',
              `Saved focus key ${currentFocusKey} for route ${this.currentRoute}`,
            );
          }
        } else if (event instanceof NavigationEnd) {
          // Update current route
          this.currentRoute = event.url;

          // Check if we're returning to a previously visited route
          const existingEntryIndex = this.navigationHistory.findIndex((entry) => entry.route === event.url);

          if (existingEntryIndex !== -1) {
            // This is a back navigation to a known route
            const entry = this.navigationHistory[existingEntryIndex];
            // Remove this entry and all following entries
            this.navigationHistory.splice(existingEntryIndex);

            setTimeout(() => {
              this.spacialNavigation.focusByFocusKey(entry.focusKey);
              this.spacialNavigation.log('navigation', `Restored focus to ${entry.focusKey} for route ${event.url}`);
            }, 100);
          }

          this.routeChange();
        }
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

  private async handleIonicOverlays() {
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

  private generateParentFocusKey(pageTagName?: string) {
    return `sns-parent-${pageTagName?.toLocaleLowerCase() ?? ''}-${this.parentFocusKeyIndex++}`;
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

  private registerNewFocusableNodes({
    rootElement = document.body,
    isFromNavigation = false,
  }: { rootElement?: HTMLElement; isFromNavigation?: boolean } = {}) {
    const focusableSelectors = [
      `.ion-focusable:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}],[wksnfocusable],[wksnparentfocusable])`,
      `input[type="text"]:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}],[wksnfocusable],[wksnparentfocusable])`,
      `input[type="search"]:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}],[wksnfocusable],[wksnparentfocusable])`,
    ];

    const nodesToRegister: HTMLElement[] = [];

    const classToIgnore = ['menu-button-hidden', 'overlay-hidden', 'show-back-button'];
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
      if (!this.overlayHistory.find((entry) => entry.overlay === this.overlayVisible)) {
        const currentFocusKey = this.spacialNavigation.currentlyFocusKey;
        if (currentFocusKey && this.overlayVisible) {
          this.overlayHistory.push({
            focusKey: currentFocusKey,
            overlay: this.overlayVisible,
          });
          this.spacialNavigation.log('overlay', `Saved focus key ${currentFocusKey} for overlay`);
        }
      }

      const fk = getNodeFocusKey(rootElement);
      if (fk) {
        parentFocusKey = fk;
      } else {
        parentFocusKey = this.spacialNavigation.registerParentNode({
          node: rootElement,
          focusKey: this.generateParentFocusKey(rootElement.tagName),
          saveLastFocusedChild: true,
          constraintToParent: true,
        });
      }
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
            focusKey: this.generateParentFocusKey(parentNode.tagName),
            saveLastFocusedChild: true,
            focusFirstChild: false,
          });
        }
      }
    }

    if (parentFocusKey) {
      let focusFirstNode = this.overlayVisible !== null;
      let firstFocusKey: string | null = null;

      for (const node of nodesToRegister) {
        let actualParentFocusKey = getNodeParentFocusKey(node);

        if (actualParentFocusKey) {
          const parentNode = getNodeByFocusKey(actualParentFocusKey);
          if (!parentNode) {
            actualParentFocusKey = null;
          } else {
            // Register it if unregistered
            this.spacialNavigation.registerParentNode({
              node: parentNode,
              focusKey: actualParentFocusKey,
              saveLastFocusedChild: true,
              focusFirstChild: false,
            });
          }
        }

        const focusableNode = this.spacialNavigation.registerNode({
          node,
          origin: 'makeFocusableNodes',
          parentFocusKey: actualParentFocusKey ?? parentFocusKey,
          focusNode: false,
        });
        focusFirstNode = false;

        if (focusableNode && !firstFocusKey) {
          firstFocusKey = focusableNode.getFocusKey() ?? null;
        }
      }

      if (firstFocusKey && this.overlayVisible !== null) {
        this.spacialNavigation.focusByFocusKey(firstFocusKey);
      }
      // if (firstFocusKey && (this.overlayVisible !== null || isFromNavigation)) {

      //   // Check if there is one child focused
      //   let hasFocusedChild = false;
      //   let rootElement: HTMLElement | null = this.overlayVisible;
      //   if (isFromNavigation) {
      //     rootElement = document.querySelector<HTMLElement>('ion-app .ion-page:not(.ion-page-hidden)');
      //   }
      //   if (rootElement) {
      //     const focusedNode = getNodeFocused(rootElement);
      //     if (focusedNode) {
      //       hasFocusedChild = true;
      //     }
      //     if (!hasFocusedChild) {
      //       // Try to find the first focusable node in ion-content of this rootElement
      //       const firstFocusableNode = rootElement.querySelector<HTMLElement>(
      //         `ion-content:not([${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}])`,
      //       );
      //       if (firstFocusableNode) {
      //         let fk = getNodeFocusKey(firstFocusableNode);
      //         if (fk) {
      //           firstFocusKey = fk;
      //           console.log('firstFocusKey', firstFocusKey);
      //         }
      //       }
      //     }
      //   }

      //   if (!hasFocusedChild) {
      //     this.spacialNavigation.focusByFocusKey(firstFocusKey);
      //   }
      // }
    }
  }

  private setParentFocusKeyOnNewPages() {
    const pages = document.querySelectorAll<HTMLElement>(
      `ion-app .ion-page:not([${FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT}])`,
    );
    pages.forEach((page) => {
      this.spacialNavigation.registerParentNode({
        node: page,
        focusKey: this.generateParentFocusKey(page.tagName),
        saveLastFocusedChild: true,
        focusFirstChild: false,
      });
    });
  }

  private async refreshFocusableNodes({ isFromNavigation = false }: { isFromNavigation?: boolean } = {}) {
    if (!this.initialized) {
      return;
    }
    this.setParentFocusKeyOnNewPages();

    this.disableAllActiveNodesInHiddenPage();
    this.enableAllDisabledNodesInVisiblePage();

    await this.handleIonicOverlays();

    this.registerNewFocusableNodes({
      rootElement: this.overlayVisible ?? document.body,
      isFromNavigation,
    });
  }

  private onOverlayDidPresent(overlay: HTMLElementOverlay) {
    const currentFocusKey = this.spacialNavigation.currentlyFocusKey;

    if (currentFocusKey) {
      this.overlayHistory.push({
        focusKey: currentFocusKey,
        overlay: overlay,
      });
      this.spacialNavigation.log('overlay', `Saved focus key ${currentFocusKey} for new overlay`);
    }

    overlay.onDidDismiss().then(() => {
      this.overlayVisible = null;

      const lastOverlay = this.overlayHistory.pop();

      this.refreshFocusableNodes();

      if (lastOverlay?.focusKey) {
        this.spacialNavigation.log('overlay', `Restoring focus to ${lastOverlay.focusKey}`);
        setTimeout(() => {
          this.spacialNavigation.focusByFocusKey(lastOverlay.focusKey);
        }, 100);
      }

      this.spacialNavigation.log('overlay', `Remaining overlay history:`, this.overlayHistory);
    });

    this.registerNewFocusableNodes({
      rootElement: overlay,
    });
  }

  private routeChange() {
    setTimeout(() => {
      this.spacialNavigation.log('routeChange', 'unregister deleted nodes');
      this.spacialNavigation.unregisterDeletedNodes();
      this.spacialNavigation.resetCurrentFocusedNodeNeighbors();
      this.refreshFocusableNodes({ isFromNavigation: true });
    }, 100);
  }
}
