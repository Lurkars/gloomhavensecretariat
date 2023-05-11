import { Directive, ElementRef, EventEmitter, Input, Output } from "@angular/core";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

export const doubleClickTreshhold: number = 250;
export const longPressTreshhold: number = 500;
export const moveTreshhold: number = 7;
export const repeatInterval: number = 100;
export const dragWidthThreshhold: number = 1200;
export const dragWidthFactor: number = 0.4;

@Directive({
  selector: 'ghs-pointer-input, [ghs-pointer-input]'
})
export class PointerInputDirective {

  @Input() clickBehind: boolean = false;
  @Input() relative: boolean = false;
  @Input() screenWidth: boolean = false;
  @Input() repeat: boolean = false;
  @Input() disabled: boolean = false;
  @Output('dragMove') dragMove = new EventEmitter<number>();
  @Output('dragEnd') dragEnd = new EventEmitter<number>();

  @Output('singleClick') singleClick: EventEmitter<any> = new EventEmitter<any>();
  @Output('doubleClick') doubleClick: EventEmitter<any> = new EventEmitter<any>();

  timeout: any = null;
  relativeValue: number = -1;
  value: number = -1;
  repeats: number = -1;
  down: boolean = false;
  clicks: number = 0;
  startX: number = 0;
  move: boolean = false;

  mousemove: any;
  mouseup: any;
  touchmove: any;
  touchend: any;
  touchcancel: any;

  constructor(private elementRef: ElementRef) {
    this.value = -1;
    this.elementRef.nativeElement.style['touch-action'] = 'pan-y';

    this.elementRef.nativeElement.addEventListener('mousedown', (event: MouseEvent) => { this.pointerdown(event); }, { passive: true });
    this.elementRef.nativeElement.addEventListener('touchstart', (event: TouchEvent) => { event.preventDefault(); this.pointerdown(event); }, { passive: true });
  }

  pointerdown(event: TouchEvent | MouseEvent) {
    this.down = true;
    this.startX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    if (!this.move && this.repeat && !this.doubleClick.observed) {
      this.repeatTimeout(event);
    } else if (settingsManager.settings.pressDoubleClick && !this.move && !(event instanceof MouseEvent)) {
      this.timeout = setTimeout(() => {
        this.doubleClick.emit(event);
        this.timeout = null;
      }, longPressTreshhold);
    }

    this.mousemove = window.addEventListener('mousemove', (event: MouseEvent) => { this.pointermove(event); }), { passive: true };
    this.mouseup = window.addEventListener('mouseup', (event: MouseEvent) => { this.pointerup(event); }, { passive: true });
    this.touchmove = window.addEventListener('touchmove', (event: TouchEvent) => { event.preventDefault(); this.pointermove(event); }, { passive: true });
    this.touchend = window.addEventListener('touchend', (event: TouchEvent) => { event.preventDefault(); this.pointerup(event); }, { passive: true });
    this.touchcancel = window.addEventListener('touchcancel', (event: TouchEvent) => { event.preventDefault(); this.pointerup(event); }, { passive: true });
  }

  pointermove(event: TouchEvent | MouseEvent) {
    if (this.down) {
      const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      if (!this.move && Math.abs(this.startX - x) > moveTreshhold) {
        this.panstart(event);
      } else if (this.move) {
        this.panmove(event);
      }
    }
  }

  pointerup(event: TouchEvent | MouseEvent) {
    if (this.down) {
      this.down = false;
      this.startX = 0;
      if (!this.move) {
        if ((event instanceof MouseEvent || !settingsManager.settings.pressDoubleClick)) {
          this.clicks++;
          if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
          if (this.clicks == 2 && this.doubleClick.observed) {
            this.doubleClick.emit(event);
            this.clicks = 0;
          } else {
            this.timeout = setTimeout(() => {
              if (this.clicks > 0) {
                this.singleClick.emit(event);
              }
              this.clicks = 0;
              this.timeout = null;
            }, doubleClickTreshhold)
          }
        } else {
          if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
            this.singleClick.emit(event);
          }
        }
      } else {
        this.clicks = 0;
      }

      this.panend(event);

      window.removeEventListener('mousemove', this.mousemove);
      window.removeEventListener('mouseup', this.mouseup);
      window.removeEventListener('touchmove', this.touchmove);
      window.removeEventListener('touchcancel', this.touchcancel);
      window.removeEventListener('touchend', this.touchend);
    }
  }

  panstart(event: TouchEvent | MouseEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      this.elementRef.nativeElement.classList.add('dragging');
      this.move = true;

      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    }
  }

  panmove(event: TouchEvent | MouseEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      if (this.screenWidth) {
        if (document.body.clientWidth > dragWidthThreshhold) {
          this.value = Math.min(99, Math.max(0, x * (dragWidthThreshhold / document.body.clientWidth) / document.body.clientWidth * 100));
        } else {
          this.value = Math.min(99, Math.max(0, x / document.body.clientWidth * 100));
          if (this.relative) {
            this.value = this.value * dragWidthFactor;
          }
        }
      } else {
        this.value = Math.min(99, Math.max(0, (x - rect.left) / rect.width * 100));
      }
      if (this.relative && this.relativeValue == -1) {
        this.relativeValue = this.value;
      }
      this.value = Math.floor(this.relative ? this.value - this.relativeValue : this.value);
      this.dragMove.emit(this.value);
    }
  }

  panend(event: TouchEvent | MouseEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      if (this.value >= 0 || this.relative) {
        this.dragEnd.emit(this.value);
      }
      this.move = false;
      this.value = -1;
      this.relativeValue = -1;
      this.elementRef.nativeElement.classList.remove('dragging');
    }
  }

  repeatTimeout(event: TouchEvent | MouseEvent) {
    this.singleClick.emit(event);
    if (this.repeats == -1) {
      this.repeats = 500;
    } else {
      this.repeats -= 25;
      if (this.repeats < 25) {
        this.repeats = 25;
      }
    }
    this.timeout = setTimeout(() => {
      this.repeatTimeout(event);
    }, this.repeats);
  }

}