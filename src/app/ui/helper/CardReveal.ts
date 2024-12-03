import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';

@Directive({
	standalone: false,
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
        setTimeout(() => {
          this.change.emit(false);
        }, settingsManager.settings.animations ? 1000 : 0)
      } else
        if (!this.clicked) {
          this.clicked = true;
          this.el.nativeElement.classList.add("confirm");
        } else {
          this.el.nativeElement.classList.add("flipped");
          setTimeout(() => {
            this.change.emit(true);
          }, settingsManager.settings.animations ? 1000 : 0)
          this.clicked = false;
          this.el.nativeElement.classList.remove("confirm");
        }
    } else if (this.clicked) {
      this.clicked = false;
      this.el.nativeElement.classList.remove("confirm");
    }
  }


  @HostListener('mouseleave') onMouseLeave() {
    if (!this.disabled || this.clicked) {
      this.clicked = false;
      this.el.nativeElement.classList.remove("confirm");
    }
  }
}