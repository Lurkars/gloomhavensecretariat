import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { ObjectiveData } from "src/app/game/model/data/ObjectiveData";
import { ghsDialogClosingHelper, ghsHasSpoilers, ghsIsSpoiled, ghsNotSpoiled } from "../../helper/Static";
import { FeedbackDialogComponent } from "../../tools/feedback/feedback-dialog";
import { KeyboardShortcutsComponent } from "./keyboard-shortcuts/keyboard-shortcuts";
import { UndoDialogComponent } from "./undo/dialog";

export enum SubMenu {
  main = "main",
  scenario = "scenario",
  section = "section",
  monster_add = "monster_add",
  monster_remove = "monster_remove",
  character_add = "character_add",
  character_remove = "character_remove",
  objective_add = "objective_add",
  objective_remove = "objective_remove",
  settings = "settings",
  debug = "debug",
  server = "server",
  datamanagement = "datamanagement",
  editions = "editions",
  about = "about",
  campaign = "campaign"
}

@Component({
	standalone: false,
  selector: 'ghs-main-menu',
  templateUrl: 'menu.html',
  styleUrls: ['./menu.scss']
})
export class MainMenuComponent implements OnInit, OnDestroy {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState
  SubMenu = SubMenu;
  active: SubMenu = SubMenu.main;
  standalone: boolean = false;
  hasSpoilers = ghsHasSpoilers;
  isSpoiled = ghsIsSpoiled;
  notSpoiled = ghsNotSpoiled;
  WebSocket = WebSocket;

  undoInfo: string[] = [];
  undoOffset: number = 0;
  redoInfo: string[] = [];

  constructor(@Inject(DIALOG_DATA) data: { subMenu: SubMenu, standalone: boolean }, private dialogRef: DialogRef, private dialog: Dialog, private swUpdate: SwUpdate) {
    this.active = data.subMenu;
    this.standalone = data.standalone;
    this.dialogRef.overlayRef.hostElement.style.zIndex = '3000';
    if (this.dialogRef.overlayRef.backdropElement) {
      this.dialogRef.overlayRef.backdropElement.style.zIndex = '3000';
    }
  }

  ngOnInit(): void {
    this.updateUndoRedo();

    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.updateUndoRedo();
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  updateUndoRedo() {
    const undos = gameManager.stateManager.undos;
    const redos = gameManager.stateManager.redos;
    const undoInfos = gameManager.stateManager.undoInfos;
    if (undos.length > 0 && undoInfos.length >= undos.length) {
      this.undoInfo = undoInfos[undos.length - 1];
      this.undoOffset = (gameManager.game.revision
        - (gameManager.game.revisionOffset || 0)) - (undos[undos.length - 1].revision - (undos[undos.length - 1].revisionOffset || 0)) - 1;
      if (this.undoInfo && this.undoInfo.length > 1 && this.undoInfo[0] == "serverSync") {
        if (gameManager.game.state == GameState.draw && this.undoInfo[1] == "setInitiative" && this.undoInfo.length > 3) {
          this.undoInfo = ["serverSync", settingsManager.getLabel('state.info.' + this.undoInfo[1], [this.undoInfo[2], ""])];
        } else {
          this.undoInfo = ["serverSync", settingsManager.getLabel('state.info.' + this.undoInfo[1], this.undoInfo.slice(2))];
        }
      } else if (this.undoInfo && this.undoInfo.length == 1 && this.undoInfo[0] == "serverSync") {
        this.undoInfo = ["serverSync", ""]
      } else if (!this.undoInfo) {
        this.undoInfo = ["unknown"];
      }
    } else {
      this.undoInfo = [];
      this.undoOffset = 0;
    }
    if (redos.length > 0 && undoInfos.length > undos.length) {
      this.redoInfo = undoInfos[undos.length];
      if (this.redoInfo && this.redoInfo.length > 1 && this.redoInfo[0] == "serverSync") {
        if (this.redoInfo[1] == "setInitiative" && this.redoInfo.length > 3) {
          this.redoInfo = ["serverSync", settingsManager.getLabel('state.info.' + this.redoInfo[1], [this.redoInfo[2], ""])];
        } else {
          this.redoInfo = ["serverSync", settingsManager.getLabel('state.info.' + this.redoInfo[1], this.redoInfo.slice(2))];
        }
      } else if (this.redoInfo && this.redoInfo.length == 1 && this.redoInfo[0] == "serverSync") {
        this.redoInfo = ["serverSync", ""]
      } else if (!this.redoInfo) {
        this.redoInfo = ["unknown"];
      }
    } else {
      this.redoInfo = [];
    }
  }

  openUndoDialog(event: any) {
    this.dialog.open(UndoDialogComponent, {
      panelClass: ['dialog']
    })
    this.close();
    event.preventDefault();
    event.stopPropagation();
  }

  setActive(active: SubMenu) {
    this.active = active;
  }

  hasSections(): boolean {
    return gameManager.editionData.some((editionData) => editionData.edition == gameManager.currentEdition() && editionData.sections && editionData.sections.length > 0);
  }

  characters(): Character[] {
    return gameManager.game.figures.filter((figure) => {
      return figure instanceof Character;
    }).map((figure) => {
      return figure as Character;
    }).sort((a, b) => {
      const aName = gameManager.characterManager.characterName(a).toLowerCase();
      const bName = gameManager.characterManager.characterName(b).toLowerCase();
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  objectives(): ObjectiveContainer[] {
    return gameManager.game.figures.filter((figure) => {
      return figure instanceof ObjectiveContainer;
    }).map((figure) => {
      return figure as ObjectiveContainer;
    }).sort((a, b) => {
      const aName = (a.title ? a.title : settingsManager.getLabel(a.name ? 'data.objective.' + a.name : (a.escort ? 'escort' : 'objective'))).toLowerCase();
      const bName = (b.title ? b.title : settingsManager.getLabel(b.name ? 'data.objective.' + b.name : (b.escort ? 'escort' : 'objective'))).toLowerCase();
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


  removeCharacter(character: Character) {
    gameManager.stateManager.before("removeChar", gameManager.characterManager.characterName(character));
    gameManager.characterManager.removeCharacter(character);
    if (this.characters().length == 0) {
      this.close();
    }
    gameManager.stateManager.after();
  }

  removeAllCharacters() {
    gameManager.stateManager.before("removeAllChars");
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof Character))
    this.close();
    gameManager.stateManager.after();
  }

  addObjectiveContainer(escort: boolean = false) {
    gameManager.stateManager.before("addObjective" + (escort ? '.escort' : ''));
    const objectiveContainer = gameManager.objectiveManager.addObjective(new ObjectiveData("", escort ? 3 : 7, escort), escort ? '%escort%' : '%objective%');
    gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
    this.close();
    gameManager.stateManager.after();
  }

  removeObjective(objective: ObjectiveContainer) {
    gameManager.stateManager.before("removeObjective", objective.title || objective.name);
    gameManager.objectiveManager.removeObjective(objective);
    if (this.objectives().length == 0) {
      this.close();
    }
    gameManager.stateManager.after();
  }

  removeAllObjectives() {
    gameManager.stateManager.before("removeAllObjectives");
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof ObjectiveContainer))
    this.close();
    gameManager.stateManager.after();
  }

  removeMonster(monster: Monster) {
    gameManager.stateManager.before("removeMonster", "data.monster." + monster.name);
    gameManager.monsterManager.removeMonster(monster);
    if (this.monsters().length == 0) {
      this.close();
    }
    gameManager.stateManager.after();
  }

  removeAllMonsters(unused: boolean = false) {
    gameManager.stateManager.before("removeAllMonster");
    gameManager.game.figures = gameManager.game.figures.filter((figure) => {
      return !(figure instanceof Monster) || unused && figure.entities.some((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity));
    })
    this.close();
    gameManager.stateManager.after();
  }

  hasAllMonster() {
    return gameManager.monstersData().every((monsterData) => gameManager.game.figures.some((figure) => figure instanceof MonsterData && figure.name == monsterData.name && figure.edition == monsterData.edition));
  }

  hasUnusedMonster() {
    return gameManager.game.figures.find((figure) => {
      return figure instanceof Monster && figure.entities.every((monsterEntity) => !gameManager.entityManager.isAlive(monsterEntity));
    }) != undefined && gameManager.game.figures.find((figure) => {
      return figure instanceof Monster && figure.entities.some((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity));
    }) != undefined
  }

  isUpdateAvailable(): boolean {
    return gameManager.stateManager.hasUpdate;
  }

  update(force: boolean = false): void {
    if (this.isUpdateAvailable() || force) {
      if (this.swUpdate.isEnabled) {
        this.swUpdate.activateUpdate().then(() => {
          this.clearAndRefresh();
        });
      } else {
        this.clearAndRefresh();
      }
    }
  }

  async clearAndRefresh() {
    if ('caches' in window) {
      const keyList = await caches.keys();
      await Promise.all(keyList.map(async (key) => await caches.delete(key)));
    }
    window.location.reload()
  }

  feedbackDialog() {
    this.dialog.open(FeedbackDialogComponent, {
      panelClass: ['dialog']
    })
    this.close();
  }

  keyboardShourtcutsDialog() {
    this.dialog.open(KeyboardShortcutsComponent, {
      panelClass: ['dialog']
    })
    this.close();
  }
}