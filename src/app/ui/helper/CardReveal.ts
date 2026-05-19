import { Directive, ElementRef, HostListener, inject, input, output } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';

@Directive({
  selector: '[card-reveal]'
})
export class CardRevealDirective {
  private el = inject(ElementRef);

  readonly disabled = input<boolean>(false);
  clicked: boolean = false;
  private pointerStartX: number = 0;
  private pointerStartY: number = 0;
  private dragging: boolean = false;

  readonly changed = output<boolean>();

  constructor() {
    this.el.nativeElement.classList.add('reveal');
  }

  @HostListener('pointerdown', ['$event']) onPointerDown(event: PointerEvent) {
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.dragging = false;
  }

  @HostListener('pointermove', ['$event']) onPointerMove(event: PointerEvent) {
    if (!this.dragging) {
      const dx = event.clientX - this.pointerStartX;
      const dy = event.clientY - this.pointerStartY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.dragging = true;
      }
    }
  }

  @HostListener('pointerup') onClick() {
    if (this.dragging) {
      return;
    }
    if (!this.disabled()) {
      if (this.el.nativeElement.classList.contains('flipped')) {
        this.el.nativeElement.classList.remove('flipped');
        setTimeout(
          () => {
            this.changed.emit(false);
          },
          settingsManager.settings.animations ? 1000 * settingsManager.settings.animationSpeed : 0
        );
      } else if (!this.clicked) {
        this.clicked = true;
        this.el.nativeElement.classList.add('confirm');
      } else {
        this.el.nativeElement.classList.add('flipped');
        setTimeout(
          () => {
            this.changed.emit(true);
          },
          settingsManager.settings.animations ? 1000 * settingsManager.settings.animationSpeed : 0
        );
        this.clicked = false;
        this.el.nativeElement.classList.remove('confirm');
      }
    } else if (this.clicked) {
      this.clicked = false;
      this.el.nativeElement.classList.remove('confirm');
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (!this.disabled() || this.clicked) {
      this.clicked = false;
      this.el.nativeElement.classList.remove('confirm');
    }
  }
}
