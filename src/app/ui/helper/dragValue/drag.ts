import { Component, Directive, ElementRef, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
  selector: 'ghs-drag-value',
  templateUrl: './drag.html',
  styleUrls: [ './drag.scss' ]
})
export class DragValueComponent {

  @Input() relative: boolean = false;
  @Input() step: number = 1;
  @Input() min: number = 0;
  @Input() max: number = 99;
  @Output('dragMove') dragMoveCallback = new EventEmitter<number>();
  @Output('dragEnd') dragEndCallback = new EventEmitter<number>();

  inputCount: number = 0;
  draggingTimeout: any;
  touchX: number = 0;
  touchY: number = 0;
  relativeValue: number = -1;
  value: number = -1;

  constructor(private elementRef: ElementRef) {
    this.value = this.min - 1;
  }

  click(event: any) {
    if (this.inputCount < 2) {
      this.clickBehind(event.clientX, event.clientY);
    }
    this.inputCount = 0;
    this.relativeValue = -1;
    this.draggingTimeout = setTimeout(() => {
      document.body.classList.remove('dragging');
    }, 200);
    this.elementRef.nativeElement.classList.remove('dragging');
    this.elementRef.nativeElement.firstChild.classList.remove('dragging');
  }

  clickBehind(x: number, y: number) {
    let elements = document.elementsFromPoint(x, y);
    if (elements.length > 2 && elements[ 0 ].classList.contains('drag-value-input')) {
      (elements[ 2 ] as HTMLElement).click();
    }
  }

  touchstart(event: any) {
    if (event.touches.length > 0) {
      this.touchX = event.touches[ 0 ].clientX;
      this.touchY = event.touches[ 0 ].clientY;
    }
  }

  touchend(event: any) {
    if (this.inputCount < 2 && this.touchX > 0 && this.touchY > 0) {
      this.clickBehind(this.touchX, this.touchY);
    }
    this.touchX = 0;
    this.touchY = 0;
    this.endDrag();
  }

  change(event: any) {
    this.endDrag();
  }

  endDrag() {
    if (this.inputCount > 1 && this.value > this.min - 1) {
      this.dragEndCallback.emit(this.relative ? this.value - this.relativeValue : this.value);
    }
    this.value = this.min - 1;
    this.inputCount = 0;
    this.relativeValue = -1;
    this.draggingTimeout = setTimeout(() => {
      document.body.classList.remove('dragging');
    }, 200);
    this.elementRef.nativeElement.classList.remove('dragging');
    this.elementRef.nativeElement.firstChild.classList.remove('dragging');
  }

  input(event: any) {
    this.value = event.target.value;
    this.inputCount++;
    if (this.inputCount == 2) {
      document.body.classList.add('dragging');
      this.elementRef.nativeElement.classList.add('dragging');
      this.elementRef.nativeElement.firstChild.classList.add('dragging');
    }

    if (this.inputCount > 3) {
      if (this.relative && this.relativeValue == -1) {
        this.relativeValue = this.value;
      }
      this.dragMoveCallback.emit(this.relative ? this.value - this.relativeValue : this.value);
    }
  }

}