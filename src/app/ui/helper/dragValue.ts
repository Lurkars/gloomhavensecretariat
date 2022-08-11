import { Directive, ElementRef, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Directive({
  selector: ' [drag-value]'
})
export class DragValueDirective implements OnInit {

  @Input('parent') parent: HTMLElement | null = null;
  @Output('dragMove') dragMoveCallback = new EventEmitter<number>();
  @Output('dragEnd') dragEndCallback = new EventEmitter();
  @Output('onTimeout') timeoutCallback = new EventEmitter<boolean>();

  dragStarted: boolean = false;
  timeout: any = null;;
  dragValue: number = 0;

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.elementRef.nativeElement.addEventListener('mousedown', (event: any) => {
      this.dragStart(event.clientX);
    });
    this.elementRef.nativeElement.addEventListener('touchstart', (event: any) => {
      this.dragStart(event.touches[ 0 ].clientX);
    });
  }

  dragStart(value: number) {
    if (!document.body.classList.contains('value-dragging')) {
      document.body.classList.add('value-dragging');
      this.dragStarted = true;
      this.dragValue = value;
      if (!this.timeout) {
        this.timeoutCallback.emit(true);
        this.timeout = setTimeout(() => {
          this.timeout = null;
          this.timeoutCallback.emit(false);
        }, 200);
      }
      document.body.addEventListener('mousemove', this.mousemove.bind(this), false);
      document.body.addEventListener('touchmove', this.touchmove.bind(this), false);
      document.body.addEventListener('mouseup', this.mouseup.bind(this), false);
      document.body.addEventListener('touchend', this.mouseup.bind(this), false);
      document.body.addEventListener('touchcancel', this.mouseup.bind(this), false);
    }
  }

  mousemove(event: any) {
    this.dragMove(event.clientX);
  }

  touchmove(event: any) {
    this.dragMove(event.touches[ 0 ].clientX);
  }

  mouseup(event: any) {
    this.dragEnd();
  }

  dragMove(value: number) {
    if (this.dragStarted) {
      let width = window.innerWidth;

      if (this.parent) {
        width = this.parent.getBoundingClientRect().right;
      }

      this.dragMoveCallback.emit(Math.ceil((value - this.dragValue) / (width - this.dragValue) * 100));
    }
  }

  dragEnd() {
    if (this.dragStarted) {
      this.dragStarted = false;
      this.dragEndCallback.emit();
      document.body.classList.remove('value-dragging');
      document.body.removeEventListener('mousemove', this.mousemove.bind(this), false);
      document.body.removeEventListener('touchmove', this.touchmove.bind(this), false);
      document.body.removeEventListener('mouseup', this.mouseup.bind(this), false);
      document.body.removeEventListener('touchend', this.mouseup.bind(this), false);
      document.body.removeEventListener('touchcancel', this.mouseup.bind(this), false);
    }
  }


}