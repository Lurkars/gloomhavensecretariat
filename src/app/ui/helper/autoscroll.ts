import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Figure } from 'src/app/game/model/Figure';

@Directive({
	standalone: false,
  selector: '[autoscroll]'
})
export class AutoscrollDirective implements OnChanges {

  @Input('autoscroll') active: boolean = false;

  constructor(private el: ElementRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active'] && changes['active'].currentValue && changes['active'].currentValue != changes['active'].previousValue) {
      setTimeout(() => {
        this.el.nativeElement.scrollIntoView({
          behavior: !settingsManager.settings.animations ? 'auto' : 'smooth',
          block: 'center',
          inline: 'center'
        });
      }, 5);
    }
  }

}


@Directive({
	standalone: false,
  selector: '[figure-autoscroll]'
})
export class FigureAutoscrollDirective implements OnInit, OnDestroy {

  @Input('figure-autoscroll') figure!: Figure;
  @Input('block') block: ScrollLogicalPosition = 'center';
  @Input('inline') inline: ScrollLogicalPosition = 'center';
  active: boolean = false;

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        setTimeout(() => {
          if (settingsManager.settings.autoscroll && !this.active && this.figure.active) {
            this.el.nativeElement.scrollIntoView({
              behavior: !settingsManager.settings.animations ? 'auto' : 'smooth',
              block: this.block,
              inline: this.inline
            });
          }
          this.active = this.figure.active;
        }, !settingsManager.settings.animations ? 5 : 300);
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }
}