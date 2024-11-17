import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { SpacialNavigationService } from './spacial-navigation.service';

import { FocusableNode } from './lib/focusable-node';
import { FOCUSABLE_ROOT_PARENT } from './lib/spacial-node';

@Directive({
  selector: '[wkSnFocusable]',
  standalone: true,
})
export class SpacialFocusableDirective implements AfterViewInit, OnDestroy {
  @Input() snParentFocusKey: string = FOCUSABLE_ROOT_PARENT;
  @Input() snFocusKey?: string;
  @Input() snPreventScrollOnFocus = false;
  @Input() snFocusMeOnEnter = false;

  @Output() snFocus = new EventEmitter<ElementRef>();
  @Output() snClick = new EventEmitter<ElementRef>();
  @Output() snBlur = new EventEmitter<ElementRef>();

  private spacialNavigationService = inject(SpacialNavigationService);
  private element = inject(ElementRef);
  private focusableNode: FocusableNode | null = null;

  ngAfterViewInit() {
    this.element.nativeElement.setAttribute('wkSnFocusableByDirective', '');
    // Parent are added to the DOM after children
    this.focusableNode = this.spacialNavigationService.spacialNavigation.registerNode({
      node: this.element.nativeElement,
      origin: 'wkSnFocusable',
      focusKey: this.snFocusKey,
      parentFocusKey: this.snParentFocusKey,
      preventScrollOnFocus: this.snPreventScrollOnFocus,
      focusNode: this.snFocusMeOnEnter,
    });

    if (this.focusableNode) {
      this.focusableNode.onClick(() => {
        this.snClick.emit(this.element);
      });
      this.focusableNode.onBlur(() => {
        this.snBlur.emit(this.element);
      });
      this.focusableNode.onFocus(() => {
        this.snFocus.emit(this.element);
      });
    }
  }

  ngOnDestroy() {
    if (this.focusableNode) {
      const focusKey = this.focusableNode.getFocusKey();
      if (focusKey) {
        this.spacialNavigationService.spacialNavigation.unregisterNode({
          focusKey,
        });
      }
    }
    // Remove listeners
    this.snBlur.unsubscribe();
    this.snFocus.unsubscribe();
    this.snClick.unsubscribe();
  }
}
