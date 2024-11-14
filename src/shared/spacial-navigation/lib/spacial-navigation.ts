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
  getFocusableNodesByStatus,
  getNodeFocusKey,
  isNodeFocusable,
  isNodeIsParent,
  setFocusableStatus,
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

  visualDebugger: VisualDebugger | undefined;

  get currentFocusableFocusKey(): string | undefined {
    return this.currentlyFocusedNode?.getFocusKey();
  }

  onFocused: ({
    newItem,
    oldItem,
  }: {
    newItem: FocusableNode;
    oldItem?: FocusableNode;
  }) => void = () => {};

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

      setTimeout(() => {
        // this.focusByFocusKey('BTN_0');
      }, 1000);
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

    // Set up binding to listen for key presses
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    this.enabled = true;

    this.log('enable', 'done');
  }

  registerParentNode({
    node,
    focusKey,
    orientation,
    saveLastFocusedChild = false, // only used for parent nodes
  }: {
    node: HTMLElement;
    focusKey?: string;
    saveLastFocusedChild?: boolean;
    orientation?: FocusableOrientation;
  }) {
    const originText = origin ? ` - ${origin}` : '';

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

    this.log(
      'registerParentNode',
      `prepared ${focusKeyAttribute}${originText}`,
      node
    );

    return focusKeyAttribute;
  }

  registerNode({
    node,
    origin,
    focusKey,
    parentFocusKey,
  }: {
    node: HTMLElement;
    origin?: string;
    focusKey?: string;
    parentFocusKey: string;
  }) {
    const originText = origin ? ` - ${origin}` : '';
    if (!isNodeFocusable(node)) {
      this.log('prepareNode', `not focusable${originText}`, node);
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

    node.setAttribute('tabindex', '0');

    // node.addEventListener('keyup', (e: KeyboardEvent) => {
    //   if (e.key === 'Enter') {
    //     node.click();
    //   }
    // });

    this.log(
      'registerNode',
      `prepared ${focusKeyAttribute}${originText}`,
      node
    );

    this.addFocusableNode(node);

    return focusKeyAttribute;
  }

  private addFocusableNode(node: HTMLElement) {
    const fi = new FocusableNode(node, this.debug);
    this.focusableNodes.push(fi);
    setFocusableStatus(node, 'active');

    if (this.currentlyFocusedNode === null) {
      this.currentlyFocusedNode = fi;
    }

    this.focusByFocusKey(this.currentlyFocusedNode.getFocusKey());
  }

  getFocusableNodes(): FocusableNode[] {
    return this.focusableNodes;
  }

  getFocusableNodeByFocusKey(focusKey: string) {
    return (
      this.focusableNodes.find((fi) => fi.getFocusKey() === focusKey) || null
    );
  }

  focus(node: HTMLElement) {
    const focusKey = getNodeFocusKey(node);
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

  private timer: number | null = null;
  focusByFocusKey(focusKey: string) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      const fi = this.getFocusableNodeByFocusKey(focusKey);
      if (!fi) {
        this.focusFirstItem();
        return;
      }

      const oldItem = this.currentlyFocusedNode;

      if (oldItem) {
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

      this.onFocused({ newItem: this.currentlyFocusedNode, oldItem });

      this.setNeighbors(this.currentlyFocusedNode);

      this.saveLastFocusedChild({
        parentFocusKey: this.currentlyFocusedNode.getParentFocusKey(),
        node: this.currentlyFocusedNode,
      });

      this.visualDebugger?.updateDisplay();
    }, 1);
  }

  focusFirstItem() {
    if (this.focusableNodes.length > 0) {
      const firstItem = this.focusableNodes[0];
      this.focusByFocusKey(firstItem.getFocusKey());
    }
  }

  moveFocus(direction: NeighborPosition) {
    this.log('moveFocus', `direction: ${direction}`);
    // We need an item to move down from
    if (!this.currentlyFocusedNode) {
      if (this.focusableNodes.length > 0) {
        this.log('moveFocus', 'no currently focused item, going to first item');
        this.focusFirstItem();
      }
      this.log('moveFocus', 'no focusable nodes, doing nothing');
      return;
    }

    let nextNodeToFocus: FocusableNode | null = null;

    nextNodeToFocus = this.currentlyFocusedNode.getNeighborNode(direction);

    if (
      nextNodeToFocus &&
      nextNodeToFocus.getFocusKey() === this.currentlyFocusedNode.getFocusKey()
    ) {
      this.log('moveFocus', `already focused on ${nextNodeToFocus}`);
      return;
    }

    this.log('moveFocus', `nextFocusKey: ${nextNodeToFocus}`);

    if (nextNodeToFocus !== null) {
      this.log(
        'moveFocus',
        `going to ${nextNodeToFocus}`,
        nextNodeToFocus?.getElement()
      );
      this.focusByFocusKey(nextNodeToFocus.getFocusKey());
    }
  }

  private _setNeighbors({
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
      if (canMoveRight) {
        console.log(
          'RIGHT PREFER SAME ROW',
          newItem.getElement(),
          getRightDistance({
            fromMetrics: metrics,
            toMetrics: newMetrics,
            preferCloserY: true, // Prefer same row for horizontal movement
          })
        );
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

          if (canMoveRight) {
            console.log(
              'RIGHT V2',
              newItem.getElement(),
              getRightDistance({
                fromMetrics: metrics,
                toMetrics: newMetrics,
                preferCloserY: false,
              })
            );
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
      }
    }
  }

  private setNeighbors(fi: FocusableNode) {
    const orientation = fi.getOrientation();
    const parentFocusKey = fi.getParentFocusKey();

    let canMoveTop = !orientation || orientation === 'vertical';
    let canMoveBottom = !orientation || orientation === 'vertical';
    let canMoveLeft = !orientation || orientation === 'horizontal';
    let canMoveRight = !orientation || orientation === 'horizontal';

    // First we find the closest node in the same parent
    const nodesInSameParent = this.focusableNodes.filter(
      (node) =>
        node.getParentFocusKey() === parentFocusKey &&
        node.getFocusKey() !== fi.getFocusKey()
    );

    this._setNeighbors({
      fromNode: fi,
      neighborNodes: nodesInSameParent,
      canMoveTop,
      canMoveBottom,
      canMoveLeft,
      canMoveRight,
    });

    // Secondly we find the closest node outside the parent
    const nodesOutsideParent = this.focusableNodes.filter(
      (node) =>
        node.getParentFocusKey() !== parentFocusKey &&
        node.getFocusKey() !== fi.getFocusKey() &&
        !isNodeIsParent(node.getElement()) &&
        isNodeFocusable(node.getElement())
    );
    // We can go to all directions if we don't have a neighbor in that direction already
    canMoveTop = fi.getNeighborNode('top') === null;
    canMoveBottom = fi.getNeighborNode('bottom') === null;
    canMoveLeft = fi.getNeighborNode('left') === null;
    canMoveRight = fi.getNeighborNode('right') === null;

    this._setNeighbors({
      fromNode: fi,
      neighborNodes: nodesOutsideParent,
      canMoveTop,
      canMoveBottom,
      canMoveLeft,
      canMoveRight,
    });

    const positions: NeighborPosition[] = ['top', 'bottom', 'left', 'right'];
    // For neighbors outside the parent, check if there's a last focused node for that parent
    for (const position of positions) {
      const neighbor = fi.getNeighborNode(position);
      if (neighbor && neighbor.getParentFocusKey() !== parentFocusKey) {
        const lastFocusedInParent = this.lastFocusNodeByParentFocusKey.get(
          neighbor.getParentFocusKey()
        );
        if (lastFocusedInParent) {
          this.log(
            'updateNeighbors',
            `Change neighbor for direction ${position} for ${fi.getFocusKey()}`,
            `Previous neighbor: ${neighbor.getFocusKey()}`,
            `New neighbor: ${lastFocusedInParent.getFocusKey()}`
          );
          //fi.setNeighborNode(lastFocusedInParent, position);
        }
      }
    }

    this.log(
      'updateNeighbors',
      fi.getFocusKey(),
      'orientation',
      orientation,
      'updated',
      fi
    );
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
          DEBUG_FN_COLORS[this.logIndex % DEBUG_FN_COLORS.length]
        }; color: black; padding: 1px 5px;`,
        'background: #333; color: #BADA55; padding: 1px 5px;',
        ...rest
      );
    }
  }
}
