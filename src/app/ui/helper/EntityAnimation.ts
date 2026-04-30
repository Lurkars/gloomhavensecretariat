import { Directive, ElementRef, OnChanges, SimpleChanges, inject, input } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';

@Directive({
  selector: '[entityAnimation]'
})
export class EntityAnimationDirective implements OnChanges {
  private el = inject(ElementRef);
  private ghsManager = inject(GhsManager);

  readonly inputElement = input.required<boolean>({ alias: 'entityAnimation' });
  get entityAnimation(): boolean {
    return this.inputElement();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['inputElement']) {
      const change = changes['inputElement'];
      if (change.currentValue !== change.previousValue) {
        if (change.currentValue) {
          this.el.nativeElement.classList.add('entity-dead');
          setTimeout(
            () => {
              this.el.nativeElement.classList.remove('entity-dead');
              this.ghsManager.triggerUiChange();
            },
            settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0
          );
        } else if (!change.currentValue) {
          this.el.nativeElement.classList.add('entity-alive');
          setTimeout(
            () => {
              this.el.nativeElement.classList.remove('entity-alive');
              this.ghsManager.triggerUiChange();
            },
            settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0
          );
        }
      }
    }
  }
}
