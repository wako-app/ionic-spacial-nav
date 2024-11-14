import { Component, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';

import { getFocusableNodesByStatus } from './lib/spacial-node';
import { SpacialNavigationService } from './spacial-navigation.service';

@Component({
  selector: 'wk-spacial-scroll-view',
  standalone: true,
  template: `
    @if (title) {
      <h2 class="text-2xl font-bold mb-4">{{ title }}</h2>
    }
    <div
      id="scroll-container"
      #scrollContainer
      [class]="'sn-scroll-view flex flew-row gap-4 ' + class"
      [class.overflow-x-auto]="horizontal"
      [class.overflow-y-auto]="!horizontal"
    >
      <ng-content></ng-content>
    </div>
  `,
})
export default class SpacialScrollViewComponent {
  @Input() title?: string;
  @Input() horizontal = true;
  @Input() class = '';
  @ViewChild('scrollContainer') scrollContainer: ElementRef;

  private elementRef = inject(ElementRef);

  private latestFocusedElement: HTMLElement | null = null;

  constructor(private spacialNavigationService: SpacialNavigationService) {
    this.spacialNavigationService.onFocused.subscribe(({ newItem, oldItem }) => {
      if (newItem.getElement() === this.latestFocusedElement) {
        this.elementRef.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        return;
      }

      const oldFocusedElement = oldItem?.getElement();
      const focusedElement = newItem.getElement();

      if (this.scrollContainer?.nativeElement.contains(focusedElement)) {
        // Enter back to this list, select the last focused element
        if (oldFocusedElement && !this.scrollContainer?.nativeElement.contains(oldFocusedElement)) {
          let changeFocusTo = this.latestFocusedElement;
          if (!this.latestFocusedElement) {
            // Get the first focusable child
            const firstFocusableChild = getFocusableNodesByStatus({
              status: 'active',
              parent: this.scrollContainer.nativeElement,
            })[0];

            if (firstFocusableChild) {
              changeFocusTo = firstFocusableChild;
            }
          }
          if (changeFocusTo) {
            this.spacialNavigationService.spacialNavigation.focus(changeFocusTo);
            return;
          }
        }

        this.latestFocusedElement = focusedElement;

        this.onChildFocused(focusedElement);
      }
    });
  }

  onChildFocused(newNode: HTMLElement) {
    const newNodeRect = newNode.getBoundingClientRect();

    const containerRect = this.scrollContainer.nativeElement.getBoundingClientRect();

    if (this.horizontal) {
      const scrollLeft = newNodeRect.left - containerRect.left + this.scrollContainer.nativeElement.scrollLeft;

      this.scrollContainer.nativeElement.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    } else {
      const scrollTop = newNodeRect.top - containerRect.top + this.scrollContainer.nativeElement.scrollTop;

      this.scrollContainer.nativeElement.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
      console.log('onChildFocused', 'Going up', scrollTop);
    }

    // const elementRect = element.getBoundingClientRect();
    // const containerRect = this.scrollContainer.nativeElement.getBoundingClientRect();

    // const scrollLeft =
    //   elementRect.left -
    //   containerRect.left +
    //   this.scrollContainer.nativeElement.scrollLeft -
    //   (containerRect.width - elementRect.width) / 2;

    // this.scrollContainer.nativeElement.scrollTo({
    //   left: scrollLeft,
    //   behavior: 'smooth',
    // });
  }

  @HostListener('keydown.backspace', ['$event'])
  onBackspace(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }
  }
}
