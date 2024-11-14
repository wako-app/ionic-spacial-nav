import { calcDistance } from './calc-distance';
import { FocusableNode } from './focusable-node';
import { SpacialNavigation } from './spacial-navigation';
import { isNodeFocusable } from './spacial-node';

export const DBEUG_LINE_CLASSNAME = 'sn-debugger-line';
const DEBUG_LINE_SELECTOR = `.${DBEUG_LINE_CLASSNAME}`;

const MARKER_COLORS = [
  '#1abc9c',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#34495e',
  '#f1c40f',
  '#e67e22',
  '#e74c3c',
  '#ecf0f1',
  '#95a5a6',
];

export class VisualDebugger {
  private spacialNavigation: SpacialNavigation;
  private debugMode: boolean;

  constructor(spacial: SpacialNavigation | null) {
    if (!spacial) {
      console.error(
        `Unable to debug since the spacial controller is not defined.`
      );
    }
    this.spacialNavigation = spacial;
    this.debugMode = true;
  }

  setDebugMode(d: boolean) {
    this.debugMode = d;
    this.updateDisplay();
  }

  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.updateDisplay();
  }

  updateDisplay() {
    this.clearDisplay();

    if (!this.debugMode) {
      return;
    }

    const items = this.spacialNavigation.getFocusableNodes();
    for (let i = 0; i < items.length; i++) {
      const fi = items[i];
      // If the element can't be focused, skip it.
      if (!isNodeFocusable(fi.getElement())) {
        continue;
      }

      this.printDebugLinesForItem(i, fi);
    }
  }

  private clearDisplay = function () {
    document.querySelectorAll(DEBUG_LINE_SELECTOR).forEach((node) => {
      node.remove();
    });
  };

  private printDebugLinesForItem(index: number, focusableNode: FocusableNode) {
    const markerIndex = index % MARKER_COLORS.length;
    const markerColor = MARKER_COLORS[markerIndex];

    const currentItemMetrics = focusableNode.getMetrics();

    const topNeighbor = focusableNode.getNeighborNode('top');
    if (topNeighbor) {
      const topMetrics = topNeighbor.getMetrics();
      const xDist = topMetrics.center.x - currentItemMetrics.center.x;
      const yDist = currentItemMetrics.top - topMetrics.center.y;

      const angle = (Math.atan2(xDist, yDist) * 180) / Math.PI + 180;

      this.printDebugLine(
        calcDistance(xDist, yDist),
        currentItemMetrics.center.x - 5,
        currentItemMetrics.top,
        'red', // going up
        angle
      );
    }

    const bottomNeighbor = focusableNode.getNeighborNode('bottom');
    if (bottomNeighbor) {
      const bottomMetrics = bottomNeighbor.getMetrics();
      const xDist = currentItemMetrics.center.x - bottomMetrics.center.x;
      const yDist = bottomMetrics.center.y - currentItemMetrics.bottom;

      const angle = (Math.atan2(xDist, yDist) * 180) / Math.PI + 360;

      this.printDebugLine(
        calcDistance(xDist, yDist),
        currentItemMetrics.center.x + 5,
        currentItemMetrics.bottom,
        'purple', // going down
        angle
      );
    }

    const leftNeighbor = focusableNode.getNeighborNode('left');
    if (leftNeighbor) {
      const leftMetrics = leftNeighbor.getMetrics();

      const xDist = leftMetrics.center.x - currentItemMetrics.left;
      const yDist = currentItemMetrics.center.y - leftMetrics.center.y;

      const angle = (Math.atan2(xDist, yDist) * 180) / Math.PI + 180;

      this.printDebugLine(
        calcDistance(xDist, yDist),
        currentItemMetrics.left,
        currentItemMetrics.center.y + 5,
        'green', // going left
        angle
      );
    }

    const rightNeighbor = focusableNode.getNeighborNode('right');
    if (rightNeighbor) {
      const rightMetrics = rightNeighbor.getMetrics();
      const xDist = rightMetrics.center.x - currentItemMetrics.right;
      const yDist = currentItemMetrics.center.y - rightMetrics.center.y;

      const angle = (Math.atan2(xDist, yDist) * 180) / Math.PI + 180;

      this.printDebugLine(
        calcDistance(xDist, yDist),
        currentItemMetrics.right,
        currentItemMetrics.center.y - 5,
        'orange', // going right
        angle
      );
    }
  }

  private printDebugLine(
    length: number,
    startX: number,
    startY: number,
    color: string,
    angle: number
  ) {
    const lineElement = document.createElement('div');
    lineElement.classList.add(DBEUG_LINE_CLASSNAME);
    lineElement.classList.add('marker');
    lineElement.classList.add('start');
    lineElement.style.position = 'absolute';
    lineElement.style.width = 5 + 'px';
    lineElement.style.height = length + 'px';
    lineElement.style.left = startX + 'px';
    lineElement.style.top = startY + 'px';
    lineElement.style.backgroundColor = color;
    lineElement.style.transform = 'rotate(' + angle + 'deg)';
    lineElement.style.transformOrigin = '0% 0%';
    document.body.appendChild(lineElement);
  }
}
