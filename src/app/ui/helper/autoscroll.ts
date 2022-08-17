import { Directive, ElementRef, Input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Figure } from 'src/app/game/model/Figure';

@Directive({
  selector: '[figure-autoscroll]'
})
export class AutoscrollDirective {

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
            this.active = this.figure.active;
          }
        }, 5);
      }
    })

  }


}