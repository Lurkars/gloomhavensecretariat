import { Component, ViewEncapsulation } from "@angular/core";
import packageJson from '../../../../../package.json';
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CharacterData } from "src/app/game/model/data/CharacterData";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Figure } from "src/app/game/model/Figure";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { DialogComponent } from "src/app/ui/dialog/dialog";
import { SwUpdate } from '@angular/service-worker';
import { Scenario } from "src/app/game/model/Scenario";
import { ghsHasSpoilers, ghsIsSpoiled, ghsNotSpoiled } from "../../helper/Static";
import { Objective } from "src/app/game/model/Objective";
import { ObjectiveIdMap } from "../../figures/objective/objective";

export enum SubMenu {
  main, edition, scenario, section, monster_add, monster_remove, character_add, character_remove, objective_remove, settings, server, datamanagement, about
}

@Component({
  selector: 'ghs-main-menu',
  templateUrl: 'menu.html',
  styleUrls: [ './menu.scss', '../../dialog/dialog.scss' ],
  encapsulation: ViewEncapsulation.None
})
export class MainMenuComponent extends DialogComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState
  SubMenu = SubMenu;
  active: SubMenu = SubMenu.main;
  isSW: boolean = false;
  hasUpdate: boolean = false;
  hasSpoilers = ghsHasSpoilers;
  isSpoiled = ghsIsSpoiled;
  notSpoiled = ghsNotSpoiled;
  version = packageJson.version;
  WebSocket = WebSocket;
  objectiveIdMap = ObjectiveIdMap;

  showHiddenMonster: boolean = false;

  constructor(private swUpdate: SwUpdate) {
    super();
    this.isSW = this.swUpdate.isEnabled;
    this.swUpdate.versionUpdates.subscribe(evt => {
      this.hasUpdate = false;
      if (evt.type == 'VERSION_READY') {
        this.hasUpdate = true;
      } else if (evt.type == 'VERSION_INSTALLATION_FAILED') {
        console.error(`Failed to install version '${evt.version.hash}': ${evt.error}`);
      }
    })
  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.isSW) {
      document.body.addEventListener("click", (event) => {
        if (settingsManager.settings.fullscreen && this.isSW) {
          document.body.requestFullscreen();
        }
      });
    }
  }

  override close(): void {
    this.active = SubMenu.main;
    super.close();
  }

  get setDialogPositionFunc() {
    return this.setDialogPosition.bind(this);
  }

  setScenario(scenarioData: ScenarioData | undefined) {
    gameManager.stateManager.before();
    gameManager.setScenario(scenarioData as Scenario)
    gameManager.stateManager.after();
  }

  characters(): Character[] {
    return gameManager.game.figures.filter((figure: Figure) => {
      return figure instanceof Character;
    }).map((figure: Figure) => {
      return figure as Character;
    }).sort((a: Character, b: Character) => {
      const aName = a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase();
      const bName = b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase();
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  objectives(): Objective[] {
    return gameManager.game.figures.filter((figure: Figure) => {
      return figure instanceof Objective;
    }).map((figure: Figure) => {
      return figure as Objective;
    }).sort((a: Objective, b: Objective) => {
      const aName = a.title.toLowerCase() || settingsManager.getLabel(a.name).toLowerCase();
      const bName = b.title.toLowerCase() || settingsManager.getLabel(a.name).toLowerCase();
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  characterData(edition: string | undefined = undefined): CharacterData[] {
    return gameManager.charactersData().filter((characterData: CharacterData) => !edition || characterData.edition == edition).sort((a: CharacterData, b: CharacterData) => {
      const aName = settingsManager.getLabel('data.character.' + a.name).toLowerCase();
      const bName = settingsManager.getLabel('data.character.' + b.name).toLowerCase();

      if (a.spoiler && !b.spoiler) {
        return 1;
      }
      if (!a.spoiler && b.spoiler) {
        return -1;
      }

      if (a.spoiler && b.spoiler) {
        if (!this.isSpoiled(a) && this.isSpoiled(b)) {
          return 1;
        }
        if (this.isSpoiled(a) && !this.isSpoiled(b)) {
          return -1;
        }
      }

      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  monsters(): Monster[] {
    return gameManager.game.figures.filter((figure: Figure) => {
      return figure instanceof Monster;
    }).map((figure: Figure) => {
      return figure as Monster;
    }).sort((a: Monster, b: Monster) => {
      const aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
      const bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  hasHiddenMonster(): boolean {
    return gameManager.monstersData(false).some((monsterData: MonsterData) => monsterData.hidden);
  }

  monsterData(): MonsterData[] {
    return gameManager.monstersData(false).filter((monsterData: MonsterData) => !monsterData.hidden || monsterData.hidden == this.showHiddenMonster).sort((a: MonsterData, b: MonsterData) => {
      const aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
      const bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();

      if (a.spoiler && !b.spoiler) {
        return 1;
      }
      if (!a.spoiler && b.spoiler) {
        return -1;
      }

      if (a.hidden && !b.hidden) {
        return -1;
      }
      if (!a.hidden && b.hidden) {
        return 1;
      }

      if (a.spoiler && b.spoiler) {
        if (!this.isSpoiled(a) && this.isSpoiled(b)) {
          return 1;
        }
        if (this.isSpoiled(a) && !this.isSpoiled(b)) {
          return -1;
        }
      }

      if (a.boss && !b.boss) {
        return 1;
      }
      if (!a.boss && b.boss) {
        return -1;
      }

      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
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

  removeCharacter(character: Character) {
    gameManager.stateManager.before();
    gameManager.characterManager.removeCharacter(character);
    if (this.characters().length == 0) {
      this.close();
    }
    gameManager.stateManager.after();
  }

  removeAllCharacters() {
    gameManager.stateManager.before();
    gameManager.game.figures = gameManager.game.figures.filter((figure: Figure) => !(figure instanceof Character))
    this.close();
    gameManager.stateManager.after();
  }

  addObjective() {
    gameManager.stateManager.before();
    gameManager.characterManager.addObjective();
    gameManager.stateManager.after();
  }

  removeObjective(objective: Objective) {
    gameManager.stateManager.before();
    gameManager.characterManager.removeObjective(objective);
    if (this.objectives().length == 0) {
      this.close();
    }
    gameManager.stateManager.after();
  }

  removeAllObjectives() {
    gameManager.stateManager.before();
    gameManager.game.figures = gameManager.game.figures.filter((figure: Figure) => !(figure instanceof Objective))
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
      return figure instanceof Character && characterData.name == figure.name && characterData.edition == figure.edition;
    })
  }

  hasAllCharacter() {
    return gameManager.charactersData().every((characterData: CharacterData) => gameManager.game.figures.some((figure: Figure) => figure instanceof CharacterData && figure.name == characterData.name && figure.edition == characterData.edition));
  }

  hasMonster(monsterData: MonsterData) {
    return gameManager.game.figures.some((figure: Figure) => {
      return figure instanceof Monster && monsterData.name == figure.name && monsterData.edition == figure.edition;
    })
  }

  hasAllMonster() {
    return gameManager.monstersData().every((monsterData: MonsterData) => gameManager.game.figures.some((figure: Figure) => figure instanceof MonsterData && figure.name == monsterData.name && figure.edition == monsterData.edition));
  }

  update(): void {
    if (this.hasUpdate) {
      this.swUpdate.activateUpdate().then(() => document.location.reload());
    }
  }

}