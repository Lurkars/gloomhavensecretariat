import { Directive, ElementRef, OnChanges, SimpleChanges, inject, input } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Figure } from 'src/app/game/model/Figure';

@Directive({
  selector: '[autoscroll]'
})
export class AutoscrollDirective implements OnChanges {
  private el = inject(ElementRef);

  readonly active = input<boolean>(false, { alias: 'autoscroll' });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active'] && changes['active'].currentValue && changes['active'].currentValue !== changes['active'].previousValue) {
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

  readonly figure = input.required<Figure>({ alias: 'figure-autoscroll' });
  readonly block = input<ScrollLogicalPosition>('center');
  readonly inline = input<ScrollLogicalPosition>('center');
  active: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      setTimeout(
        () => {
          const figure = this.figure();
          if (settingsManager.settings.autoscroll && !this.active && figure.active) {
            this.el.nativeElement.scrollIntoView({
              behavior: !settingsManager.settings.animations ? 'auto' : 'smooth',
              block: this.block(),
              inline: this.inline()
            });
          }
          this.active = figure.active;
        },
        settingsManager.settings.animations ? 300 * settingsManager.settings.animationSpeed : 5
      );
    });
  }
}
