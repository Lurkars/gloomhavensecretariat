import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { Element } from 'src/app/game/model/Element';
import { GameState } from 'src/app/game/model/Game';

@Component({
  selector: 'ghs-header',
  templateUrl: './header.html',
  styleUrls: [ './header.scss' ]
})
export class HeaderComponent {

  gameManager: GameManager = gameManager;
  GameState = GameState;

  elements: Element[] = [ Element.fire, Element.ice, Element.air, Element.earth, Element.light, Element.dark ];

}

