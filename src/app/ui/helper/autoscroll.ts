import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Figure } from 'src/app/game/model/Figure';

@Directive({
  selector: '[autoscroll]'
})
export class AutoscrollDirective implements OnChanges {
  private el = inject(ElementRef);

  @Input('autoscroll') active: boolean = false;

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
  selector: '[figure-autoscroll]'
})
export class FigureAutoscrollDirective {
  private el = inject(ElementRef);
  private ghsManager = inject(GhsManager);

  @Input('figure-autoscroll') figure!: Figure;
  @Input() block: ScrollLogicalPosition = 'center';
  @Input() inline: ScrollLogicalPosition = 'center';
  active: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      setTimeout(
        () => {
          if (settingsManager.settings.autoscroll && !this.active && this.figure.active) {
            this.el.nativeElement.scrollIntoView({
              behavior: !settingsManager.settings.animations ? 'auto' : 'smooth',
              block: this.block,
              inline: this.inline
            });
          }
          this.active = this.figure.active;
        },
        settingsManager.settings.animations ? 300 * settingsManager.settings.animationSpeed : 5
      );
    });
  }
}
