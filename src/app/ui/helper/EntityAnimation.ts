import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';


@Directive({
  selector: '[entityAnimation]'
})
export class EntityAnimationDirective implements OnChanges {

  @Input('entityAnimation') entityAnimation!: boolean;

  constructor(private el: ElementRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes[ 'entityAnimation' ]) {
      const change = changes[ 'entityAnimation' ];
      if (change.currentValue != change.previousValue) {
        if (change.currentValue) {
          this.el.nativeElement.classList.add("entity-dead");
          setTimeout(() => {
            this.el.nativeElement.classList.remove("entity-dead");
          }, 1500);
        } else if (!change.currentValue) {
          this.el.nativeElement.classList.add("entity-alive");
          setTimeout(() => {
            this.el.nativeElement.classList.remove("entity-alive");
          }, 1500);
        }
      }
    }
  }

}