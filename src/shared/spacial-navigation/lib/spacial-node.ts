export const ROOT_FOCUS_KEY = 'sn:root';
export const FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY = 'sn-focuskey';
export const FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE = 'sn-focusable';
export const FOCUSABLE_ITEM_ATTRIBUTE_FOCUSED = 'sn-focused';
export const FOCUSABLE_ITEM_ATTRIBUTE_PARENT_FOCUS_KEY = 'sn-parent-focuskey';
export const FOCUSABLE_ITEM_ATTRIBUTE_IS_PARENT = 'sn-is-parent';
export const FOCUSABLE_ITEM_ATTRIBUTE_ORIENTATION = 'sn-orientation';

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

export function getFocusableNodesByStatus({
  status,
  parent,
}: {
  status: FocusableStatus;
  parent?: HTMLElement;
}) {
  return getFocusableNodesBySelector({
    selector: `[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUSABLE}="${status}"]`,
    parent,
  });
}

export function getNodeOrientation(node: HTMLElement) {
  return node.getAttribute(FOCUSABLE_ITEM_ATTRIBUTE_ORIENTATION);
}

export function setNodeOrientation(
  node: HTMLElement,
  orientation: FocusableOrientation
) {
  node.setAttribute(FOCUSABLE_ITEM_ATTRIBUTE_ORIENTATION, orientation);
}

export function setNodeParentFocusKey(
  node: HTMLElement,
  parentFocusKey: string
) {
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
  return document.querySelector(
    `[${FOCUSABLE_ITEM_ATTRIBUTE_FOCUS_KEY}="${focusKey}"]`
  );
}

export function setNodeFocused(node: HTMLElement, focused: boolean) {
  node.setAttribute(
    FOCUSABLE_ITEM_ATTRIBUTE_FOCUSED,
    focused ? 'true' : 'false'
  );
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

export function setAllNodesDisabled(parent?: HTMLElement) {
  getFocusableNodesByStatus({ status: 'active', parent }).forEach((node) => {
    setFocusableStatus(node, 'disabled');
  });
}