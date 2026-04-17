import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { GameState } from 'src/app/game/model/Game';
import { ElementIconComponent } from 'src/app/ui/header/element/element-icon';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, ElementIconComponent, PointerInputDirective],
  selector: 'ghs-element',
  templateUrl: './element.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./element.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementComponent {
  @Input() element!: ElementModel;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  ElementState = ElementState;

  toggleElement(double: boolean = false): void {
    const elementState = gameManager.nextElementState(this.element, double);
    gameManager.stateManager.before('updateElement', 'game.element.' + this.element.type, 'game.element.state.' + elementState);
    this.element.state = elementState;
    gameManager.stateManager.after();
  }
}
