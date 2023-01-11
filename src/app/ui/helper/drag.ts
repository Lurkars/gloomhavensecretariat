import { Component, Directive, ElementRef, EventEmitter, HostListener, Input, Output } from "@angular/core";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

export const doubleClickTreshhold: number = 250;
export const repeatInterval: number = 100;

@Directive({
  selector: 'ghs-drag-click, [ghs-drag-click]'
})
export class DragClickDirective {

  @Input() clickBehind: boolean = false;
  @Input() relative: boolean = false;
  @Input() screenWidth: boolean = false;
  @Input() repeat: boolean = false;
  @Input() min: number = 0;
  @Input() max: number = 99;
  @Output('dragMove') dragMove = new EventEmitter<number>();
  @Output('dragEnd') dragEnd = new EventEmitter<number>();

  @Output('singleClick') singleClick: EventEmitter<any> = new EventEmitter<any>();
  @Output('doubleClick') doubleClick: EventEmitter<any> = new EventEmitter<any>();

  timeout: any = null;
  relativeValue: number = -1;
  value: number = -1;
  repeats: number = -1;

  constructor(private elementRef: ElementRef) {
    this.value = this.min - 1;
  }

  @HostListener('tap', ['$event'])
  tap(event: any) {
    if (this.clickBehind) {
      this.emitClickBehind(event.center.x, event.center.y);
    } else if (event.pointerType == "touch") {
      setTimeout(() => {
        this.singleClick.emit(event);
      }, doubleClickTreshhold);
    } else if (!this.repeat || this.doubleClick.observed) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
        this.doubleClick.emit(event);
      } else {
        this.timeout = setTimeout(() => {
          if (this.timeout) {
            this.timeout = null;
            this.singleClick.emit(event);
          }
        }, doubleClickTreshhold);
      }
    } else {
      this.singleClick.emit(event);
    }

    if (event.srcEvent.defaultPrevented) {
      event.preventDefault();
    }
  }

  @HostListener('press', ['$event'])
  press(event: any) {
    if (event.pointerType == "touch") {
      this.doubleClick.emit(event);
    } else if (this.repeat) {
      this.repeatTimeout(event);
    }
    if (event.srcEvent) {
      event.srcEvent.preventDefault();
      event.srcEvent.stopPropagation();
    }
  }

  repeatTimeout(event: any) {
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

  @HostListener('pressup', ['$event'])
  pressup(event: any) {
    if (this.repeat && this.timeout) {
      clearTimeout(this.timeout);
    }
    if (event.srcEvent) {
      event.srcEvent.preventDefault();
      event.srcEvent.stopPropagation();
    }
  }

  @HostListener('panstart', ['$event'])
  panstart(event: any) {
    if (settingsManager.settings.dragValues) {
      document.body.classList.add('dragging');
      this.elementRef.nativeElement.classList.add('dragging');
    }
    event.preventDefault();
    if (event.srcEvent) {
      event.srcEvent.preventDefault();
      event.srcEvent.stopPropagation();
    }
  }

  @HostListener('panmove', ['$event'])
  panmove(event: any) {
    if (settingsManager.settings.dragValues) {
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      if (this.screenWidth) {
        this.value = Math.min(99, Math.max(0, Math.floor(event.center.x / document.body.clientWidth * 100)));
      } else {
        this.value = Math.min(99, Math.max(0, Math.floor((event.center.x - rect.left) / rect.width * 100)));
      }
      if (this.relative && this.relativeValue == -1) {
        this.relativeValue = this.value;
      }
      this.dragMove.emit(this.relative ? this.value - this.relativeValue : this.value);
    }
    event.preventDefault();
    if (event.srcEvent) {
      event.srcEvent.preventDefault();
      event.srcEvent.stopPropagation();
    }
  }

  @HostListener('panend', ['$event'])
  panend(event: any) {
    if (settingsManager.settings.dragValues) {
      if (this.value >= this.min) {
        this.dragEnd.emit(this.relative ? this.value - this.relativeValue : this.value);
      }
      document.body.classList.remove('dragging');
      this.elementRef.nativeElement.classList.remove('dragging');
    }
    event.preventDefault();
    if (event.srcEvent) {
      event.srcEvent.preventDefault();
      event.srcEvent.stopPropagation();
    }
  }

  emitClickBehind(x: number, y: number) {
    if (!this.timeout) {
      let elements = document.elementsFromPoint(x, y);
      if (elements.length > 2 && (elements[0].classList.contains('drag-value'))) {
        (elements[2] as HTMLElement).click();
      }
      this.timeout = setTimeout(() => {
        clearTimeout(this.timeout);
        this.timeout = null;
      }, 100)
    }
  }
}