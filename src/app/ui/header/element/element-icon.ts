import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Element, ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-element-icon',
  templateUrl: './element-icon.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./element-icon.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementIconComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);

  readonly inputElement = input<ElementModel>(undefined, { alias: 'element' });

  readonly type = input<string>();
  element: ElementModel | undefined;
  ElementState = ElementState;
  svg: SafeHtml = '';

  ngOnInit(): void {
    this.element = this.inputElement();
    const type = this.type();
    if (type && !this.element) {
      this.element = new ElementModel(type as Element);
      this.element.state = ElementState.strong;
    }

    if (!!this.element) {
      fetch('./assets/images/element/' + this.element.type + '.svg')
        .then((response) => {
          return response.text();
        })
        .then((data) => {
          this.svg = this.sanitizer.bypassSecurityTrustHtml(data);
        })
        .catch(() => {
          if (!!this.element) console.error('Invalid src: ' + './assets/images/element/' + this.element.type + '.svg');
        });
    }
  }
}
