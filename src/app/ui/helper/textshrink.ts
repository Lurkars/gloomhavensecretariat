import { AfterViewChecked, AfterViewInit, Directive, ElementRef } from '@angular/core';


@Directive({
  selector: '[text-shrink]'
})
export class TextShrinkDirective implements AfterViewChecked {

  constructor(private el: ElementRef) { }

  ngAfterViewChecked(): void {
    let i = 5;
    let overflow = false;

    const parent = this.el.nativeElement.parentElement;

    while (!overflow && i < 100) {
      this.el.nativeElement.style.fontsize = i + "px";
      overflow = this.el.nativeElement.clientWidth > parent.clientWidth || this.el.nativeElement.clientHeight > parent.clientHeight;

      if (!overflow) {
        i += 1;
      }
    }

    this.el.nativeElement.style.fontsize = (i - 1) + "px";
  }
}

