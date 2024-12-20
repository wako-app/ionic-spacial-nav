export const FOCUSABLE_ROOT_PARENT = 'SN_ROOT';

export const FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY = 'sn-focuskey';

export const FOCUSABLE_ITEM_ATTRIBUTE_FOCUSED = 'sn-focused';
export const FOCUSABLE_ITEM_ATTRIBUTE_PARENT_FOCUS_KEY = 'sn-parent-focuskey';
export const FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT = 'sn-is-parent';
export const FOCUSABLE_ITEM_ATTRIBUTE_ORIENTATION = 'sn-orientation';
export const FOCUSABLE_ITEM_ATTRIBUTE_CONSTRAINT_TO_PARENT = 'sn-constraint-to-parent';
export const FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_FIRST_CHILD = 'sn-focus-first-child';
export const FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE = 'sn-focusable';
export const FOCUSABLE_ITEM_ATTRIBUTE_PREVENT_SCROLL_ON_CHILD_FOCUS = 'sn-prevent-scroll-on-child-focus';

const allSnAttributes = [
  FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY,
  FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE,
  FOCUSABLE_ITEM_ATTRIBUTE_FOCUSED,
  FOCUSABLE_ITEM_ATTRIBUTE_PARENT_FOCUS_KEY,
  FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT,
  FOCUSABLE_ITEM_ATTRIBUTE_ORIENTATION,
  FOCUSABLE_ITEM_ATTRIBUTE_CONSTRAINT_TO_PARENT,
  FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_FIRST_CHILD,
  FOCUSABLE_ITEM_ATTRIBUTE_PREVENT_SCROLL_ON_CHILD_FOCUS,
];

export type FocusableStatus = 'pending' | 'active' | 'disabled';
export type FocusableOrientation = 'horizontal' | 'vertical';

export function getFocusableNodesBySelector({
  selector,
  parent = document.body,
}: {
  selector: string;
  parent?: HTMLElement;
}) {
  const nodes: Array<HTMLElement> = [];
  parent.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    nodes.push(node);
  });
  return nodes;
}

export function getFocusableNodesByStatus({ status, parent }: { status: FocusableStatus; parent?: HTMLElement }) {
  return getFocusableNodesBySelector({
    selector: `[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}="${status}"]`,
    parent,
  });
}

export function getNodeStatus(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE) as FocusableStatus;
}

export function getNodeOrientation(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_ORIENTATION);
}

export function setNodeOrientation(node: HTMLElement, orientation: FocusableOrientation) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_ORIENTATION, orientation);
}

export function setNodeConstraintToParent(node: HTMLElement) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_CONSTRAINT_TO_PARENT, 'true');
}

export function isNodeConstraintToParent(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_CONSTRAINT_TO_PARENT) === 'true';
}

export function setNodeParentFocusKey(node: HTMLElement, parentFocusKey: string) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_PARENT_FOCUS_KEY, parentFocusKey);
}

export function getNodeParentFocusKey(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_PARENT_FOCUS_KEY);
}

export function setNodeIsParent(node: HTMLElement) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT, 'true');
}

export function isNodeIsParent(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT) === 'true';
}

export function setNodeFocusKey(node: HTMLElement, focusKey: string) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY, focusKey);
}
export function getNodeFocusKey(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY);
}

export function getNodeByFocusKey(focusKey: string) {
  return document.querySelector<HTMLElement>(`[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY}="${focusKey}"]`);
}

export function setNodeFocused(node: HTMLElement, focused: boolean) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_FOCUSED, focused ? 'true' : 'false');
}

export function getNodeFocused(parent?: HTMLElement) {
  return (parent ?? document).querySelector<HTMLElement>(`[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSED}="true"]`);
}

export function setFocusableStatus(node: HTMLElement, status: FocusableStatus) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE, status);
}

export function isNodeFocusable(node: HTMLElement) {
  if (node.style.display === 'none' || node.style.visibility === 'hidden') {
    return false;
  }

  return true;
}

export function removeAllSnAttributes(node: HTMLElement) {
  allSnAttributes.forEach((attribute) => {
    node.removeAttribute(attribute);
  });
}

export function setNodeFocusFirstChild(node: HTMLElement) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_FIRST_CHILD, 'true');
}

export function isNodeFocusFirstChild(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_FIRST_CHILD) === 'true';
}

export function isMyChildByFocusKey({ parentNode, focusKey }: { parentNode: HTMLElement; focusKey: string }) {
  return parentNode.querySelector(`[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY}="${focusKey}"]`) !== null;
}

export function setNodePreventScrollOnChildFocus(node: HTMLElement) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_PREVENT_SCROLL_ON_CHILD_FOCUS, 'true');
}

export function isNodePreventScrollOnChildFocus(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_PREVENT_SCROLL_ON_CHILD_FOCUS) === 'true';
}
