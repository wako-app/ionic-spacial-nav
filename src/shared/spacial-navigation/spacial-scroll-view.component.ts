import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';

import { getFocusableNodesByStatus } from './lib/spacial-node';
import { SpacialNavigationService } from './spacial-navigation.service';
import { SpacialFocusableDirective } from './spacial-focusable.directive';

@Component({
  selector: 'wk-spacial-scroll-view',
  standalone: true,
  imports: [SpacialFocusableDirective],
  template: `
    <div
      wkSnFocusable
      [snFocusKey]="parentFocusKey"
      snIsParent
      snOrientation="horizontal"
    >
      @if (title) {
      <h2 class="text-2xl font-bold mb-4">{{ title }}</h2>
      }
      <div
        #scrollContainer
        [class]="'sn-scroll-view flex flew-row gap-4 overflow-x-auto ' + class"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export default class SpacialScrollViewComponent implements AfterViewInit {
  @Input({ required: true }) parentFocusKey!: string;
  @Input() title?: string;
  @Input() class = '';
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private spacialNavigationService = inject(SpacialNavigationService);

  ngAfterViewInit() {
    // this.spacialNavigationService.spacialNavigation.addParentListener({
    //   parentFocusKey: this.parentFocusKey,
    //   event: 'childFocused',
    //   callback: (newNode) => this.onChildFocused(newNode),
    // });
  }

  onChildFocused(newNode: HTMLElement) {
    const newNodeRect = newNode.getBoundingClientRect();

    const containerRect =
      this.scrollContainer.nativeElement.getBoundingClientRect();

    const scrollLeft =
      newNodeRect.left -
      containerRect.left +
      this.scrollContainer.nativeElement.scrollLeft;

    this.scrollContainer.nativeElement.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
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
