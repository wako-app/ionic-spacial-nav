import { AfterViewInit, Component, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';

import { NgClass } from '@angular/common';
import { SpacialNavigationService } from './spacial-navigation.service';
import { SpacialParentFocusableDirective } from './spacial-parent-focusable.directive';

@Component({
  selector: 'wk-media-scroll-view',
  standalone: true,
  imports: [SpacialParentFocusableDirective, NgClass],
  template: `
    <div
      wkSnParentFocusable
      [snFocusKey]="parentFocusKey"
      snOrientation="horizontal"
      [snFocusFirstChild]="true"
      [ngClass]="{ 'bg-orange-400/50': isFocused }"
    >
      @if (title) {
        <h2 class="text-2xl font-bold mb-4">{{ title }}</h2>
      }
      <div #scrollContainer [class]="'flex flew-row gap-4 overflow-x-auto ' + class">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export default class MediaScrollViewComponent implements AfterViewInit {
  @Input({ required: true }) parentFocusKey!: string;
  @Input() title?: string;
  @Input() class = '';
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  @Input() isFocused = false;

  private spacialNavigationService = inject(SpacialNavigationService);

  ngAfterViewInit() {
    this.spacialNavigationService.spacialNavigation.addParentListener({
      parentFocusKey: this.parentFocusKey,
      event: 'childFocused',
      callback: (newNode) => this.onChildFocused(newNode),
    });
    this.spacialNavigationService.spacialNavigation.addParentListener({
      parentFocusKey: this.parentFocusKey,
      event: 'parentFocused',
      callback: () => {
        this.isFocused = true;
        if (this.scrollContainer?.nativeElement) {
          // Scroll to show title by getting parent element's position
          const parentElement = this.scrollContainer.nativeElement.parentElement;
          if (parentElement) {
            parentElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }
      },
    });
    this.spacialNavigationService.spacialNavigation.addParentListener({
      parentFocusKey: this.parentFocusKey,
      event: 'parentBlurred',
      callback: () => (this.isFocused = false),
    });
  }

  onChildFocused(newNode: HTMLElement) {
    const newNodeRect = newNode.getBoundingClientRect();

    const containerRect = this.scrollContainer.nativeElement.getBoundingClientRect();

    const scrollLeft = newNodeRect.left - containerRect.left + this.scrollContainer.nativeElement.scrollLeft;

    this.scrollContainer.nativeElement.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });

    setTimeout(() => {
      this.spacialNavigationService.spacialNavigation.resetCurrentFocusedNodeNeighbors();
    }, 1000);
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
