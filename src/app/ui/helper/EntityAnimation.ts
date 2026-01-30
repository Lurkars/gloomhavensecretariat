import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';


@Directive({
  standalone: false,
  selector: '[entityAnimation]'
})
export class EntityAnimationDirective implements OnChanges {

  @Input('entityAnimation') entityAnimation!: boolean;

  constructor(private el: ElementRef, private ghsManager: GhsManager) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['entityAnimation']) {
      const change = changes['entityAnimation'];
      if (change.currentValue != change.previousValue) {
        if (change.currentValue) {
          this.el.nativeElement.classList.add("entity-dead");
          setTimeout(() => {
            this.el.nativeElement.classList.remove("entity-dead");
            this.ghsManager.triggerUiChange();
          }, settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0);
        } else if (!change.currentValue) {
          this.el.nativeElement.classList.add("entity-alive");
          setTimeout(() => {
            this.el.nativeElement.classList.remove("entity-alive");
            this.ghsManager.triggerUiChange();
          }, settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0);
        }
      }
    }
  }

}