import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { SpacialNavigationService } from './spacial-navigation.service';

import { FocusableOrientation, ROOT_FOCUS_KEY } from './lib/spacial-node';
import { FocusableNode } from './lib/focusable-node';

@Directive({
  selector: '[wkSnFocusable]',
  standalone: true,
})
export class SpacialFocusableDirective implements AfterViewInit, OnDestroy {
  //* If true, the element will be focused when the page is entered
  @Input() snParentFocusKey: string = ROOT_FOCUS_KEY;
  @Input() snFocusKey?: string;
  @Input() snIsParent?: any = undefined;
  @Input() snOrientation?: FocusableOrientation;

  @Input() focusMeOnPageEnter = false;
  @Output() snFocus = new EventEmitter<ElementRef>();
  @Output() snClick = new EventEmitter<ElementRef>();
  @Output() snBlur = new EventEmitter<ElementRef>();

  private spacialNavigationService = inject(SpacialNavigationService);
  private element = inject(ElementRef);
  private focusableNode: FocusableNode | null = null;

  ngAfterViewInit() {
    if (this.snIsParent !== undefined) {
      this.spacialNavigationService.spacialNavigation.registerParentNode({
        node: this.element.nativeElement,
        focusKey: this.snFocusKey,
        orientation: this.snOrientation,
        saveLastFocusedChild: true,
      });
    } else {
      // Parent are added to the DOM after children
      setTimeout(() => {
        this.focusableNode =
          this.spacialNavigationService.spacialNavigation.registerNode({
            node: this.element.nativeElement,
            origin: 'wkSnFocusable',
            focusKey: this.snFocusKey,
            parentFocusKey: this.snParentFocusKey,
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
      }, 100);
    }

    // this.spacialNavigationService.debounceUpdate();

    // // TODO REFACTOR
    // if (this.focusMeOnPageEnter) {
    //   setTimeout(() => {
    //     this.spacialNavigationService.spacialNavigation.focus(
    //       this.element.nativeElement
    //     );
    //   }, 300);
    // }
  }

  ngOnDestroy() {
    if (this.focusableNode) {
      this.spacialNavigationService.spacialNavigation.unregisterNode({
        focusKey: this.focusableNode.getFocusKey(),
      });
    }
    // Remove listeners
    this.snBlur.unsubscribe();
    this.snFocus.unsubscribe();
    this.snClick.unsubscribe();
  }
}
