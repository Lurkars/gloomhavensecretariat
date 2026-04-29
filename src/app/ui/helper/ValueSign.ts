import { Directive, ElementRef, OnChanges, inject, input } from '@angular/core';
import { ghsValueSign } from 'src/app/ui/helper/Static';

@Directive({
  selector: '[value-sign]'
})
export class ValueSignDirective implements OnChanges {
  private el = inject(ElementRef);

  readonly value = input<number>(0, { alias: 'value-sign' });
  readonly colored = input<boolean>(true);
  readonly empty = input<boolean>(true);
  readonly hideEmpty = input<boolean>(false);
  readonly reverse = input<boolean>(false);
  readonly invert = input<boolean>(false);
  readonly container = input<boolean>(false);

  constructor() {
    this.update();
  }

  ngOnChanges(): void {
    this.update();
  }

  update() {
    this.el.nativeElement.innerHTML = ghsValueSign(this.reverse() ? -this.value() : this.value(), this.empty());
    if (this.container()) {
      this.el.nativeElement.innerHTML =
        '<span class="value">' + ghsValueSign(this.reverse() ? -this.value() : this.value(), this.empty()) + '</span>';
    }
    this.el.nativeElement.classList.remove('hide-zero-value', 'positive-value', 'negative-value');
    const value = this.value();
    if (value === 0 && this.hideEmpty()) {
      this.el.nativeElement.classList.add('hide-zero-value');
    } else if (this.colored()) {
      const invert = this.invert();
      if ((!invert && value > 0) || (invert && value < 0)) {
        this.el.nativeElement.classList.add('positive-value');
      } else if ((!invert && value < 0) || (invert && value > 0)) {
        this.el.nativeElement.classList.add('negative-value');
      }
    }
  }
}
