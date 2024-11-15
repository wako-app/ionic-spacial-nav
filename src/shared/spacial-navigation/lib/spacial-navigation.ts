import {
  calcDistance,
  getBottomDistance,
  getElementMetrics,
  getLeftDistance,
  getRightDistance,
  getTopDistance,
} from './calc-distance';
import { FocusableNode, Metrics, NeighborPosition } from './focusable-node';
import {
  FocusableOrientation,
  getNodeByFocusKey,
  getNodeFocusKey,
  getNodeParentFocusKey,
  isNodeConstraintToParent,
  isNodeFocusable,
  isNodeFocusFirstChild,
  removeAllSnAttributes,
  setFocusableStatus,
  setNodeConstraintToParent,
  setNodeFocused,
  setNodeFocusFirstChild,
  setNodeFocusKey,
  setNodeIsParent,
  setNodeOrientation,
  setNodeParentFocusKey,
} from './spacial-node';
import { VisualDebugger } from './visual-debugger';

const DEBUG_FN_COLORS = ['#0FF', '#FF0', '#F0F'];

declare type ParentEvent =
  | 'parentFocused'
  | 'parentBlurred'
  | 'childFocused'
  | 'childBlurred'
  | 'childClicked';

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
  private saveLastFocusedChildByParentFocusKey: Map<string, boolean> =
    new Map();
  private lastFocusNodeByParentFocusKey: Map<string, FocusableNode> = new Map();
  private callbackByParentFocusKey: Map<string, ParentEventCallback> =
    new Map();
  private currentlyFocusedNode: FocusableNode | null = null;
  private enabled: boolean = false;

  private debug: boolean = false;
  private logIndex: number = 0;

  private updateNeighborsDebounceTimer: number | undefined;

  visualDebugger: VisualDebugger | undefined;

  get currentlyFocusKey(): string | undefined {
    return this.currentlyFocusedNode?.getFocusKey() ?? undefined;
  }

  constructor({
    debug = false,
    visualDebug = false,
  }: {
    debug?: boolean;
    visualDebug?: boolean;
  }) {
    this.debug = debug;

    if (visualDebug) {
      document.body.classList.add('sn-debug');
      this.visualDebugger = new VisualDebugger(this);

      // setTimeout(() => {
      //   this.focusByFocusKey('sn-fk-0');
      // }, 500);
    }

    this.log('initialize', `debug: ${debug} - visualDebug: ${visualDebug}`);

    this.focusableNodes = [];
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.enable();
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
    const parentCallback: ParentEventCallback =
      this.callbackByParentFocusKey.get(parentFocusKey) ?? {};

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
    return this.focusableNodes.filter(
      (fi) => fi.getParentFocusKey() === parentFocusKey
    );
  }

  registerParentNode({
    node,
    focusKey,
    orientation,
    saveLastFocusedChild = false, // only used for parent nodes
    constraintToParent = false,
    focusFirstChild = false,
  }: {
    node: HTMLElement;
    focusKey?: string;
    saveLastFocusedChild?: boolean;
    orientation?: FocusableOrientation;
    constraintToParent?: boolean;
    focusFirstChild?: boolean;
  }) {
    const originText = origin ? ` - origin: ${origin}` : '';

    const hasFocusKey = getNodeFocusKey(node) !== null;

    if (hasFocusKey) {
      // already registered
      return null;
    }

    const focusKeyAttribute = focusKey ?? `sn-pfk-${focusKeyCounter++}`;
    setNodeFocusKey(node, focusKeyAttribute);
    setNodeIsParent(node);

    this.saveLastFocusedChildByParentFocusKey.set(
      focusKeyAttribute,
      saveLastFocusedChild
    );

    if (orientation) {
      setNodeOrientation(node, orientation);
    }

    if (constraintToParent) {
      setNodeConstraintToParent(node);
    }

    if (focusFirstChild) {
      setNodeFocusFirstChild(node);
    }

    this.log(
      'registerParentNode',
      `registerParentNode pfk:${focusKeyAttribute}${originText}`
    );

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

    const focusKeyAttribute = focusKey ?? `sn-fk-${focusKeyCounter++}`;
    setNodeFocusKey(node, focusKeyAttribute);
    setNodeParentFocusKey(node, parentFocusKey);

    // Check if parent exists
    const parentNode = getNodeByFocusKey(parentFocusKey);
    if (!parentNode) {
      throw new Error(`Parent node ${parentFocusKey} not found`);
    }

    node.setAttribute('tabindex', '0');

    this.log(
      'registerNode',
      `${this.getFkLogString({
        parentFocusKey,
        focusKey: focusKeyAttribute,
      })}${originText} - shouldFocus: ${focusNode}`
    );

    const fi = this.addFocusableNode({ node, preventScrollOnFocus });

    if (focusNode || !this.currentlyFocusedNode) {
      this.focusByFocusKey(focusKeyAttribute);
    } else {
      this.resetCurrentFocusedNodeNeighbors();
    }

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
    this.focusableNodes = this.focusableNodes.filter(
      (fi) => fi.getFocusKey() !== focusKey
    );

    if (this.currentlyFocusedNode?.getFocusKey() === focusKey) {
      this.currentlyFocusedNode = null;
    }

    // Remove all sn- attributes
    removeAllSnAttributes(node.getElement());

    this.log('unregisterParentNode', `pfk:${parentFocusKey}/fk:${focusKey}`);
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
        }
      }
    }
  }

  getFocusableNodes(): FocusableNode[] {
    return this.focusableNodes;
  }

  private getFocusableNodeByFocusKey(focusKey: string) {
    return (
      this.focusableNodes.find((fi) => fi.getFocusKey() === focusKey) || null
    );
  }

  private saveLastFocusedChild({
    parentFocusKey,
    node,
  }: {
    parentFocusKey: string;
    node: FocusableNode;
  }) {
    if (this.saveLastFocusedChildByParentFocusKey.get(parentFocusKey)) {
      this.lastFocusNodeByParentFocusKey.set(parentFocusKey, node);
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
        if (
          parentNode &&
          oldParentFocusKey &&
          newParentFocusKey &&
          oldParentFocusKey !== newParentFocusKey
        ) {
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
        if (
          oldParentFocusKey &&
          newParentFocusKey &&
          oldParentFocusKey !== newParentFocusKey
        ) {
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
      action
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
        this.log(
          'moveFocus',
          logString,
          'no currently focused item, going to first item'
        );
        this.focusFirstItem();
      } else {
        this.log('moveFocus', logString, 'no focusable nodes, doing nothing');
      }
      return;
    }

    let nextNodeToFocus: FocusableNode | null = null;

    nextNodeToFocus = this.currentlyFocusedNode.getNeighborNode(direction);

    if (
      nextNodeToFocus &&
      nextNodeToFocus.getFocusKey() === this.currentlyFocusedNode.getFocusKey()
    ) {
      this.log(
        'moveFocus',
        logString,
        `${this.getFkLogString({
          parentFocusKey: nextNodeToFocus.getParentFocusKey(),
          focusKey: nextNodeToFocus.getFocusKey(),
        })} already focused`
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
        })}`
      );

      const focusKey = nextNodeToFocus.getFocusKey();
      if (focusKey) {
        this.focusByFocusKey(focusKey);
      }
    } else {
      if (attempt === 0) {
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
            ` no neighbor for direction ${direction} in first attempt, but found after update neighbors`
          );
          this.moveFocus(direction, attempt + 1);
          return;
        }
      }
      // If no neighbors in any direction, try to focus another element
      if (
        !this.currentlyFocusedNode.getNeighborNode('top') &&
        !this.currentlyFocusedNode.getNeighborNode('bottom') &&
        !this.currentlyFocusedNode.getNeighborNode('left') &&
        !this.currentlyFocusedNode.getNeighborNode('right')
      ) {
        // Find first focusable node that's not the current one
        const alternativeNode = this.focusableNodes.find(
          (node) =>
            node.getFocusKey() !== this.currentlyFocusedNode?.getFocusKey()
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
        node.getParentFocusKey() === parentFocusKey &&
        node.getFocusKey() !== focusedNode.getFocusKey()
    );

    this.setNeighbors({
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
        nodesInSameParent
      );
    } else {
      // Now for directions without node, check other neighbors that are outside the parent
      nodesOutsideParent = this.focusableNodes.filter(
        (node) =>
          node.getParentFocusKey() !== parentFocusKey &&
          node.getFocusKey() !== focusedNode.getFocusKey() &&
          isNodeFocusable(node.getElement())
      );

      // // Includes parent nodes
      // nodesOutsideParent.push(
      //   ...this.focusableNodes.filter((node) => isNodeIsParent(node.getElement()))
      // );

      // We can go to all directions if we don't have a neighbor in that direction already
      canMoveTop = focusedNode.getNeighborNode('top') === null;
      canMoveBottom = focusedNode.getNeighborNode('bottom') === null;
      canMoveLeft = focusedNode.getNeighborNode('left') === null;
      canMoveRight = focusedNode.getNeighborNode('right') === null;

      this.setNeighbors({
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

          const lastFocusedInParent = this.lastFocusNodeByParentFocusKey.get(
            neighbor.getParentFocusKey() ?? ''
          );
          if (
            lastFocusedInParent &&
            lastFocusedInParent.getFocusKey() !== neighbor.getFocusKey()
          ) {
            this.log(
              'updateNeighbors',
              this.getFkLogString({
                parentFocusKey,
                focusKey: focusedNode.getFocusKey(),
              }),
              `Change neighbor for direction ${position}`,
              `Previous neighbor: fk:${neighbor.getFocusKey()}`,
              `New neighbor: fk:${lastFocusedInParent.getFocusKey()}`
            );
            focusedNode.setNeighborNode(lastFocusedInParent, position);
          }
          if (!lastFocusedInParent && focusFirstChild) {
            // Get the first child of the parent
            const neighborParentFocusKey = neighbor.getParentFocusKey();
            if (!neighborParentFocusKey) {
              continue;
            }
            const children = this.getFocusableNodesByParentFocusKey(
              neighborParentFocusKey
            );
            if (children.length > 0) {
              const firstChildFocusableNode = children[0];

              if (firstChildFocusableNode) {
                focusedNode.setNeighborNode(firstChildFocusableNode, position);
              }
            }
          }
        }
      }
    }

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
up --> ${focusedNode.getNeighborNode('top')?.getFocusKey()}
down --> ${focusedNode.getNeighborNode('bottom')?.getFocusKey()}
left --> ${focusedNode.getNeighborNode('left')?.getFocusKey()}
right --> ${focusedNode.getNeighborNode('right')?.getFocusKey()}`,
      focusedNode
    );

    this.visualDebugger?.updateDisplay();
  }

  private setNeighbors({
    fromNode,
    neighborNodes,
    canMoveTop,
    canMoveBottom,
    canMoveLeft,
    canMoveRight,
    nodesAreInSameParent = false,
  }: {
    fromNode: FocusableNode;
    neighborNodes: FocusableNode[];
    canMoveTop: boolean;
    canMoveBottom: boolean;
    canMoveLeft: boolean;
    canMoveRight: boolean;
    nodesAreInSameParent?: boolean;
  }) {
    const fromMetrics = fromNode.getMetrics();
    const fromParentNode = fromNode.getParentNode();
    if (!fromParentNode) {
      return;
    }

    const nodeWithMetrics: {
      node: FocusableNode;
      metrics: Metrics;
    }[] = [];

    for (const newNode of neighborNodes) {
      nodeWithMetrics.push({
        node: newNode,
        metrics: newNode.getMetrics(),
      });
    }

    const candidateNodeByDirection: Record<
      NeighborPosition,
      {
        node: FocusableNode;
        metrics: Metrics;
      }[]
    > = {
      top: [],
      bottom: [],
      left: [],
      right: [],
    };

    if (nodesAreInSameParent) {
      // For top/bottom directions, first find nodes with minimum Y distance
      const topNodes = nodeWithMetrics.filter(
        ({ metrics }) => metrics.center.y < fromMetrics.center.y
      );
      const bottomNodes = nodeWithMetrics.filter(
        ({ metrics }) => metrics.center.y > fromMetrics.center.y
      );

      let minTopY = Infinity;
      let minBottomY = Infinity;

      // Find minimum Y distances
      for (const { metrics } of topNodes) {
        const yDist = fromMetrics.center.y - metrics.center.y;
        minTopY = Math.min(minTopY, yDist);
      }

      for (const { metrics } of bottomNodes) {
        const yDist = metrics.center.y - fromMetrics.center.y;
        minBottomY = Math.min(minBottomY, yDist);
      }

      // Filter to only include nodes at minimum Y distance
      candidateNodeByDirection.top = topNodes.filter(
        ({ metrics }) =>
          Math.abs(fromMetrics.center.y - metrics.center.y - minTopY) < 1
      );

      candidateNodeByDirection.bottom = bottomNodes.filter(
        ({ metrics }) =>
          Math.abs(metrics.center.y - fromMetrics.center.y - minBottomY) < 1
      );

      candidateNodeByDirection.left = nodeWithMetrics;
      candidateNodeByDirection.right = nodeWithMetrics;
    } else {
      const fromParentMetrics = getElementMetrics(fromParentNode);

      // Get parent nodes metrics
      const parentNodes = new Map<
        string,
        { parentNode: HTMLElement; parentMetrics: Metrics }
      >();
      for (const { node } of nodeWithMetrics) {
        const parentFocusKey = node.getParentFocusKey();
        if (!parentFocusKey || parentNodes.has(parentFocusKey)) continue;

        const parentElement = node.getParentNode();
        if (!parentElement) {
          continue;
        }
        const parentMetrics = getElementMetrics(parentElement);

        parentNodes.set(parentFocusKey, {
          parentNode: parentElement,
          parentMetrics,
        });
      }

      // Filter nodes based on parent position relative to current node
      for (const [parentFocusKey, { parentMetrics }] of parentNodes) {
        const isParentAbove = parentMetrics.bottom <= fromParentMetrics.top;
        const isParentBelow = parentMetrics.top >= fromParentMetrics.bottom;
        const isParentLeft = parentMetrics.right <= fromParentMetrics.left;
        const isParentRight = parentMetrics.left >= fromParentMetrics.right;

        const nodesWithMetricsInParent = nodeWithMetrics.filter(
          ({ node }) => node.getParentFocusKey() === parentFocusKey
        );
        if (isParentAbove) {
          candidateNodeByDirection.top.push(...nodesWithMetricsInParent);
        }
        if (isParentBelow) {
          candidateNodeByDirection.bottom.push(...nodesWithMetricsInParent);
        }
        if (isParentLeft) {
          candidateNodeByDirection.left.push(...nodesWithMetricsInParent);
        }
        if (isParentRight) {
          candidateNodeByDirection.right.push(...nodesWithMetricsInParent);
        }
      }
    }

    const directions: NeighborPosition[] = ['top', 'bottom', 'left', 'right'];

    for (const direction of directions) {
      let minElementDist: number | undefined;

      if (direction === 'top' && !canMoveTop) continue;
      if (direction === 'bottom' && !canMoveBottom) continue;
      if (direction === 'left' && !canMoveLeft) continue;
      if (direction === 'right' && !canMoveRight) continue;

      for (const {
        node: newItem,
        metrics: newMetrics,
      } of candidateNodeByDirection[direction]) {
        // Calculate distances in each direction
        let distance: number | null = null;
        switch (direction) {
          case 'top':
            distance = getTopDistance({
              fromMetrics: fromMetrics,
              toMetrics: newMetrics,
            });
            break;
          case 'bottom':
            distance = getBottomDistance({
              fromMetrics: fromMetrics,
              toMetrics: newMetrics,
            });
            break;
          case 'left':
            distance = getLeftDistance({
              fromMetrics: fromMetrics,
              toMetrics: newMetrics,
              preferCloserY: true,
            });
            break;
          case 'right':
            distance = getRightDistance({
              fromMetrics: fromMetrics,
              toMetrics: newMetrics,
              preferCloserY: true,
            });
            break;
        }

        // Update neighbors if this is the closest node in each direction
        if (
          distance !== null &&
          (minElementDist === undefined || minElementDist > distance)
        ) {
          minElementDist = distance;
          fromNode.setNeighborNode(newItem, direction);
        }
      }

      if (fromNode.getFocusKey() === 'sn-fk-0') {
        // debugger;
      }

      // If we are in the same parent or we have a min distance, we don't need to check other nodes in this direction
      if (
        nodesAreInSameParent ||
        minElementDist !== undefined ||
        direction === 'top' ||
        direction === 'bottom'
      ) {
        continue;
      }

      for (const {
        node: newItem,
        metrics: newMetrics,
      } of candidateNodeByDirection[direction]) {
        // Calculate distances in each direction
        let distance: number | null = null;
        switch (direction) {
          case 'left':
            distance = getLeftDistance({
              fromMetrics: fromMetrics,
              toMetrics: newMetrics,
              preferCloserY: false,
            });
            break;
          case 'right':
            distance = getRightDistance({
              fromMetrics: fromMetrics,
              toMetrics: newMetrics,
              preferCloserY: false,
            });
            break;
        }
        if (
          distance !== null &&
          (minElementDist === undefined || minElementDist > distance)
        ) {
          minElementDist = distance;
          fromNode.setNeighborNode(newItem, direction);
        }
      }
    }
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
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
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
        `background: ${
          DEBUG_FN_COLORS[this.logIndex++ % DEBUG_FN_COLORS.length]
        }; color: black; padding: 1px 5px;`,
        'background: #333; color: #BADA55; padding: 1px 5px;',
        ...rest
      );
    }
  }

  private getFkLogString({
    parentFocusKey,
    focusKey,
  }: {
    parentFocusKey?: string;
    focusKey?: string;
  }) {
    return `pfk:${parentFocusKey}/fk:${focusKey}`;
  }
}
