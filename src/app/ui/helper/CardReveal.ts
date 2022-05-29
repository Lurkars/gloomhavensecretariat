import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[card-reveal]'
})
export class CardRevealDirective {

  clicked: boolean = false;

  constructor(private el: ElementRef) {

    this.el.nativeElement.classList.add("reveal");

  }

  @HostListener('click') onClick() {
    if (this.el.nativeElement.classList.contains("flipped")) {
      this.el.nativeElement.classList.remove("flipped");
    } else
      if (!this.clicked) {
        this.clicked = true;
        this.el.nativeElement.classList.add("confirm");
      } else {
        this.el.nativeElement.classList.add("flipped");
        this.clicked = false;
        this.el.nativeElement.classList.remove("confirm");
      }
  }


  @HostListener('mouseleave') onMouseLeave() {
    this.clicked = false;
    this.el.nativeElement.classList.remove("confirm");
  }
}