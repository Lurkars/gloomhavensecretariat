import { Component } from "@angular/core";
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
import { ObjectiveData } from "src/app/game/model/data/ObjectiveData";

export enum SubMenu {
  main, edition, scenario, section, monster_add, monster_remove, character_add, character_remove, objective_add, objective_remove, settings, server, datamanagement, about
}

@Component({
  selector: 'ghs-main-menu',
  templateUrl: 'menu.html',
  styleUrls: [ './menu.scss', '../../dialog/dialog.scss' ]
})
export class MainMenuComponent extends DialogComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState
  SubMenu = SubMenu;
  active: SubMenu = SubMenu.main;
  hasUpdate: boolean = false;
  hasSpoilers = ghsHasSpoilers;
  isSpoiled = ghsIsSpoiled;
  notSpoiled = ghsNotSpoiled;
  version = packageJson.version;
  WebSocket = WebSocket;

  showHiddenMonster: boolean = false;

  constructor(private swUpdate: SwUpdate) {
    super();
    this.swUpdate.versionUpdates.subscribe(evt => {
      if (evt.type == 'VERSION_READY') {
        this.hasUpdate = true;
      } else if (evt.type == 'VERSION_INSTALLATION_FAILED') {
        console.error(`Failed to install version '${evt.version.hash}': ${evt.error}`);
      }
    })

    if (this.swUpdate.isEnabled) {
      // check for PWA update every 30s
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 30000);
    }

  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.swUpdate.isEnabled) {
      document.body.addEventListener("click", (event) => {
        if (settingsManager.settings.fullscreen && this.swUpdate.isEnabled) {
          document.body.requestFullscreen();
        }
      });
    }
  }

  setActive(active: SubMenu) {
    this.dialog.nativeElement.classList.remove('opened');
    this.active = active;
    setTimeout(() => {
      this.dialog.nativeElement.classList.add('opened');
    }, 1);
  }

  override close(): void {
    this.active = SubMenu.main;
    super.close();
  }

  get setDialogPositionFunc() {
    return this.setDialogPosition.bind(this);
  }

  undoInfo(): string[] {
    let undos = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      undos = JSON.parse(undoString);
    }
    let undoInfos = [];
    const undoInfosString: string | null = localStorage.getItem("ghs-undo-infos");
    if (undoInfosString != null) {
      undoInfos = JSON.parse(undoInfosString);
    }
    if (undos.length > 0 && undoInfos.length >= undos.length) {
      return undoInfos[ undos.length - 1 ]
    }
    return [];
  }

  redoInfo(): string[] {
    let undos = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      undos = JSON.parse(undoString);
    }
    let redos = [];
    const redoString: string | null = localStorage.getItem("ghs-redo");
    if (redoString != null) {
      redos = JSON.parse(redoString);
    }
    let undoInfos = [];
    const undoInfosString: string | null = localStorage.getItem("ghs-undo-infos");
    if (undoInfosString != null) {
      undoInfos = JSON.parse(undoInfosString);
    }
    if (redos.length > 0 && undoInfos.length >= undos.length + redos.length) {
      return undoInfos[ undos.length ]
    }
    return [];
  }

  hasScenarios(): boolean {
    return gameManager.editionData.some((editionData) => (!gameManager.game.edition || editionData.edition == gameManager.game.edition) && editionData.scenarios && editionData.scenarios.length > 0);
  }


  hasSections(): boolean {
    return gameManager.editionData.some((editionData) => (!gameManager.game.edition || editionData.edition == gameManager.game.edition) && editionData.sections && editionData.sections.length > 0);
  }


  setScenario(scenarioData: ScenarioData | undefined) {
    gameManager.stateManager.before();
    gameManager.scenarioManager.setScenario(scenarioData as Scenario)
    gameManager.stateManager.after();
  }

  characters(): Character[] {
    return gameManager.game.figures.filter((figure) => {
      return figure instanceof Character;
    }).map((figure) => {
      return figure as Character;
    }).sort((a, b) => {
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
    return gameManager.game.figures.filter((figure) => {
      return figure instanceof Objective;
    }).map((figure) => {
      return figure as Objective;
    }).sort((a, b) => {
      const aName = (a.title ? a.title : settingsManager.getLabel(a.name ? 'data.objective.' + a.name : (a.escort ? 'escort' : 'objective'))).toLowerCase();
      const bName = (b.title ? b.title : settingsManager.getLabel(b.name ? 'data.objective.' + b.name : (b.escort ? 'escort' : 'objective'))).toLowerCase();
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return a.id - b.id;
    });
  }

  characterData(edition: string | undefined = undefined): CharacterData[] {
    return gameManager.charactersData(true).filter((characterData) => !edition || characterData.edition == edition).sort((a, b) => {
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
    return gameManager.game.figures.filter((figure) => {
      return figure instanceof Monster;
    }).map((figure) => {
      return figure as Monster;
    }).sort((a, b) => {
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
    return gameManager.monstersData(false).some((monsterData) => monsterData.hidden);
  }

  monsterData(edition: string | undefined = undefined): MonsterData[] {
    return gameManager.monstersData(true).filter((monsterData) => (!monsterData.hidden || monsterData.hidden == this.showHiddenMonster) && (!edition || monsterData.edition == edition)).sort((a, b) => {
      const aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
      const bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();

      if (a.spoiler && !b.spoiler) {
        return 1;
      }
      if (!a.spoiler && b.spoiler) {
        return -1;
      }

      if (a.boss && !b.boss) {
        return 1;
      }
      if (!a.boss && b.boss) {
        return -1;
      }

      if (a.hidden && !b.hidden) {
        return 1;
      }
      if (!a.hidden && b.hidden) {
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
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof Character))
    this.close();
    gameManager.stateManager.after();
  }

  addObjective() {
    gameManager.stateManager.before();
    gameManager.characterManager.addObjective();
    this.close();
    gameManager.stateManager.after();
  }

  addEscort() {
    gameManager.stateManager.before();
    gameManager.characterManager.addObjective(new ObjectiveData("escort", 3, true));
    this.close();
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
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof Objective))
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
    }
    gameManager.stateManager.after();
  }

  removeAllMonsters() {
    gameManager.stateManager.before();
    gameManager.game.figures = gameManager.game.figures.filter((figure) => {
      return !(figure instanceof Monster);
    })
    this.close();
    this.setScenario(undefined);
    gameManager.stateManager.after();
  }

  hasCharacter(characterData: CharacterData) {
    return gameManager.game.figures.some((figure) => {
      return figure instanceof Character && characterData.name == figure.name && characterData.edition == figure.edition;
    })
  }

  hasAllCharacter() {
    return gameManager.charactersData().every((characterData) => gameManager.game.figures.some((figure) => figure instanceof CharacterData && figure.name == characterData.name && figure.edition == characterData.edition));
  }

  hasMonster(monsterData: MonsterData) {
    return gameManager.game.figures.some((figure) => {
      return figure instanceof Monster && monsterData.name == figure.name && monsterData.edition == figure.edition;
    })
  }

  hasAllMonster() {
    return gameManager.monstersData().every((monsterData) => gameManager.game.figures.some((figure) => figure instanceof MonsterData && figure.name == monsterData.name && figure.edition == monsterData.edition));
  }

  isUpdateAvailable(): boolean {
    return this.hasUpdate;
  }

  update(force: boolean = false): void {
    if (this.hasUpdate || force) {
      if (this.swUpdate.isEnabled) {
        this.swUpdate.activateUpdate().then(() => {
          this.clearAndRefresh();
        });
      } else {
        this.clearAndRefresh();
      }
    }
  }

  clearAndRefresh() {
    if ('caches' in window) {
      caches.keys()
        .then(function (keyList) {
          return Promise.all(keyList.map(function (key) {
            return caches.delete(key);
          }));
        })
    }
    window.location.reload()
  }

}