import {
  calcDistance,
  getBottomDistance,
  getLeftDistance,
  getRightDistance,
  getTopDistance,
} from './calc-distance';
import { FocusableNode, Metrics, NeighborPosition } from './focusable-node';
import {
  FocusableOrientation,
  getNodeByFocusKey,
  getNodeFocusKey,
  isNodeConstraintToParent,
  isNodeFocusable,
  isNodeIsParent,
  removeAllSnAttributes,
  setFocusableStatus,
  setNodeConstraintToParent,
  setNodeFocused,
  setNodeFocusKey,
  setNodeIsParent,
  setNodeOrientation,
  setNodeParentFocusKey,
} from './spacial-node';
import { VisualDebugger } from './visual-debugger';

const DEBUG_FN_COLORS = ['#0FF', '#FF0', '#F0F'];

let focusKeyCounter = 0;

export class SpacialNavigation {
  private focusableNodes: FocusableNode[] = [];
  private saveLastFocusedChildByParentFocusKey: Map<string, boolean> =
    new Map();
  private lastFocusNodeByParentFocusKey: Map<string, FocusableNode> = new Map();
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
      //   this.focusByFocusKey('BTN_0');
      // }, 1000);
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

  registerParentNode({
    node,
    focusKey,
    orientation,
    saveLastFocusedChild = false, // only used for parent nodes
    constraintToParent = false,
  }: {
    node: HTMLElement;
    focusKey?: string;
    saveLastFocusedChild?: boolean;
    orientation?: FocusableOrientation;
    constraintToParent?: boolean;
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
  }: {
    node: HTMLElement;
    origin?: string;
    focusKey?: string;
    parentFocusKey: string;
    focusNode?: boolean;
  }) {
    const originText = origin ? ` - origin: ${origin}` : '';
    if (!isNodeFocusable(node)) {
      this.log('registerNode', `not focusable${originText}`, node);
      return null;
    }

    const hasFocusKey = getNodeFocusKey(node) !== null;

    if (hasFocusKey) {
      // already registered
      return null;
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

    const fi = this.addFocusableNode(node);

    if (focusNode || !this.currentlyFocusedNode) {
      this.focusByFocusKey(fi.getFocusKey());
    } else {
      this.resetCurrentFocusedNodeNeighbors();
    }

    return fi;
  }

  private addFocusableNode(node: HTMLElement) {
    const fi = new FocusableNode(node);
    this.focusableNodes.push(fi);

    setFocusableStatus(node, 'active');

    return fi;
  }

  unregisterNode({ focusKey }: { focusKey: string }) {
    const node = this.getFocusableNodeByFocusKey(focusKey);
    if (!node) {
      return;
    }

    const parentFocusKey = node.getParentFocusKey();

    this.saveLastFocusedChildByParentFocusKey.delete(parentFocusKey);
    this.lastFocusNodeByParentFocusKey.delete(parentFocusKey);

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
        }
      }
    }
  }

  getFocusableNodes(): FocusableNode[] {
    return this.focusableNodes;
  }

  getFocusableNodeByFocusKey(focusKey: string) {
    return (
      this.focusableNodes.find((fi) => fi.getFocusKey() === focusKey) || null
    );
  }

  // TODO
  focus(node: HTMLElement) {
    const focusKey = getNodeFocusKey(node);
    if (!focusKey) {
      throw new Error('Node has no focus key');
    }
    this.focusByFocusKey(focusKey);
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

  focusByFocusKey(focusKey: string) {
    const fi = this.getFocusableNodeByFocusKey(focusKey);
    if (!fi) {
      this.log('focusByFocusKey', `no focusable node found for ${focusKey}`);
      this.focusFirstItem();
      return;
    }

    this.unregisterDeletedNodes();

    const oldItem = this.currentlyFocusedNode;

    if (oldItem) {
      this.log(
        'focusByFocusKey',
        this.getFkLogString({
          parentFocusKey: oldItem.getParentFocusKey(),
          focusKey: oldItem.getFocusKey(),
        }),
        'call blur()'
      );
      oldItem.blur();

      setNodeFocused(oldItem.getElement(), false);

      this.saveLastFocusedChild({
        parentFocusKey: oldItem.getParentFocusKey(),
        node: oldItem,
      });

      oldItem.resetNeighbors();
    }

    setNodeFocused(fi.getElement(), true);

    this.currentlyFocusedNode = fi;

    this.currentlyFocusedNode.focus();

    // this.onFocused({ newItem: this.currentlyFocusedNode, oldItem });

    this.updateNeighbors(this.currentlyFocusedNode);

    this.saveLastFocusedChild({
      parentFocusKey: this.currentlyFocusedNode.getParentFocusKey(),
      node: this.currentlyFocusedNode,
    });
  }

  private focusFirstItem() {
    if (this.focusableNodes.length > 0) {
      const firstItem = this.focusableNodes[0];
      this.focusByFocusKey(firstItem.getFocusKey());
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

      this.focusByFocusKey(nextNodeToFocus.getFocusKey());
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
          !isNodeIsParent(node.getElement()) &&
          isNodeFocusable(node.getElement())
      );

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
      });

      // For all neighbors outside the parent, check if there's a last focused node for that parent
      const positions: NeighborPosition[] = ['top', 'bottom', 'left', 'right'];
      for (const position of positions) {
        const neighbor = focusedNode.getNeighborNode(position);
        if (neighbor && neighbor.getParentFocusKey() !== parentFocusKey) {
          const lastFocusedInParent = this.lastFocusNodeByParentFocusKey.get(
            neighbor.getParentFocusKey()
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
  }: {
    fromNode: FocusableNode;
    neighborNodes: FocusableNode[];
    canMoveTop: boolean;
    canMoveBottom: boolean;
    canMoveLeft: boolean;
    canMoveRight: boolean;
  }) {
    const metrics = fromNode.getMetrics();

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

    let minTopElementDist: number | undefined;
    let minBottomElementDist: number | undefined;
    let minLeftElementDist: number | undefined;
    let minRightElementDist: number | undefined;

    for (const { node: newItem, metrics: newMetrics } of nodeWithMetrics) {
      // Skip if same node
      if (fromNode === newItem) continue;

      // Calculate distances in each direction
      const distanceTop = canMoveTop
        ? getTopDistance({
            fromMetrics: metrics,
            toMetrics: newMetrics,
          })
        : null;

      const distanceBottom = canMoveBottom
        ? getBottomDistance({
            fromMetrics: metrics,
            toMetrics: newMetrics,
          })
        : null;

      const distanceLeft = canMoveLeft
        ? getLeftDistance({
            fromMetrics: metrics,
            toMetrics: newMetrics,
            preferCloserY: true, // Prefer same row for horizontal movement
          })
        : null;

      const distanceRight = canMoveRight
        ? getRightDistance({
            fromMetrics: metrics,
            toMetrics: newMetrics,
            preferCloserY: true, // Prefer same row for horizontal movement
          })
        : null;

      // Update neighbors if this is the closest node in each direction
      if (
        canMoveTop &&
        distanceTop !== null &&
        (minTopElementDist === undefined || minTopElementDist > distanceTop)
      ) {
        minTopElementDist = distanceTop;
        fromNode.setNeighborNode(newItem, 'top');
      }

      if (
        canMoveBottom &&
        distanceBottom !== null &&
        (minBottomElementDist === undefined ||
          minBottomElementDist > distanceBottom)
      ) {
        minBottomElementDist = distanceBottom;
        fromNode.setNeighborNode(newItem, 'bottom');
      }

      if (
        canMoveLeft &&
        distanceLeft !== null &&
        (minLeftElementDist === undefined || minLeftElementDist > distanceLeft)
      ) {
        minLeftElementDist = distanceLeft;
        fromNode.setNeighborNode(newItem, 'left');
      }

      if (
        canMoveRight &&
        distanceRight !== null &&
        (minRightElementDist === undefined ||
          minRightElementDist > distanceRight)
      ) {
        minRightElementDist = distanceRight;
        fromNode.setNeighborNode(newItem, 'right');
      }
    }

    // If no neighbors found with preferCloserY=true, try again with preferCloserY=false for horizontal directions
    const checkLeft = minLeftElementDist === undefined;
    const checkRight = minRightElementDist === undefined;
    if (checkLeft || checkRight) {
      for (const { node: newItem, metrics: newMetrics } of nodeWithMetrics) {
        if (fromNode === newItem) continue;

        if (checkLeft) {
          const distanceLeft = canMoveLeft
            ? getLeftDistance({
                fromMetrics: metrics,
                toMetrics: newMetrics,
                preferCloserY: false,
              })
            : null;

          if (
            canMoveLeft &&
            distanceLeft !== null &&
            (minLeftElementDist === undefined ||
              minLeftElementDist > distanceLeft)
          ) {
            minLeftElementDist = distanceLeft;
            fromNode.setNeighborNode(newItem, 'left');
          }
        }

        if (checkRight) {
          const distanceRight = canMoveRight
            ? getRightDistance({
                fromMetrics: metrics,
                toMetrics: newMetrics,
                preferCloserY: false,
              })
            : null;

          if (
            canMoveRight &&
            distanceRight !== null &&
            (minRightElementDist === undefined ||
              minRightElementDist > distanceRight)
          ) {
            minRightElementDist = distanceRight;
            fromNode.setNeighborNode(newItem, 'right');
          }
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
        event.preventDefault();
        if (this.currentlyFocusedNode) {
          this.currentlyFocusedNode.onEnter(event);
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
    parentFocusKey: string;
    focusKey: string;
  }) {
    return `pfk:${parentFocusKey}/fk:${focusKey}`;
  }
}
