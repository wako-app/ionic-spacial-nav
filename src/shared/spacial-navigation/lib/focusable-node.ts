import { Point } from './point';
import {
  getNodeByFocusKey,
  getNodeFocusKey,
  getNodeOrientation,
  getNodeParentFocusKey,
} from './spacial-node';

export type NeighborPosition = 'top' | 'bottom' | 'left' | 'right';

export class FocusableNode {
  private element: HTMLElement;

  private neighbors: Neighbors = {
    top: null,
    bottom: null,
    left: null,
    right: null,
    topEl: null,
    bottomEl: null,
    leftEl: null,
    rightEl: null,
  };

  private focusListeners: (() => void)[] = [];
  private blurListeners: (() => void)[] = [];
  private clickListeners: (() => void)[] = [];
  constructor(ele: HTMLElement) {
    this.element = ele;

    this.resetNeighbors();
  }

  getElement() {
    return this.element;
  }

  getFocusKey() {
    const focusKey = getNodeFocusKey(this.element);
    if (!focusKey) {
      throw new Error(`Node ${this.element.outerHTML} has no focus key`);
    }
    return focusKey;
  }

  getOrientation() {
    // Orientation is set on the parent node, so we need to get it from the parent node
    const parentNode = this.getParentNode();
    if (!parentNode) {
      throw new Error(`Node ${this.getFocusKey()} has no parent node`);
    }
    return getNodeOrientation(parentNode);
  }

  getParentFocusKey() {
    const focusKey = getNodeParentFocusKey(this.element);
    if (!focusKey) {
      throw new Error(`Node ${this.getFocusKey()} has no parent focus key`);
    }
    return focusKey;
  }

  getParentNode() {
    const parentNode = getNodeByFocusKey(this.getParentFocusKey());
    if (!parentNode) {
      throw new Error(`Node ${this.getFocusKey()} has no parent node`);
    }
    return parentNode;
  }

  resetNeighbors() {
    this.neighbors = {
      top: null,
      bottom: null,
      left: null,
      right: null,
      topEl: null,
      bottomEl: null,
      leftEl: null,
      rightEl: null,
    };
  }

  setNeighborNode(neighborNode: FocusableNode, position: NeighborPosition) {
    this.neighbors[`${position}El`] = neighborNode;
    this.neighbors[position] = neighborNode.getFocusKey();
  }

  getNeighborNode(position: NeighborPosition) {
    return this.neighbors[`${position}El`];
  }

  getMetrics(): Metrics {
    const clientRect = this.element.getBoundingClientRect();
    return {
      width: clientRect.width,
      height: clientRect.height,
      left: clientRect.left,
      right: clientRect.left + clientRect.width,
      top: clientRect.top,
      bottom: clientRect.top + clientRect.height,
      center: {
        x: clientRect.left + clientRect.width / 2,
        y: clientRect.top + clientRect.height / 2,
      },
    };
  }

  focus() {
    this.element.focus({ preventScroll: true });
  }

  blur() {
    this.element.blur();
  }

  click() {
    this.element.click();
  }

  onClick(callback: () => void) {
    this.clickListeners.push(callback);
    this.element.addEventListener('click', callback);
  }

  onFocus(callback: () => void) {
    this.focusListeners.push(callback);
    this.element.addEventListener('focus', callback);
  }

  onBlur(callback: () => void) {
    this.blurListeners.push(callback);
    this.element.addEventListener('blur', callback);
  }

  removeListeners() {
    this.focusListeners.forEach((c) => {
      this.element.removeEventListener('focus', c);
    });
    this.blurListeners.forEach((c) => {
      this.element.removeEventListener('blur', c);
    });
    this.clickListeners.forEach((c) => {
      this.element.removeEventListener('click', c);
    });
  }
}

export interface Neighbors {
  top?: string | null;
  bottom: string | null;
  left: string | null;
  right: string | null;
  topEl: FocusableNode | null;
  bottomEl: FocusableNode | null;
  leftEl: FocusableNode | null;
  rightEl: FocusableNode | null;
}

export interface Metrics {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  center: Point;
}
