import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  inject,
} from '@angular/core';
import { SpacialNavigationService } from './spacial-navigation.service';

import { FocusableOrientation } from './lib/spacial-node';

@Directive({
  selector: '[wkSnParentFocusable]',
  standalone: true,
})
export class SpacialParentFocusableDirective implements AfterViewInit {
  @Input({ required: true }) snFocusKey!: string;
  @Input() snOrientation?: FocusableOrientation;
  @Input() snPreventScrollOnFocus = false;
  @Input() snFocusFirstChild = false;

  private spacialNavigationService = inject(SpacialNavigationService);
  private element = inject(ElementRef);

  ngAfterViewInit() {
    this.spacialNavigationService.spacialNavigation.registerParentNode({
      node: this.element.nativeElement,
      focusKey: this.snFocusKey,
      orientation: this.snOrientation,
      saveLastFocusedChild: true,
      focusFirstChild: this.snFocusFirstChild,
    });
  }
}
