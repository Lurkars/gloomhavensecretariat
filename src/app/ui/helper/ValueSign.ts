import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';
import { ghsValueSign } from 'src/app/ui/helper/Static';

@Directive({
  selector: '[value-sign]'
})
export class ValueSignDirective implements OnChanges {
  private el = inject(ElementRef);

  @Input('value-sign') value: number = 0;
  @Input() colored: boolean = true;
  @Input() empty: boolean = true;
  @Input() hideEmpty: boolean = false;
  @Input() reverse: boolean = false;
  @Input() invert: boolean = false;
  @Input() container: boolean = false;

  constructor() {
    this.update();
  }

  ngOnChanges(): void {
    this.update();
  }

  update() {
    this.el.nativeElement.innerHTML = ghsValueSign(this.reverse ? -this.value : this.value, this.empty);
    if (this.container) {
      this.el.nativeElement.innerHTML =
        '<span class="value">' + ghsValueSign(this.reverse ? -this.value : this.value, this.empty) + '</span>';
    }
    this.el.nativeElement.classList.remove('hide-zero-value', 'positive-value', 'negative-value');
    if (this.value == 0 && this.hideEmpty) {
      this.el.nativeElement.classList.add('hide-zero-value');
    } else if (this.colored) {
      if ((!this.invert && this.value > 0) || (this.invert && this.value < 0)) {
        this.el.nativeElement.classList.add('positive-value');
      } else if ((!this.invert && this.value < 0) || (this.invert && this.value > 0)) {
        this.el.nativeElement.classList.add('negative-value');
      }
    }
  }
}
