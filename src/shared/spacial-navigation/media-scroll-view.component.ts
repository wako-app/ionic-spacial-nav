import { Component, Input } from '@angular/core';

import SpacialScrollViewComponent from './spacial-scroll-view.component';

@Component({
  selector: 'wk-media-scroll-view',
  standalone: true,
  imports: [SpacialScrollViewComponent],
  template: `
    <wk-spacial-scroll-view [horizontal]="true" class="py-8" [title]="title">
      <ng-content></ng-content>
    </wk-spacial-scroll-view>
  `,
})
export default class MediaScrollViewComponent {
  @Input() title?: string;
}
