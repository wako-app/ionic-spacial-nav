import { FocusableNode, Metrics, NeighborPosition } from './focusable-node';
import { isMyChildByFocusKey } from './spacial-node';

export function calcDistance(x: number, y: number): number {
  return Math.floor(Math.sqrt(x * x + y * y));
}

export function verticalDistance({
  fromMetrics,
  toMetrics,
  higher,
  lower,
}: {
  fromMetrics: Metrics;
  toMetrics: Metrics;
  higher: Metrics;
  lower: Metrics;
}) {
  const isToMetricsInsideFromMetrics =
    toMetrics.left >= fromMetrics.left &&
    toMetrics.right <= fromMetrics.right &&
    toMetrics.top >= fromMetrics.top &&
    toMetrics.bottom <= fromMetrics.bottom;

  if (!isToMetricsInsideFromMetrics && higher.bottom > lower.top) {
    return null;
  }

  const distances = [];

  // Calculate distances between corners
  // const isGoingUp = higher.bottom < lower.top;
  // const isToOnTheLeft = toMetrics.left < fromMetrics.left;

  // if (isGoingUp) {
  //   if (isToOnTheLeft) {
  //     const topLeftToBottomRight = calcDistance(
  //       Math.abs(fromMetrics.left - toMetrics.right),
  //       Math.abs(fromMetrics.top - toMetrics.bottom)
  //     );
  //     distances.push(topLeftToBottomRight);
  //   }

  //   if (!isToOnTheLeft) {
  //     const topRightToBottomLeft = calcDistance(
  //       Math.abs(fromMetrics.right - toMetrics.left),
  //       Math.abs(fromMetrics.top - toMetrics.bottom)
  //     );
  //     distances.push(topRightToBottomLeft);
  //   }
  // } else {
  //   if (isToOnTheLeft) {
  //     const bottomLeftToTopRight = calcDistance(
  //       Math.abs(fromMetrics.left - toMetrics.right),
  //       Math.abs(fromMetrics.bottom - toMetrics.top)
  //     );
  //     distances.push(bottomLeftToTopRight);
  //   }

  //   if (!isToOnTheLeft) {
  //     const bottomRightToTopLeft = calcDistance(
  //       Math.abs(fromMetrics.right - toMetrics.left),
  //       Math.abs(fromMetrics.bottom - toMetrics.top)
  //     );
  //     distances.push(bottomRightToTopLeft);
  //   }
  // }

  // Calculate distances between center
  const left = Math.abs(fromMetrics.center.x - toMetrics.left);
  const right = Math.abs(fromMetrics.center.x - toMetrics.right);

  const x = Math.min(
    Math.abs(fromMetrics.center.x - toMetrics.left),
    Math.abs(fromMetrics.center.x - toMetrics.center.x),
    Math.abs(fromMetrics.center.x - toMetrics.right),
  );
  const y = lower.center.y - higher.center.y;

  const angleLeft = Math.atan(y / left) * (180 / Math.PI);
  const angleRight = Math.atan(y / right) * (180 / Math.PI);
  // If the angle is too shallow it's not really up
  if (!(angleLeft >= 0 && angleRight <= 180)) {
    return null;
  }

  distances.push(calcDistance(x, y));

  return Math.min(...distances);
}

export function getTopDistance({ fromMetrics, toMetrics }: { fromMetrics: Metrics; toMetrics: Metrics }) {
  // Move Up
  return verticalDistance({
    fromMetrics,
    toMetrics,
    higher: toMetrics,
    lower: fromMetrics,
  });
}

export function getBottomDistance({ fromMetrics, toMetrics }: { fromMetrics: Metrics; toMetrics: Metrics }) {
  // Move Down
  return verticalDistance({
    fromMetrics,
    toMetrics,
    higher: fromMetrics,
    lower: toMetrics,
  });
}

export function horizontalDistance({
  fromMetrics,
  toMetrics,
  lefter,
  righter,
  preferCloserY,
}: {
  fromMetrics: Metrics;
  toMetrics: Metrics;
  lefter: Metrics;
  righter: Metrics;
  preferCloserY: boolean;
}) {
  if (lefter.right > righter.left) {
    return null;
  }

  const top = Math.abs(fromMetrics.center.y - toMetrics.top);
  const bottom = Math.abs(fromMetrics.center.y - toMetrics.bottom);

  const x = righter.center.x - lefter.center.x;
  const y = Math.min(
    Math.abs(fromMetrics.center.y - toMetrics.top),
    Math.abs(fromMetrics.center.y - toMetrics.center.y),
    Math.abs(fromMetrics.center.y - toMetrics.bottom),
  );

  // if the element is not comprise between the top and bottom of the other element skip it
  if (preferCloserY && Math.abs(fromMetrics.center.y - toMetrics.center.y) > 10) {
    return null;
  }

  let angleTop = Math.atan(x / top) * (180 / Math.PI);
  let angleBottom = Math.atan(x / bottom) * (180 / Math.PI);
  // If the angle is too shallow it's not really up
  if (!(angleTop >= 0 && angleBottom <= 180)) {
    return null;
  }

  return calcDistance(x, y);
}

export function getLeftDistance({
  fromMetrics,
  toMetrics,
  preferCloserY,
}: {
  fromMetrics: Metrics;
  toMetrics: Metrics;
  preferCloserY: boolean;
}) {
  // Move Left
  return horizontalDistance({
    fromMetrics,
    toMetrics,
    lefter: toMetrics,
    righter: fromMetrics,
    preferCloserY,
  });
}

export function getRightDistance({
  fromMetrics,
  toMetrics,
  preferCloserY,
}: {
  fromMetrics: Metrics;
  toMetrics: Metrics;
  preferCloserY: boolean;
}) {
  // Move Right
  return horizontalDistance({
    fromMetrics,
    toMetrics,
    lefter: fromMetrics,
    righter: toMetrics,
    preferCloserY,
  });
}

export function getElementMetrics(element: HTMLElement): Metrics {
  const clientRect = element.getBoundingClientRect();
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

export function setNeighbors({
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
  const fromFocusKey = fromNode.getFocusKey();
  const fromMetrics = fromNode.getMetrics();

  const fromParentNode = fromNode.getParentNode();
  if (!fromParentNode) {
    return;
  }
  const fromParentMetrics = getElementMetrics(fromParentNode);

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
    // // For top/bottom directions, first find nodes with minimum Y distance
    // const topNodes = nodeWithMetrics.filter(({ metrics }) => metrics.center.y < fromMetrics.center.y);
    // const bottomNodes = nodeWithMetrics.filter(({ metrics }) => metrics.center.y > fromMetrics.center.y);

    // let minTopY = Infinity;
    // let minBottomY = Infinity;

    // // Find minimum Y distances
    // for (const { metrics } of topNodes) {
    //   const yDist = fromMetrics.center.y - metrics.center.y;
    //   minTopY = Math.min(minTopY, yDist);
    // }

    // for (const { metrics } of bottomNodes) {
    //   const yDist = metrics.center.y - fromMetrics.center.y;
    //   minBottomY = Math.min(minBottomY, yDist);
    // }

    // // Filter to only include nodes at minimum Y distance
    // candidateNodeByDirection.top = topNodes.filter(
    //   ({ metrics }) => Math.abs(fromMetrics.center.y - metrics.center.y - minTopY) < 1,
    // );

    // candidateNodeByDirection.bottom = bottomNodes.filter(
    //   ({ metrics }) => Math.abs(metrics.center.y - fromMetrics.center.y - minBottomY) < 1,
    // );

    candidateNodeByDirection.top = nodeWithMetrics;
    candidateNodeByDirection.bottom = nodeWithMetrics;
    candidateNodeByDirection.left = nodeWithMetrics;
    candidateNodeByDirection.right = nodeWithMetrics;
  } else {
    // Get parent nodes metrics
    const neighborParentNodes = new Map<string, { neighborParentNode: HTMLElement; neighborParenMetrics: Metrics }>();
    for (const { node } of nodeWithMetrics) {
      const neighborParentFocusKey = node.getParentFocusKey();
      if (!neighborParentFocusKey || neighborParentNodes.has(neighborParentFocusKey)) continue;

      const neighborParentNode = node.getParentNode();
      if (!neighborParentNode) {
        continue;
      }
      const neighborParenMetrics = getElementMetrics(neighborParentNode);

      neighborParentNodes.set(neighborParentFocusKey, {
        neighborParentNode,
        neighborParenMetrics,
      });
    }

    // Filter nodes based on parent position relative to current node
    for (const [neighborParentFocusKey, { neighborParenMetrics, neighborParentNode }] of neighborParentNodes) {
      const isParentAbove = neighborParenMetrics.bottom <= fromParentMetrics.top;
      const isParentBelow = neighborParenMetrics.top >= fromParentMetrics.bottom;
      const isParentLeft = neighborParenMetrics.right <= fromParentMetrics.left;
      const isParentRight = neighborParenMetrics.left >= fromParentMetrics.right;

      const isNeighborParentNodeMyParent =
        fromFocusKey && isMyChildByFocusKey({ parentNode: neighborParentNode, focusKey: fromFocusKey });
      const isNeighborParentNodeMyChild =
        neighborParentFocusKey && isMyChildByFocusKey({ parentNode: fromParentNode, focusKey: neighborParentFocusKey });

      const nodesWithMetricsInParent = nodeWithMetrics.filter(
        ({ node }) => node.getParentFocusKey() === neighborParentFocusKey,
      );
      if (isNeighborParentNodeMyParent || isNeighborParentNodeMyChild || isParentAbove) {
        candidateNodeByDirection.top.push(...nodesWithMetricsInParent);
      }
      if (isNeighborParentNodeMyParent || isNeighborParentNodeMyChild || isParentBelow) {
        candidateNodeByDirection.bottom.push(...nodesWithMetricsInParent);
      }
      if (isNeighborParentNodeMyParent || isNeighborParentNodeMyChild || isParentLeft) {
        candidateNodeByDirection.left.push(...nodesWithMetricsInParent);
      }
      if (isNeighborParentNodeMyParent || isNeighborParentNodeMyChild || isParentRight) {
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

    for (const { node: newItem, metrics: newMetrics } of candidateNodeByDirection[direction]) {
      // If nodes are in different parents, use parent metrics for distance calculation

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
      if (distance !== null && (minElementDist === undefined || minElementDist > distance)) {
        minElementDist = distance;
        fromNode.setNeighborNode(newItem, direction);
      }
    }

    // If we are in the same parent or we have a min distance, we don't need to check other nodes in this direction
    if (nodesAreInSameParent || minElementDist !== undefined || direction === 'top' || direction === 'bottom') {
      continue;
    }

    for (const { node: newItem, metrics: newMetrics } of candidateNodeByDirection[direction]) {
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
      if (distance !== null && (minElementDist === undefined || minElementDist > distance)) {
        minElementDist = distance;
        fromNode.setNeighborNode(newItem, direction);
      }
    }
  }
}
