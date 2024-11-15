import { Metrics } from './focusable-node';

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
  if (higher.bottom > lower.top) {
    return null;
  }

  const isGoingUp = higher.bottom < lower.top;
  const isToOnTheLeft = toMetrics.left < fromMetrics.left;

  const distances = [];

  // Calculate distances between corners

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
    Math.abs(fromMetrics.center.x - toMetrics.right)
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

export function getTopDistance({
  fromMetrics,
  toMetrics,
}: {
  fromMetrics: Metrics;
  toMetrics: Metrics;
}) {
  // Move Up
  return verticalDistance({
    fromMetrics,
    toMetrics,
    higher: toMetrics,
    lower: fromMetrics,
  });
}

export function getBottomDistance({
  fromMetrics,
  toMetrics,
}: {
  fromMetrics: Metrics;
  toMetrics: Metrics;
}) {
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
    Math.abs(fromMetrics.center.y - toMetrics.bottom)
  );

  // if the element is not comprise between the top and bottom of the other element skip it
  if (
    preferCloserY &&
    Math.abs(fromMetrics.center.y - toMetrics.center.y) > 10
  ) {
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
