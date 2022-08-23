import { AfterViewChecked, Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Figure } from 'src/app/game/model/Figure';

@Directive({
  selector: '[autoscroll]'
})
export class AutoscrollDirective implements OnChanges {

  @Input('autoscroll') active: boolean = false;

  constructor(private el: ElementRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes[ 'active' ] && changes[ 'active' ].currentValue && changes[ 'active' ].currentValue != changes[ 'active' ].previousValue) {
      setTimeout(() => {
        this.el.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }, 5);
    }
  }

}


@Directive({
  selector: '[figure-autoscroll]'
})
export class FigureAutoscrollDirective {

  @Input('figure-autoscroll') figure!: Figure;
  active: boolean = false;

  constructor(private el: ElementRef) {

    gameManager.uiChange.subscribe({
      next: () => {
        setTimeout(() => {
          if (settingsManager.settings.autoscroll && !this.active && this.figure.active) {
            this.el.nativeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }
          this.active = this.figure.active;
        }, 300);
      }
    })

  }
}