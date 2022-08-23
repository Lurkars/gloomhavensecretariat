import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[card-reveal]'
})
export class CardRevealDirective {

  @Input('disabled') disabled: boolean = false;
  clicked: boolean = false;

  @Output() change = new EventEmitter<boolean>();

  constructor(private el: ElementRef) {
    this.el.nativeElement.classList.add("reveal");
  }

  @HostListener('click') onClick() {
    if (!this.disabled) {
      if (this.el.nativeElement.classList.contains("flipped")) {
        this.el.nativeElement.classList.remove("flipped");
        this.change.emit(false);
      } else
        if (!this.clicked) {
          this.clicked = true;
          this.el.nativeElement.classList.add("confirm");
        } else {
          this.el.nativeElement.classList.add("flipped");
          this.change.emit(true);
          this.clicked = false;
          this.el.nativeElement.classList.remove("confirm");
        }
    }
  }


  @HostListener('mouseleave') onMouseLeave() {
    if (!this.disabled) {
      this.clicked = false;
      this.el.nativeElement.classList.remove("confirm");
    }
  }
}