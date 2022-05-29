import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { CharacterEntity } from "src/app/game/model/CharacterEntity";
import { CharacterData } from "src/app/game/model/data/CharacterData";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Figure } from "src/app/game/model/Figure";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { DialogComponent } from "src/app/ui/dialog/dialog";

@Component({
  selector: 'ghs-main-menu',
  templateUrl: 'menu.html',
  styleUrls: [ './menu.scss', '../../dialog/dialog.scss' ]
})
export class MainMenuComponent extends DialogComponent {

  gameManager: GameManager = gameManager;
  GameState = GameState
  SubMenu = SubMenu;
  active: SubMenu = SubMenu.main;


  override close(): void {
    this.active = SubMenu.main;
    super.close();
  }

  setEdition(edition: string | undefined = undefined) {
    gameManager.stateManager.before();
    gameManager.game.edition = edition;
    gameManager.stateManager.after();
  }

  setScenario(scenarioData: ScenarioData | undefined) {
    gameManager.stateManager.before();
    gameManager.setScenario(scenarioData)
    gameManager.stateManager.after();
  }

  characters(): CharacterEntity[] {
    return gameManager.game.figures.filter((figure: Figure) => {
      return figure instanceof CharacterEntity;
    }).map((figure: Figure) => {
      return figure as CharacterEntity;
    });
  }

  monsters(): Monster[] {
    return gameManager.game.figures.filter((figure: Figure) => {
      return figure instanceof Monster;
    }).map((figure: Figure) => {
      return figure as Monster;
    });
  }

  addCharacter(characterData: CharacterData) {
    gameManager.stateManager.before();
    gameManager.characterManager.addCharacter(characterData);
    if (this.hasAllCharacter()) {
      this.close();
    }
    gameManager.stateManager.after();
  }

  removeCharacter(character: CharacterEntity) {
    gameManager.stateManager.before();
    gameManager.characterManager.removeCharacter(character);
    if (this.characters().length == 0) {
      this.close();
    }
    gameManager.stateManager.after();
  }

  removeAllCharacters() {
    gameManager.stateManager.before();
    gameManager.game.figures = gameManager.game.figures.filter((figure: Figure) => {
      return !(figure instanceof CharacterEntity);
    })
    this.close();
    gameManager.stateManager.after();
  }

  addMonster(monsterData: MonsterData) {
    gameManager.stateManager.before();
    gameManager.monsterManager.addMonster(monsterData);
    if (this.hasAllMonster()) {
      this.close();
    }
    gameManager.stateManager.after();
  }

  removeMonster(monster: Monster) {
    gameManager.stateManager.before();
    gameManager.monsterManager.removeMonster(monster);
    if (this.monsters().length == 0) {
      this.close();
      this.setScenario(undefined);
    }
    gameManager.stateManager.after();
  }

  removeAllMonsters() {
    gameManager.stateManager.before();
    gameManager.game.figures = gameManager.game.figures.filter((figure: Figure) => {
      return !(figure instanceof Monster);
    })
    this.close();
    this.setScenario(undefined);
    gameManager.stateManager.after();
  }

  hasCharacter(characterData: CharacterData) {
    return gameManager.game.figures.some((figure: Figure) => {
      return figure instanceof CharacterEntity && characterData.name == figure.name;
    })
  }

  hasAllCharacter() {
    return gameManager.charactersData.filter((characterData: CharacterData) => !gameManager.game.edition || characterData.edition == gameManager.game.edition).length == gameManager.game.figures.filter((figure: Figure) =>
      figure instanceof CharacterData && (!gameManager.game.edition || figure.edition == gameManager.game.edition)
    ).length;
  }

  hasMonster(monsterData: MonsterData) {
    return gameManager.game.figures.some((figure: Figure) => {
      return figure instanceof Monster && monsterData.name == figure.name;
    })
  }

  hasAllMonster() {
    return gameManager.monstersData.filter((monsterData: MonsterData) => !gameManager.game.edition || monsterData.edition == gameManager.game.edition).length == gameManager.game.figures.filter((figure: Figure) =>
      figure instanceof Monster && (!gameManager.game.edition || figure.edition == gameManager.game.edition)
    ).length;
  }

  zoomOut(): void {
    this.zoom(5);
  }

  zoomIn(): void {
    this.zoom(-5);
  }

  zoomReset(): void {
    gameManager.stateManager.before();
    document.body.style.setProperty('--ghs-factor', 100 + '');
    this.setDialogPosition();
    gameManager.stateManager.after();
  }

  zoom(value: number) {
    gameManager.stateManager.before();
    let factor: number = +window.getComputedStyle(document.body).getPropertyValue('--ghs-factor');
    factor += value;
    document.body.style.setProperty('--ghs-factor', factor + '');
    this.setDialogPosition();
    gameManager.stateManager.after();
  }

  reset(): void {
    gameManager.stateManager.reset();
    window.location.reload();
  }

  toggleCalc() {
    gameManager.stateManager.before();
    gameManager.game.calculate = !gameManager.game.calculate
    gameManager.stateManager.after();
  }
}

export enum SubMenu {
  main, edition, scenario, section, monster_add, monster_remove, character_add, character_remove, settings, language
}