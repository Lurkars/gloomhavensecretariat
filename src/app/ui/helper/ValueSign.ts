import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ghsValueSign } from './Static';

@Directive({
	standalone: false,
  selector: '[value-sign]'
})
export class ValueSignDirective implements OnChanges {

  @Input('value-sign') value: number = 0;
  @Input('colored') colored: boolean = true;
  @Input('empty') empty: boolean = true;
  @Input('hideEmpty') hideEmpty: boolean = false;
  @Input('reverse') reverse: boolean = false;
  @Input('container') container: boolean = false;

  constructor(private el: ElementRef) {
    this.update()
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.update()
  }

  update() {
    this.el.nativeElement.innerHTML = ghsValueSign(this.reverse ? - this.value : this.value, this.empty);
    if (this.container) {
      this.el.nativeElement.innerHTML = '<span class="value">' + ghsValueSign(this.reverse ? - this.value : this.value, this.empty) + '</span>';
    }
    this.el.nativeElement.classList.remove('hide-zero-value', 'positive-value', 'negative-value');
    if (this.value == 0 && this.hideEmpty) {
      this.el.nativeElement.classList.add('hide-zero-value');
    } else if (this.colored) {
      if (this.value > 0) {
        this.el.nativeElement.classList.add('positive-value');
      } else if (this.value < 0) {
        this.el.nativeElement.classList.add('negative-value');
      }
    }
  }

}