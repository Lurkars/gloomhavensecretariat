import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager, SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Element } from 'src/app/game/model/Element';
import { Figure } from 'src/app/game/model/Figure';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MainMenuComponent, SubMenu } from './menu/menu';

@Component({
  selector: 'ghs-header',
  templateUrl: './header.html',
  styleUrls: [ './header.scss' ]
})
export class HeaderComponent implements OnInit {

  @ViewChild(MainMenuComponent) mainMenu!: MainMenuComponent;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  WebSocket = WebSocket;

  SubMenu = SubMenu;
  menuState: SubMenu = SubMenu.main;

  elements: Element[] = [ Element.fire, Element.ice, Element.air, Element.earth, Element.light, Element.dark ];

  init: boolean = false;
  hintState: string = "";

  ngOnInit(): void {
    setTimeout(() => {
      this.init = true;
    }, 1500);

    gameManager.uiChange.subscribe((value: boolean) => {
      if (this.hintStateValue() != this.hintState) {
        this.init = false;
        setTimeout(() => {
          this.hintState = this.hintStateValue();
          this.init = true;
        }, 500);
      }
    })
  }

  hintStateValue(): string {
    if (gameManager.game.figures.every((figure: Figure) => !(figure instanceof Character) && !(figure instanceof Monster))) {
      return 'characters';
    } else if (!gameManager.game.scenario && gameManager.game.figures.every((figure: Figure) => !(figure instanceof Monster))) {
      return 'scenario';
    } else if (gameManager.game.figures.every((figure: Figure) => !(figure instanceof Monster) || figure.entities.length == 0)) {
      return 'addMonsterEntities';
    } else if (gameManager.game.figures.some((figure: Figure) => figure.active)) {
      return gameManager.game.round < 3 ? 'active-full' : 'active';
    } else if (gameManager.game.state == GameState.draw) {
      if (gameManager.game.figures.some((figure: Figure) => figure instanceof Character && !figure.exhausted && figure.health > 0 && figure.initiative <= 0)) {
        return gameManager.game.round < 3 ? 'draw-full' : 'draw-short';
      }
      return 'draw';
    } else if (gameManager.game.state == GameState.next) {
      return 'next';
    }

    return "";
  }

  openMenu(menu: SubMenu) {
    this.mainMenu.active = menu;
    if (!this.mainMenu.opened) {
      this.mainMenu.open();
    }
  }

}

