import { setNeighbors } from './calc-distance';
import { FocusableNode, NeighborPosition } from './focusable-node';
import {
  FOCUSABLE_ROOT_PARENT,
  FocusableOrientation,
  getNodeByFocusKey,
  getNodeFocusKey,
  isNodeConstraintToParent,
  isNodeFocusFirstChild,
  isNodeFocusable,
  isNodeIsParent,
  removeAllSnAttributes,
  setFocusableStatus,
  setNodeConstraintToParent,
  setNodeFocusFirstChild,
  setNodeFocusKey,
  setNodeFocused,
  setNodeIsParent,
  setNodeOrientation,
  setNodeParentFocusKey,
  setNodePreventScrollOnChildFocus,
} from './spacial-node';
import { VisualDebugger } from './visual-debugger';

const DEBUG_FN_COLORS = ['#0FF', '#FF0', '#F0F'];

declare type ParentEvent = 'parentFocused' | 'parentBlurred' | 'childFocused' | 'childBlurred' | 'childClicked';

interface ParentEventCallback {
  parentFocused?: (node: HTMLElement) => void;
  parentBlurred?: (node: HTMLElement) => void;
  childFocused?: (node: HTMLElement) => void;
  childBlurred?: (node: HTMLElement) => void;
  childClicked?: (node: HTMLElement) => void;
}

let focusKeyCounter = 0;

export class SpacialNavigation {
  private focusableNodes: FocusableNode[] = [];
  private saveLastFocusedChildByParentFocusKey: Map<string, boolean> = new Map();
  private lastFocusNodeByParentFocusKey: Map<string, FocusableNode> = new Map();
  private callbackByParentFocusKey: Map<string, ParentEventCallback> = new Map();
  private currentlyFocusedNode: FocusableNode | null = null;
  private enabled: boolean = false;

  private debug: boolean = false;
  private logIndex: number = 0;

  private updateNeighborsDebounceTimer: number | undefined;

  visualDebugger: VisualDebugger | undefined;

  get currentlyFocusKey(): string | undefined {
    return this.currentlyFocusedNode?.getFocusKey() ?? undefined;
  }

  constructor({ debug = false, visualDebug = false }: { debug?: boolean; visualDebug?: boolean }) {
    this.debug = debug;

    if (visualDebug) {
      document.body.classList.add('sn-debug');
      this.visualDebugger = new VisualDebugger(this);

      // setTimeout(() => {
      //   this.focusByFocusKey('homeTrending');
      // }, 500);
    }

    this.log('initialize', `debug: ${debug} - visualDebug: ${visualDebug}`);

    this.focusableNodes = [];
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.enable();

    this.registerParentNode({
      node: document.body,
      focusKey: FOCUSABLE_ROOT_PARENT,
    });
  }

  toggleDebug() {
    this.debug = !this.debug;

    if (this.debug) {
      document.body.classList.add('sn-debug');
    } else {
      document.body.classList.remove('sn-debug');
    }

    if (this.debug && !this.visualDebugger) {
      this.visualDebugger = new VisualDebugger(this);
    }

    this.visualDebugger?.toggleDebugMode();
    this.visualDebugger?.updateDisplay();
  }

  addParentListener({
    parentFocusKey,
    event,
    callback,
  }: {
    parentFocusKey: string;
    event: ParentEvent;
    callback: (node: HTMLElement) => void;
  }) {
    const parentCallback: ParentEventCallback = this.callbackByParentFocusKey.get(parentFocusKey) ?? {};

    parentCallback[event] = callback;

    this.callbackByParentFocusKey.set(parentFocusKey, parentCallback);
  }

  private callParentEventCallback({
    parentFocusKey,
    event,
    node,
  }: {
    parentFocusKey: string;
    event: ParentEvent;
    node: HTMLElement;
  }) {
    const parentCallback = this.callbackByParentFocusKey.get(parentFocusKey);
    if (parentCallback) {
      parentCallback[event]?.(node);
    }
  }

  private getFocusableNodesByParentFocusKey(parentFocusKey: string) {
    return this.focusableNodes.filter((fi) => fi.getParentFocusKey() === parentFocusKey);
  }

  registerParentNode({
    node,
    focusKey,
    orientation,
    saveLastFocusedChild = false, // only used for parent nodes
    constraintToParent = false,
    focusFirstChild = false,
    preventScrollOnChildFocus = false,
  }: {
    node: HTMLElement;
    focusKey?: string;
    saveLastFocusedChild?: boolean;
    orientation?: FocusableOrientation;
    constraintToParent?: boolean;
    focusFirstChild?: boolean;
    preventScrollOnChildFocus?: boolean;
  }) {
    const originText = origin ? ` - origin: ${origin}` : '';

    const isParent = isNodeIsParent(node);

    if (isParent) {
      // already registered
      return null;
    }
    const currentFocusKey = getNodeFocusKey(node);

    const focusKeyAttribute = focusKey ?? currentFocusKey ?? `sn-pfk-${focusKeyCounter++}`;
    setNodeFocusKey(node, focusKeyAttribute);
    setNodeIsParent(node);

    this.saveLastFocusedChildByParentFocusKey.set(focusKeyAttribute, saveLastFocusedChild);

    if (orientation) {
      setNodeOrientation(node, orientation);
    }

    if (constraintToParent) {
      setNodeConstraintToParent(node);
    }

    if (focusFirstChild) {
      setNodeFocusFirstChild(node);
    }

    if (preventScrollOnChildFocus) {
      setNodePreventScrollOnChildFocus(node);
    }

    this.log('registerParentNode', `registerParentNode pfk:${focusKeyAttribute}${originText}`);

    return focusKeyAttribute;
  }

  registerNode({
    node,
    origin,
    focusKey,
    parentFocusKey,
    focusNode = false,
    preventScrollOnFocus = false,
  }: {
    node: HTMLElement;
    origin?: string;
    focusKey?: string;
    parentFocusKey: string;
    focusNode?: boolean;
    preventScrollOnFocus?: boolean;
  }) {
    const originText = origin ? ` - origin: ${origin}` : '';
    if (!isNodeFocusable(node)) {
      this.log('registerNode', `not focusable${originText}`, node);
      return null;
    }

    const currentFocusKey = getNodeFocusKey(node);

    if (currentFocusKey && this.getFocusableNodeByFocusKey(currentFocusKey)) {
      // already registered
      return this.getFocusableNodeByFocusKey(currentFocusKey);
    }

    const focusKeyAttribute = focusKey ?? currentFocusKey ?? `sn-fk-${focusKeyCounter++}`;
    setNodeFocusKey(node, focusKeyAttribute);
    setNodeParentFocusKey(node, parentFocusKey);

    node.setAttribute('tabindex', '0');

    this.log(
      'registerNode',
      `${this.getFkLogString({
        parentFocusKey,
        focusKey: focusKeyAttribute,
      })}${originText} - shouldFocus: ${focusNode}`,
    );

    const fi = this.addFocusableNode({ node, preventScrollOnFocus });

    // Delay this to return the focusable node to allow the directive to set the focus
    setTimeout(() => {
      if (focusNode || !this.currentlyFocusedNode) {
        this.focusByFocusKey(focusKeyAttribute);
      } else {
        this.resetCurrentFocusedNodeNeighbors();
      }
    }, 1);

    return fi;
  }

  private addFocusableNode({
    node,
    preventScrollOnFocus = false,
  }: {
    node: HTMLElement;
    preventScrollOnFocus?: boolean;
  }) {
    const fi = new FocusableNode(node, preventScrollOnFocus);
    this.focusableNodes.push(fi);

    setFocusableStatus(node, 'active');

    return fi;
  }

  unregisterNode({ focusKey }: { focusKey: string }) {
    const node = this.getFocusableNodeByFocusKey(focusKey);
    if (!node) {
      return;
    }

    node.removeListeners();

    const parentFocusKey = node.getParentFocusKey();
    if (parentFocusKey) {
      this.saveLastFocusedChildByParentFocusKey.delete(parentFocusKey);
      this.lastFocusNodeByParentFocusKey.delete(parentFocusKey);
    }
    this.focusableNodes = this.focusableNodes.filter((fi) => fi.getFocusKey() !== focusKey);

    if (this.currentlyFocusedNode?.getFocusKey() === focusKey) {
      this.currentlyFocusedNode = null;
    }

    // Remove all sn- attributes
    removeAllSnAttributes(node.getElement());

    this.log('unregisterParentNode', `pfk:${parentFocusKey}/fk:${focusKey}`);
  }

  disableNode({ focusKey }: { focusKey: string }) {
    const node = this.getFocusableNodeByFocusKey(focusKey);
    if (node) {
      node.disable();
      this.resetCurrentFocusedNodeNeighbors();
      this.log('disableNode', this.getFkLogString({ parentFocusKey: node.getParentFocusKey(), focusKey }));
    }
  }

  enableNode({ focusKey }: { focusKey: string }) {
    const node = this.getFocusableNodeByFocusKey(focusKey);
    if (node) {
      node.enable();
      this.resetCurrentFocusedNodeNeighbors();
      this.log('enableNode', this.getFkLogString({ parentFocusKey: node.getParentFocusKey(), focusKey }));
    }
  }

  resetCurrentFocusedNodeNeighbors() {
    if (this.currentlyFocusedNode) {
      this.updateNeighborsDebounced(this.currentlyFocusedNode);
    }
  }

  unregisterDeletedNodes() {
    for (const node of this.focusableNodes) {
      if (!document.body.contains(node.getElement())) {
        const focusKey = node.getFocusKey();
        if (focusKey) {
          this.unregisterNode({ focusKey });
          if (this.currentlyFocusedNode?.getFocusKey() === focusKey) {
            this.currentlyFocusedNode = null;
          }
        } else {
          // remove from the array
          this.focusableNodes = this.focusableNodes.filter((fi) => fi.getElement() !== node.getElement());
        }
      }
    }
  }

  getFocusableNodes(): FocusableNode[] {
    return this.focusableNodes;
  }

  private getFocusableNodeByFocusKey(focusKey: string) {
    return this.focusableNodes.find((fi) => fi.getFocusKey() === focusKey) || null;
  }

  private saveLastFocusedChild({ parentFocusKey, node }: { parentFocusKey: string; node: FocusableNode }) {
    if (this.saveLastFocusedChildByParentFocusKey.get(parentFocusKey)) {
      this.lastFocusNodeByParentFocusKey.set(parentFocusKey, node);
      this.log('saveLastFocusedChild', this.getFkLogString({ parentFocusKey, focusKey: node.getFocusKey() }));
    }
  }

  private callAction({
    action,
    node,
    oldParentFocusKey,
    newParentFocusKey,
  }: {
    action: 'focus' | 'blur' | 'click';
    node: FocusableNode;
    oldParentFocusKey?: string;
    newParentFocusKey?: string;
  }) {
    const parentFocusKey = node.getParentFocusKey();
    const focusKey = node.getFocusKey();

    if (!parentFocusKey || !focusKey) {
      return;
    }

    switch (action) {
      case 'focus':
        node.focus();
        this.callParentEventCallback({
          parentFocusKey,
          event: 'childFocused',
          node: node.getElement(),
        });
        const parentNode = node.getParentNode();
        if (parentNode && oldParentFocusKey && newParentFocusKey && oldParentFocusKey !== newParentFocusKey) {
          this.callParentEventCallback({
            parentFocusKey: newParentFocusKey,
            event: 'parentFocused',
            node: parentNode,
          });
        }
        break;
      case 'blur':
        node.blur();
        this.callParentEventCallback({
          parentFocusKey,
          event: 'childBlurred',
          node: node.getElement(),
        });
        if (oldParentFocusKey && newParentFocusKey && oldParentFocusKey !== newParentFocusKey) {
          this.callParentEventCallback({
            parentFocusKey: oldParentFocusKey,
            event: 'parentBlurred',
            node: getNodeByFocusKey(oldParentFocusKey)!,
          });
        }
        break;
      case 'click':
        node.click();
        this.callParentEventCallback({
          parentFocusKey,
          event: 'childClicked',
          node: node.getElement(),
        });
        break;
    }
    this.log(
      'callAction',
      this.getFkLogString({
        parentFocusKey,
        focusKey,
      }),
      action,
    );
  }

  focusByFocusKey(focusKey: string) {
    const fi = this.getFocusableNodeByFocusKey(focusKey);
    if (!fi) {
      this.log('focusByFocusKey', `no focusable node found for ${focusKey}`);
      this.focusFirstItem();
      return;
    }

    this.unregisterDeletedNodes();

    let oldParentFocusKey = fi.getParentFocusKey();
    const newParentFocusKey = fi.getParentFocusKey();

    const oldItem = this.currentlyFocusedNode;

    if (oldItem) {
      oldParentFocusKey = oldItem.getParentFocusKey();

      this.callAction({
        action: 'blur',
        node: oldItem,
        oldParentFocusKey,
        newParentFocusKey,
      });

      setNodeFocused(oldItem.getElement(), false);

      if (oldParentFocusKey) {
        this.saveLastFocusedChild({
          parentFocusKey: oldParentFocusKey,
          node: oldItem,
        });
      }

      oldItem.resetNeighbors();
    }

    setNodeFocused(fi.getElement(), true);

    this.currentlyFocusedNode = fi;

    this.callAction({
      action: 'focus',
      node: fi,
      oldParentFocusKey,
      newParentFocusKey,
    });

    this.updateNeighbors(this.currentlyFocusedNode);

    if (newParentFocusKey) {
      this.saveLastFocusedChild({
        parentFocusKey: newParentFocusKey,
        node: this.currentlyFocusedNode,
      });
    }
  }

  private focusFirstItem() {
    if (this.focusableNodes.length > 0) {
      const firstItem = this.focusableNodes[0];
      if (firstItem) {
        const focusKey = firstItem.getFocusKey();
        if (focusKey) {
          this.focusByFocusKey(focusKey);
        }
      }
    }
  }

  moveFocus(direction: NeighborPosition, attempt = 0) {
    let logString = `direction: ${direction} - attempt: ${attempt}`;

    // We need an item to move down from
    if (!this.currentlyFocusedNode) {
      if (this.focusableNodes.length > 0) {
        this.log('moveFocus', logString, 'no currently focused item, going to first item');
        this.focusFirstItem();
      } else {
        this.log('moveFocus', logString, 'no focusable nodes, doing nothing');
      }
      return;
    }

    let nextNodeToFocus: FocusableNode | null = null;

    nextNodeToFocus = this.currentlyFocusedNode.getNeighborNode(direction);

    if (nextNodeToFocus && !document.body.contains(nextNodeToFocus.getElement())) {
      this.unregisterDeletedNodes();
      nextNodeToFocus = null;
    }

    if (nextNodeToFocus && nextNodeToFocus.getFocusKey() === this.currentlyFocusedNode.getFocusKey()) {
      this.log(
        'moveFocus',
        logString,
        `${this.getFkLogString({
          parentFocusKey: nextNodeToFocus.getParentFocusKey(),
          focusKey: nextNodeToFocus.getFocusKey(),
        })} already focused`,
      );
      return;
    }

    if (nextNodeToFocus !== null) {
      this.log(
        'moveFocus',
        logString,
        `${this.getFkLogString({
          parentFocusKey: this.currentlyFocusedNode.getParentFocusKey(),
          focusKey: this.currentlyFocusedNode.getFocusKey(),
        })} --> ${this.getFkLogString({
          parentFocusKey: nextNodeToFocus.getParentFocusKey(),
          focusKey: nextNodeToFocus.getFocusKey(),
        })}`,
      );

      const focusKey = nextNodeToFocus.getFocusKey();
      if (focusKey) {
        this.focusByFocusKey(focusKey);
      }
    } else {
      if (attempt === 0) {
        this.log('moveFocus', logString, `no neighbor, updating neighbors and trying again`);
        // If no neighbor, update neighbors and if any in the desired direction, focus on it
        this.updateNeighbors(this.currentlyFocusedNode);
        const neighbor = this.currentlyFocusedNode.getNeighborNode(direction);
        if (neighbor) {
          this.log(
            'moveFocus',
            logString,
            this.getFkLogString({
              parentFocusKey: this.currentlyFocusedNode.getParentFocusKey(),
              focusKey: this.currentlyFocusedNode.getFocusKey(),
            }),
            ` no neighbor for direction ${direction} in first attempt, but found after update neighbors`,
          );
          this.moveFocus(direction, attempt + 1);
          return;
        }
      }

      const parentNode = this.currentlyFocusedNode.getParentNode();
      if (parentNode) {
        const isConstraintToParent = isNodeConstraintToParent(parentNode);
        if (isConstraintToParent) {
          const parentFocusKey = getNodeFocusKey(parentNode);
          if (parentFocusKey) {
            this.log(
              'moveFocus',
              logString,
              `no neighbor found, but node is constraint to parent pfk:${parentFocusKey}, doing nothing`,
            );
            return;
          }
        }
      }

      // If no neighbors in any direction and not constraint to parent, try to focus another element
      if (
        !this.currentlyFocusedNode.getNeighborNode('top') &&
        !this.currentlyFocusedNode.getNeighborNode('bottom') &&
        !this.currentlyFocusedNode.getNeighborNode('left') &&
        !this.currentlyFocusedNode.getNeighborNode('right')
      ) {
        this.log('moveFocus', logString, `no neighbor found, finding alternative node`);
        // Find first focusable node that's not the current one
        const alternativeNode = this.focusableNodes.find(
          (node) => node.getFocusKey() !== this.currentlyFocusedNode?.getFocusKey(),
        );

        if (alternativeNode) {
          const focusKey = alternativeNode.getFocusKey();
          if (focusKey) {
            this.focusByFocusKey(focusKey);
            return;
          }
        }
      }
      this.log('moveFocus', logString, `no neighbor found`);
    }
  }

  private updateNeighborsDebounced(focusedNode: FocusableNode) {
    if (this.updateNeighborsDebounceTimer) {
      clearTimeout(this.updateNeighborsDebounceTimer);
    }

    this.updateNeighborsDebounceTimer = setTimeout(() => {
      this.updateNeighbors(focusedNode);
    }, 1);
  }

  private updateNeighbors(focusedNode: FocusableNode) {
    focusedNode.resetNeighbors();

    const orientation = focusedNode.getOrientation();
    const parentFocusKey = focusedNode.getParentFocusKey();
    const parentNode = focusedNode.getParentNode();
    if (!parentFocusKey || !parentNode) {
      return;
    }

    let canMoveTop = !orientation || orientation === 'vertical';
    let canMoveBottom = !orientation || orientation === 'vertical';
    let canMoveLeft = !orientation || orientation === 'horizontal';
    let canMoveRight = !orientation || orientation === 'horizontal';

    // First we find the closest node in the same parent
    const nodesInSameParent = this.focusableNodes.filter(
      (node) =>
        node.isFocusable() &&
        node.getParentFocusKey() === parentFocusKey &&
        node.getFocusKey() !== focusedNode.getFocusKey(),
    );

    setNeighbors({
      fromNode: focusedNode,
      neighborNodes: nodesInSameParent,
      canMoveTop,
      canMoveBottom,
      canMoveLeft,
      canMoveRight,
      nodesAreInSameParent: true,
    });

    let nodesOutsideParent: FocusableNode[] = [];
    if (isNodeConstraintToParent(parentNode)) {
      this.log(
        'updateNeighbors',
        this.getFkLogString({
          parentFocusKey,
          focusKey: focusedNode.getFocusKey(),
        }),
        `Cannot focus outside parent`,
        focusedNode,
        nodesInSameParent,
      );
    } else {
      // Now for directions without node, check other neighbors that are outside the parent
      nodesOutsideParent = this.focusableNodes.filter(
        (node) =>
          node.isFocusable() &&
          node.getParentFocusKey() !== parentFocusKey &&
          node.getFocusKey() !== focusedNode.getFocusKey(),
      );

      // We can go to all directions if we don't have a neighbor in that direction already
      canMoveTop = focusedNode.getNeighborNode('top') === null;
      canMoveBottom = focusedNode.getNeighborNode('bottom') === null;
      canMoveLeft = focusedNode.getNeighborNode('left') === null;
      canMoveRight = focusedNode.getNeighborNode('right') === null;

      // const nodesOutsideParentElements = nodesOutsideParent.map((node) => node.getElement());
      // if (focusedNode.getFocusKey() === 'sn-fk-7') {
      //   debugger;
      // }

      setNeighbors({
        fromNode: focusedNode,
        neighborNodes: nodesOutsideParent,
        canMoveTop,
        canMoveBottom,
        canMoveLeft,
        canMoveRight,
        nodesAreInSameParent: false,
      });

      // For all neighbors outside the parent, check if there's a last focused node for that parent
      const positions: NeighborPosition[] = ['top', 'bottom', 'left', 'right'];
      for (const position of positions) {
        const neighbor = focusedNode.getNeighborNode(position);
        if (neighbor && neighbor.getParentFocusKey() !== parentFocusKey) {
          const neighborParentNode = neighbor.getParentNode();

          if (!neighborParentNode) {
            continue;
          }
          const focusFirstChild = isNodeFocusFirstChild(neighborParentNode);

          const lastFocusedInParent = this.lastFocusNodeByParentFocusKey.get(neighbor.getParentFocusKey() ?? '');

          let neighborSet = false;

          if (lastFocusedInParent && lastFocusedInParent.isFocusable()) {
            this.log(
              'updateNeighbors',
              this.getFkLogString({
                parentFocusKey,
                focusKey: focusedNode.getFocusKey(),
              }),
              `Change neighbor for direction ${position}`,
              `Previous neighbor: ${this.getFkLogString({
                parentFocusKey: neighbor.getParentFocusKey(),
                focusKey: neighbor.getFocusKey(),
              })}`,
              `New neighbor: ${this.getFkLogString({
                parentFocusKey: lastFocusedInParent.getParentFocusKey(),
                focusKey: lastFocusedInParent.getFocusKey(),
              })}`,
            );
            focusedNode.setNeighborNode(lastFocusedInParent, position);
            neighborSet = true;
          }

          if (!neighborSet && focusFirstChild) {
            // Get the first child of the parent
            const neighborParentFocusKey = neighbor.getParentFocusKey();
            if (!neighborParentFocusKey) {
              continue;
            }
            const children = this.getFocusableNodesByParentFocusKey(neighborParentFocusKey);
            if (children.length > 0) {
              const firstChildFocusableNode = children[0];

              if (firstChildFocusableNode.isFocusable()) {
                focusedNode.setNeighborNode(firstChildFocusableNode, position);
              }
            }
          }
        }
      }
    }
    if (focusedNode.getFocusKey() === 'home-movie-1') {
      //debugger;
    }
    const upLogString = `${this.getFkLogString({
      parentFocusKey: focusedNode.getNeighborNode('top')?.getParentFocusKey(),
      focusKey: focusedNode.getNeighborNode('top')?.getFocusKey(),
    })}`;
    const downLogString = `${this.getFkLogString({
      parentFocusKey: focusedNode.getNeighborNode('bottom')?.getParentFocusKey(),
      focusKey: focusedNode.getNeighborNode('bottom')?.getFocusKey(),
    })}`;
    const leftLogString = `${this.getFkLogString({
      parentFocusKey: focusedNode.getNeighborNode('left')?.getParentFocusKey(),
      focusKey: focusedNode.getNeighborNode('left')?.getFocusKey(),
    })}`;
    const rightLogString = `${this.getFkLogString({
      parentFocusKey: focusedNode.getNeighborNode('right')?.getParentFocusKey(),
      focusKey: focusedNode.getNeighborNode('right')?.getFocusKey(),
    })}`;

    this.log(
      'updateNeighbors',
      this.getFkLogString({
        parentFocusKey,
        focusKey: focusedNode.getFocusKey(),
      }),
      `orientation: ${orientation}`,
      `
Node in same parent: ${nodesInSameParent.length}
Node outside parent: ${nodesOutsideParent.length}
up --> ${upLogString}
down --> ${downLogString}
left --> ${leftLogString}
right --> ${rightLogString}`,
      focusedNode,
    );

    this.visualDebugger?.updateDisplay();
  }

  disable() {
    if (!this.enabled) {
      return;
    }

    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);

    this.enabled = false;

    this.log('disable', 'done');
  }

  enable() {
    if (this.enabled) {
      return;
    }

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    this.enabled = true;

    this.log('enable', 'done');
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Tab':
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.moveFocus('left' as NeighborPosition);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveFocus('top' as NeighborPosition);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.moveFocus('right' as NeighborPosition);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocus('bottom' as NeighborPosition);
        break;
      case 'Enter':
      case ' ':
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          break;
        }
        event.preventDefault();

        break;
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        if (this.currentlyFocusedNode) {
          event.preventDefault();
          this.callAction({
            action: 'click',
            node: this.currentlyFocusedNode,
          });
        }
        break;
    }
  }

  log(functionName: string, debugString: string, ...rest: any[]) {
    if (this.debug) {
      console.log(
        `%cSN:${functionName}%c${debugString}`,
        `background: ${DEBUG_FN_COLORS[this.logIndex++ % DEBUG_FN_COLORS.length]}; color: black; padding: 1px 5px;`,
        'background: #333; color: #BADA55; padding: 1px 5px;',
        ...rest,
      );
    }
  }

  private getFkLogString({ parentFocusKey, focusKey }: { parentFocusKey?: string; focusKey?: string }) {
    return `pfk:${parentFocusKey}/fk:${focusKey}`;
  }
}
