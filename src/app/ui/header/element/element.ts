import { NgClass } from '@angular/common';
import { Component, input, ViewEncapsulation } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { GameState } from 'src/app/game/model/Game';
import { ElementIconComponent } from 'src/app/ui/header/element/element-icon';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, ElementIconComponent, PointerInputDirective],
  selector: 'ghs-element',
  templateUrl: './element.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./element.scss']
})
export class ElementComponent {
  readonly inputElement = input.required<ElementModel>({ alias: 'element' });
  get element(): ElementModel {
    return this.inputElement();
  }

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  ElementState = ElementState;

  toggleElement(double: boolean = false): void {
    const elementState = gameManager.elementManager.nextElementState(this.element, double);
    gameManager.stateManager.before('updateElement', 'game.element.' + this.element.type, 'game.element.state.' + elementState);
    gameManager.elementManager.applyElementState(this.element, elementState);
    gameManager.stateManager.after();
  }
}
