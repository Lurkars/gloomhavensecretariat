import { AfterViewChecked, Directive, ElementRef, Input } from '@angular/core';


@Directive({
	standalone: false,
  selector: '[text-shrink]'
})
export class TextShrinkDirective implements AfterViewChecked {

  @Input() keepCurrent: boolean = false;
  @Input() ignoreHeight: boolean = false;
  @Input() ignoreWidth: boolean = false;

  constructor(private el: ElementRef) { }

  ngAfterViewChecked(): void {
    let i = 5;
    let overflow = false;

    const parent = this.el.nativeElement.parentElement;

    while (!overflow && i < (this.keepCurrent ? +window.getComputedStyle(this.el.nativeElement, null).getPropertyValue('font-size') : 100)) {
      this.el.nativeElement.style.fontSize = i + "px";
      overflow = !this.ignoreWidth && this.el.nativeElement.clientWidth > parent.clientWidth || !this.ignoreHeight && this.el.nativeElement.clientHeight > parent.clientHeight;

      if (!overflow) {
        i += 1;
      }
    }

    this.el.nativeElement.style.fontSize = (i - 1) + "px";
  }
}

