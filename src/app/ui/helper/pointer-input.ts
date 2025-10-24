import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { PointerInputService } from "./pointer-input-service";

export const doubleClickTreshhold: number = 250;
export const longPressTreshhold: number = 550;
export const holdTreshhold: number = 500;
export const moveTreshhold: number = 7;
export const repeatInterval: number = 100;
export const dragWidthThreshold: number = 1200;
export const dragWidthFactor: number = 0.4;
export const maxElementDepth: number = 50;

@Directive({
  standalone: false,
  selector: 'ghs-pointer-input, [ghs-pointer-input]'
})
export class PointerInputDirective implements OnInit, OnDestroy {

  @Input() clickBehind: boolean = false;
  @Input() relative: boolean = false;
  @Input() screenWidth: boolean = false;
  @Input() repeat: boolean = false;
  @Input() disabled: boolean = false;
  @Input() forcePress: boolean = false;
  @Input() forceDoubleClick: boolean = false;
  @Input() onRelease: boolean = false;
  @Input() fastShift: boolean = false;
  @Output('dragMove') dragMove = new EventEmitter<number>();
  @Output('dragEnd') dragEnd = new EventEmitter<number>();
  @Output('dragCancel') dragCancel = new EventEmitter<number>();

  @Output('singleClick') singleClick: EventEmitter<any> = new EventEmitter<any>();
  @Output('doubleClick') doubleClick: EventEmitter<any> = new EventEmitter<any>();

  timeout: any = null;
  relativeValue: number = -1;
  value: number = -1;
  repeats: number = -1;
  down: boolean = false;
  clicks: number = 0;
  startX: number = 0;
  startY: number = 0;
  move: boolean = false;
  fast: boolean = false;
  fastOffset: number = 0;
  lastX: number = 0;
  isDragElement: boolean = false;

  constructor(public elementRef: ElementRef, private service: PointerInputService) {
    this.value = -1;
    this.elementRef.nativeElement.style['touch-action'] = 'pan-y';
    this.isDragElement = elementRef.nativeElement.hasAttribute('cdkdrag') ||
      elementRef.nativeElement.hasAttribute('cdkdraghandle') ||
      elementRef.nativeElement.classList.contains('cdk-drag') ||
      elementRef.nativeElement.classList.contains('cdk-drag-handle') ||
      elementRef.nativeElement.classList.contains('cdk-drag-preview') ||
      elementRef.nativeElement.classList.contains('cdk-drag-placeholder');
  }

  ngOnInit(): void {
    this.service.register(this);
  }

  ngOnDestroy(): void {
    this.service.unregister(this);
  }

  pointerdown(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.down = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    if (!this.move && this.repeat && !this.doubleClick.observed) {
      this.repeats = -1;
      this.repeatTimeout(event);
    } else if (this.forcePress || settingsManager.settings.pressDoubleClick && !this.forceDoubleClick && this.doubleClick.observed && !this.move && event.pointerType === 'touch') {
      this.timeout = setTimeout(() => {
        if (event.pointerType === 'mouse' || !this.onRelease) {
          this.doubleClick.emit(event);
        }
        this.timeout = null;
        this.clicks = 2;
      }, longPressTreshhold);
    }
  }

  pointermove(event: PointerEvent) {
    if (this.down) {
      const x = event.clientX;
      const y = event.clientY;
      if (!this.move && Math.max(Math.abs(this.startX - x), Math.abs(this.startY - y)) > moveTreshhold) {
        this.panstart(event);
      } else if (this.move) {
        this.panmove(event);
      }
    }
  }

  pointerup(event: PointerEvent) {
    if (this.down) {
      this.down = false;
      this.startX = 0;
      this.startY = 0;
      if (this.service.currentPinchZoom) {
        this.clicks = 0;
        if (this.timeout) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
      } else if (!this.move) {
        if (!this.forcePress && (event.pointerType === 'mouse' || !settingsManager.settings.pressDoubleClick || this.forceDoubleClick)) {
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
              if (this.clicks > 0 && (!this.repeat || this.doubleClick.observed)) {
                this.singleClick.emit(event);
              }
              this.clicks = 0;
              this.timeout = null;
            }, this.doubleClick.observed ? doubleClickTreshhold : 0)
          }
        } else if (event.pointerType === 'touch' && this.onRelease && this.clicks == 2) {
          this.doubleClick.emit(event);
          this.clicks = 0;
        } else {
          if (this.clicks < 2 && (!this.repeat || this.doubleClick.observed)) {
            this.singleClick.emit(event);
          }
          if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
          this.clicks = 0;
        }
      } else {
        this.clicks = 0;
      }
      this.panend(event);
    }
  }

  panstart(event: PointerEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      this.elementRef.nativeElement.classList.add('dragging');
    }
    this.move = true;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  panmove(event: PointerEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      const x = event.clientX;
      if (this.screenWidth) {
        if (document.body.clientWidth > dragWidthThreshold) {
          this.value = Math.min(99, Math.max(0, x * (dragWidthThreshold / document.body.clientWidth) / document.body.clientWidth * 100));
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
      if (this.fast) {
        this.fastOffset += (x - this.lastX) < 0 ? -1 : 1;
      }
      this.value = Math.floor(this.relative ? this.value - this.relativeValue : this.value) + this.fastOffset;
      this.lastX = x;
      this.dragMove.emit(this.value);
    }
  }

  panend(event: PointerEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed) && (this.value >= 0 || this.relative)) {
      this.dragEnd.emit(this.value);
    }
    this.reset();
  }

  cancel() {
    this.down = false;
    this.clicks = 0;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.dragCancel.emit(this.value);
    this.reset();
  }

  reset() {
    this.repeats = -1;
    this.startX = -1;
    this.startY = -1;
    this.move = false;
    this.value = -1;
    this.relativeValue = -1;
    this.fast = false;
    this.fastOffset = 0;
    this.elementRef.nativeElement.classList.remove('dragging');
  }

  repeatTimeout(event: PointerEvent) {
    if (this.down && !this.move) {
      this.singleClick.emit(event);
      if (this.repeats == -1) {
        this.repeats = holdTreshhold;
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

}
