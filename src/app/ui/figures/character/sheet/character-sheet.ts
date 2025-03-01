import { Dialog, DialogRef } from "@angular/cdk/dialog";
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character, GameCharacterModel } from "src/app/game/model/Character";
import { CharacterProgress } from "src/app/game/model/CharacterProgress";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { GameState } from "src/app/game/model/Game";
import { Identifier } from "src/app/game/model/data/Identifier";
import { LootType } from "src/app/game/model/data/Loot";
import { PerkType } from "src/app/game/model/data/Perks";
import { PersonalQuest } from "src/app/game/model/data/PersonalQuest";
import { ghsDialogClosingHelper, ghsInputFullScreenCheck, ghsValueSign } from "src/app/ui/helper/Static";
import { StatisticsDialogComponent } from "../../party/statistics/statistics-dialog";
import { TrialDialogComponent } from "../../trials/dialog/trial-dialog";
import { AbilityCardsDialogComponent } from "./ability-cards-dialog";
import { CharacterMoveResourcesDialog } from "./move-resources";
import { CharacterRetirementDialog } from "./retirement-dialog";


@Component({
  standalone: false,
  selector: 'ghs-character-sheet',
  templateUrl: 'character-sheet.html',
  styleUrls: ['./character-sheet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CharacterSheetComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() character!: Character;
  @Input() editable: boolean = true;
  @Input() forceEdit: boolean = false;
  @Input() standalone: boolean = false;
  @Input() dialogRef: DialogRef | undefined;

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ghsInputFullScreenCheck = ghsInputFullScreenCheck;
  EntityValueFunction = EntityValueFunction;
  GameState = GameState;
  PerkType = PerkType;
  LootType = LootType;
  availablePerks: number = 0;
  personalQuest: PersonalQuest | undefined;
  retireEnabled: boolean = false;
  hasAbilities: boolean = false;

  goldTimeout: any = null;
  xpTimeout: any = null;
  replayable: boolean = false;

  fhSheet: boolean = false;
  csSheet: boolean = false;

  donations: boolean = true;

  titles: string[] = [];

  constructor(private dialog: Dialog) { }

  ngOnInit(): void {
    if (this.character.identities && this.character.identities.length > 1 && settingsManager.settings.characterIdentities) {
      this.titles = this.character.title.split('|');
      if (this.titles.length < this.character.identities.length) {
        for (let i = this.titles.length; i < this.character.identities.length; i++) {
          this.titles.push('');
        }
      }
      for (let i = 0; i < this.titles.length; i++) {
        if (!this.titles[i]) {
          this.titles[i] = settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
        }
      }
    }

    if (!this.character.progress) {
      this.character.progress = new CharacterProgress();
    }

    this.character.progress.perks = this.character.progress.perks || [];

    this.fhSheet = gameManager.fhRules(true);
    this.csSheet = !this.fhSheet && (this.character.edition == 'cs' || gameManager.editionExtensions(this.character.edition).indexOf('cs') != -1);

    this.donations = !this.fhSheet;

    for (let i = 0; i < 15; i++) {
      if (!this.character.progress.perks[i]) {
        this.character.progress.perks[i] = 0;
      }
    }

    if (this.fhSheet) {
      for (let value in LootType) {
        const lootType: LootType = value as LootType;
        this.character.progress.loot[lootType] = this.character.progress.loot[lootType] || 0;
      }

      if (gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'temple' && buildingModel.level > 0 && buildingModel.state != 'wrecked')) {
        this.donations = true;
      }
    }

    if (this.character.progress.experience < gameManager.characterManager.xpMap[this.character.level - 1]) {
      this.character.progress.experience = gameManager.characterManager.xpMap[this.character.level - 1];
    }

    this.availablePerks = this.character.level + Math.floor(this.character.progress.battleGoals / 3) - (this.character.progress.perks && this.character.progress.perks.length > 0 ? this.character.progress.perks.reduce((a, b) => a + b) : 0) - 1 + this.character.progress.extraPerks + this.character.progress.retirements + this.character.progress.masteries.length;

    if (this.character.progress.personalQuest) {
      this.personalQuest = gameManager.characterManager.personalQuestByCard(gameManager.currentEdition(), this.character.progress.personalQuest);
      if (!this.character.progress.personalQuestProgress) {
        this.character.progress.personalQuestProgress = [];
      }
    }

    if (!gameManager.game.scenario) {
      if (this.personalQuest) {
        this.retireEnabled = this.personalQuest.requirements.every((requirement, i) => this.character.progress.personalQuestProgress[i] >= EntityValueFunction(requirement.counter));
      } else {
        this.retireEnabled = true;
      }
    }

    this.hasAbilities = gameManager.deckData(this.character, true).abilities.length > 0;
    this.replayable = !gameManager.game.scenario && gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == this.character.name && figure.number == this.character.number) == undefined;

    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.availablePerks = this.character.level + Math.floor(this.character.progress.battleGoals / 3) - (this.character.progress.perks && this.character.progress.perks.length > 0 ? this.character.progress.perks.reduce((a, b) => a + b) : 0) - 1 + this.character.progress.extraPerks + this.character.progress.retirements + this.character.progress.masteries.length;

        for (let i = 0; i < 15; i++) {
          if (!this.character.progress.perks[i]) {
            this.character.progress.perks[i] = 0;
          }
        }

        this.retireEnabled = false;
        if (!gameManager.game.scenario) {
          if (this.personalQuest) {
            this.retireEnabled = this.personalQuest.requirements.every((requirement, i) => this.character.progress.personalQuestProgress[i] >= EntityValueFunction(requirement.counter));
          } else {
            this.retireEnabled = true;
          }
        }

      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  applyValues() {
    let title = "";

    if (this.titleInput) {
      title = this.titleInput.nativeElement.value;
    }

    if (this.titles.length > 0) {
      for (let i = 0; i < this.titles.length; i++) {
        if (this.titles[i] == settingsManager.getLabel('data.character.' + this.character.name.toLowerCase())) {
          this.titles[i] = '';
        }
      }

      title = this.titles.join('|');
      while (title.endsWith('|')) {
        title = title.substring(0, title.length - 1);
      }
    }

    if (title != settingsManager.getLabel('data.character.' + this.character.name.toLowerCase())) {
      if (this.character.title != title) {
        gameManager.stateManager.before("setTitle", gameManager.characterManager.characterName(this.character), title);
        this.character.title = title;
        gameManager.stateManager.after();
      }
    } else if (this.character.title != "") {
      gameManager.stateManager.before("unsetTitle", gameManager.characterManager.characterName(this.character), this.character.title);
      this.character.title = "";
      gameManager.stateManager.after();
    }

  }

  titleChange() {
    if (this.standalone) {
      this.applyValues();
    }
  }

  ngAfterViewInit(): void {
    if (this.titleInput) {
      this.titleInput.nativeElement.value = this.character.title || settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
    }
  }

  toggleCharacterAbsent() {
    if (this.character.absent || gameManager.characterManager.characterCount() > 1) {
      gameManager.stateManager.before(this.character.absent ? "unsetAbsent" : "setAbsent", gameManager.characterManager.characterName(this.character));
      this.character.absent = !this.character.absent;
      if (this.character.absent && this.character.active) {
        gameManager.roundManager.toggleFigure(this.character);
      }
      gameManager.stateManager.after();
    }
  }

  setTitle(event: any, index: number) {
    this.titles[index] = event.target.value;
    this.titleChange();
  }

  setLevel(level: number) {
    if (this.character.level == level) {
      level--;
    }
    if (level < 1) {
      level = 1;
    } else if (level > 9) {
      level = 9;
    }
    gameManager.stateManager.before("setLevel", gameManager.characterManager.characterName(this.character), "" + level);
    gameManager.characterManager.setLevel(this.character, level);
    gameManager.stateManager.after();
  }

  setXP(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.experience != +event.target.value) {
      if (this.xpTimeout) {
        clearTimeout(this.xpTimeout);
        this.xpTimeout = null;
      }
      this.xpTimeout = setTimeout(() => {
        gameManager.stateManager.before("setXP", gameManager.characterManager.characterName(this.character), ghsValueSign(+event.target.value - this.character.progress.experience));
        gameManager.characterManager.addXP(this.character, event.target.value - this.character.progress.experience, !gameManager.game.scenario && gameManager.roundManager.firstRound);
        gameManager.stateManager.after();
        this.xpTimeout = null;
      }, 500);
    }
  }

  setGold(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.gold != +event.target.value) {
      if (this.goldTimeout) {
        clearTimeout(this.goldTimeout);
        this.goldTimeout = null;
      }
      this.goldTimeout = setTimeout(() => {
        gameManager.stateManager.before("setGold", gameManager.characterManager.characterName(this.character), event.target.value);
        this.character.progress.gold = +event.target.value;
        gameManager.stateManager.after();
        this.goldTimeout = null;
      }, 500);
    }
  }

  setResource(type: LootType, event: any) {
    if (!isNaN(+event.target.value)) {
      gameManager.stateManager.before("setResource", gameManager.characterManager.characterName(this.character), "game.loot." + type, event.target.value);
      this.character.progress.loot[type] = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  donate() {
    if (gameManager.game.round < 1 && this.character.progress.gold > 9) {
      gameManager.stateManager.before("donate", gameManager.characterManager.characterName(this.character));
      this.character.progress.donations += 1;
      this.character.donations += 1;
      gameManager.game.party.donations += 1;
      this.character.progress.gold -= this.fhSheet ? 5 : 10;
      gameManager.stateManager.after();
    }
  }

  setPersonalQuest(event: any) {
    if (this.character.progress.personalQuest != event.target.value) {
      gameManager.stateManager.before("setPQ", gameManager.characterManager.characterName(this.character), event.target.value);
      this.character.progress.personalQuest = event.target.value;
      this.character.progress.personalQuestProgress = [];
      this.personalQuest = gameManager.characterManager.personalQuestByCard(gameManager.currentEdition(), this.character.progress.personalQuest);
      if (this.personalQuest) {
        this.character.progress.personalQuest = this.personalQuest.cardId;
        this.retireEnabled = this.personalQuest.requirements.every((requirement, i) => this.character.progress.personalQuestProgress[i] >= EntityValueFunction(requirement.counter));
      }

      gameManager.stateManager.after();
    }
  }

  setPersonalQuestProgress(index: number, input: number | any) {
    for (let i = 0; i <= index; i++) {
      if (!this.character.progress.personalQuestProgress[i]) {
        this.character.progress.personalQuestProgress[i] = 0;
      }
    }

    let value: number = 0;
    if (typeof input === 'number') {
      value = input;
    } else {
      value = +input.target.value;
    }

    if (this.character.progress.personalQuestProgress[index] == value) {
      value--;
    }

    gameManager.stateManager.before("setPQProgress", gameManager.characterManager.characterName(this.character), (index + 1), value);
    this.character.progress.personalQuestProgress[index] = value;
    gameManager.stateManager.after();

    if (!gameManager.game.scenario) {
      const retiredEnabled = this.retireEnabled;
      if (this.personalQuest) {
        this.retireEnabled = this.personalQuest.requirements.every((requirement, i) => this.character.progress.personalQuestProgress[i] >= EntityValueFunction(requirement.counter));
      }

      if (!retiredEnabled && this.retireEnabled && settingsManager.settings.applyRetirement && gameManager.game.party.campaignMode) {
        this.retire(false, true);
      }
    }
  }

  retire(force: boolean = false, dialogOnly: boolean = false) {
    if (force || this.retireEnabled) {
      if (settingsManager.settings.applyRetirement && gameManager.game.party.campaignMode) {
        this.dialog.open(CharacterRetirementDialog, {
          panelClass: ['dialog'],
          data: this.character
        }).closed.subscribe({
          next: (retired) => {
            if (retired && this.dialogRef) {
              ghsDialogClosingHelper(this.dialogRef);
            }
          }
        });
      } else if (!dialogOnly) {
        if (this.dialogRef) {
          ghsDialogClosingHelper(this.dialogRef);
        }
        gameManager.stateManager.before(this.character.progress.retired ? "setRetired" : "unsetRetired", gameManager.characterManager.characterName(this.character));
        this.character.progress.retired = true;
        if (gameManager.game.party.campaignMode) {
          gameManager.game.party.retirements.push(this.character.toModel());
          gameManager.characterManager.removeCharacter(this.character);
        }
        gameManager.stateManager.after();
      }
    }
  }

  personalQuestRequirementUnlocked(index: number): boolean {
    return this.personalQuest != undefined && this.personalQuest.requirements[index] != undefined && this.personalQuest.requirements[index].requires && this.personalQuest.requirements[index].requires.every((requireIndex) => this.personalQuest && this.character.progress.personalQuestProgress[requireIndex - 1] >= EntityValueFunction(this.personalQuest.requirements[requireIndex - 1].counter));
  }

  setExtraPerks(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.extraPerks != +event.target.value) {
      gameManager.stateManager.before("setExtraPerks", gameManager.characterManager.characterName(this.character), event.target.value);
      this.character.progress.extraPerks = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  setRetirements(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.retirements != +event.target.value) {
      gameManager.stateManager.before("setRetirements", gameManager.characterManager.characterName(this.character), event.target.value);
      this.character.progress.retirements = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  setPlayerNumber(event: any) {
    if (!isNaN(+event.target.value) && this.character.number != +event.target.value && (+event.target.value > 0)) {
      gameManager.stateManager.before("setPlayerNumber", gameManager.characterManager.characterName(this.character), event.target.value);
      const existing = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == +event.target.value);
      if (existing) {
        (existing as Character).number = this.character.number;
      }
      this.character.number = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  setBattleGoals(battleGoals: number) {
    if (this.character.progress.battleGoals == battleGoals) {
      battleGoals--;
    }
    if (battleGoals < 0) {
      battleGoals = 0;
    } else if (battleGoals > 18) {
      battleGoals = 18;
    }
    if (this.character.progress.battleGoals != battleGoals) {
      gameManager.stateManager.before("setBG", gameManager.characterManager.characterName(this.character), "" + battleGoals);
      this.character.progress.battleGoals = battleGoals;
      gameManager.stateManager.after();
    }
  }

  setNotes(event: any) {
    if (this.character.progress.notes != event.target.value) {
      gameManager.stateManager.before("setNotes", gameManager.characterManager.characterName(this.character), event.target.value);
      this.character.progress.notes = event.target.value;
      gameManager.stateManager.after();
    }
  }

  toggleMastery(index: number) {
    if (!this.character.progress.masteries) {
      this.character.progress.masteries = [];
    }

    if (this.character.progress.masteries.indexOf(index) == -1) {
      gameManager.stateManager.before("addMastery", gameManager.characterManager.characterName(this.character), "" + index);
      this.character.progress.masteries.push(index);
    } else {
      gameManager.stateManager.before("removeMastery", gameManager.characterManager.characterName(this.character), "" + index);
      this.character.progress.masteries.splice(this.character.progress.masteries.indexOf(index), 1);
    }
    gameManager.stateManager.after();
  }

  togglePerk(index: number, force: boolean = false) {
    let value = this.character.progress.perks[index] + 1;
    if (value > this.character.perks[index].count) {
      value = 0;
    }

    if (!force && this.availablePerks == 0 && value != 0 && this.character.progress.perks[index]) {
      value = this.character.progress.perks[index] - 1;
    }

    const disabled: boolean = gameManager.game.state != GameState.draw || gameManager.game.round > 0 || this.availablePerks == 0 && !this.character.progress.perks[index];

    if (!force && disabled && value > 1) {
      value = 0;
    }

    this.addPerk(index, value, force);
  }

  addPerk(index: number, value: number, force: boolean = false) {
    const disabled: boolean = !this.forceEdit && (gameManager.game.state != GameState.draw || gameManager.game.round > 0) || this.character.progress.perks[index] < value && this.availablePerks < value - this.character.progress.perks[index];

    if (!disabled || force && !settingsManager.settings.characterSheetLocked && this.editable) {
      gameManager.stateManager.before("setPerk", gameManager.characterManager.characterName(this.character), "" + index, "" + value);
      const lowerShacklesHP = this.character.name == 'shackles' && this.character.edition == 'fh' && index == 11 && this.character.progress.perks[index] == 2;
      if (this.character.progress.perks[index] && this.character.progress.perks[index] == value) {
        this.character.progress.perks[index]--;
      } else {
        this.character.progress.perks[index] = value;
      }
      this.character.mergeAttackModifierDeck(gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character));
      gameManager.attackModifierManager.shuffleModifiers(this.character.attackModifierDeck);

      if (this.character.name == 'shackles' && this.character.edition == 'fh' && index == 11) {
        if (this.character.progress.perks[index] == 2) {
          this.character.maxHealth += 5;
        } else if (lowerShacklesHP) {
          this.character.maxHealth -= 5;
        }
        this.character.health = this.character.maxHealth;
      }

      gameManager.stateManager.after();
    }
  }

  moveResources() {
    this.dialog.open(CharacterMoveResourcesDialog, {
      panelClass: ['dialog'],
      data: { character: this.character }
    });
  }

  exportCharacter() {
    const downloadButton = document.createElement('a');
    downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.character.toModel())));
    downloadButton.setAttribute('download', (this.character.title ? this.character.title + "_" : "") + this.character.name + ".json");
    document.body.appendChild(downloadButton);
    downloadButton.click();
    document.body.removeChild(downloadButton);
  }

  importCharacter(event: any) {
    const parent = event.target.parentElement;
    parent.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        const characterModel: GameCharacterModel = Object.assign(new Character(this.character, this.character.level).toModel(), JSON.parse(event.target.result));
        if (characterModel.name != this.character.name || characterModel.edition != this.character.edition) {
          parent.classList.add("error");
        } else {
          gameManager.stateManager.before("importCharacter", gameManager.characterManager.characterName(this.character));
          this.character.fromModel(characterModel);
          gameManager.stateManager.after();
        }
      });

      reader.readAsText(event.target.files[0]);
    } catch (e: any) {
      console.warn(e);
      parent.classList.add("error");
    }
  }

  setAside() {
    gameManager.stateManager.before("characterSetAside", gameManager.characterManager.characterName(this.character, true, true), gameManager.game.party.players[this.character.number - 1] ? gameManager.game.party.players[this.character.number - 1] : '' + this.character.number);
    gameManager.game.party.availableCharacters = gameManager.game.party.availableCharacters || [];
    gameManager.game.party.availableCharacters.push(this.character.toModel());
    gameManager.characterManager.removeCharacter(this.character);
    gameManager.stateManager.after();
    if (this.dialogRef) {
      ghsDialogClosingHelper(this.dialogRef);
    }
  }

  replay() {
    if (this.replayable) {
      gameManager.stateManager.before("characterReplay", gameManager.characterManager.characterName(this.character, true, true), gameManager.game.party.players[this.character.number - 1] ? gameManager.game.party.players[this.character.number - 1] : '' + this.character.number);
      gameManager.game.party.availableCharacters = gameManager.game.party.availableCharacters.filter((availableCharacter) => availableCharacter.name != this.character.name || availableCharacter.edition != this.character.edition || availableCharacter.number != this.character.number);
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Character && figure.number == this.character.number) {
          gameManager.game.party.availableCharacters.push(figure.toModel());
          gameManager.characterManager.removeCharacter(figure);
        }
      })
      gameManager.game.figures.push(this.character);
      gameManager.stateManager.after();
      if (this.dialogRef) {
        ghsDialogClosingHelper(this.dialogRef);
      }
    }
  }

  toggleFhSheet() {
    this.fhSheet = !this.fhSheet;
    this.csSheet = !this.fhSheet && (this.character.edition == 'cs' || gameManager.editionExtensions(this.character.edition).indexOf('cs') != -1);
  }

  openAbilityCards() {
    this.dialog.open(AbilityCardsDialogComponent, {
      panelClass: ['dialog'],
      data: { character: this.character }
    });
  }

  statistics() {
    this.dialog.open(StatisticsDialogComponent, {
      panelClass: ['dialog-invert'],
      data: this.character
    })
  }

  openTrial() {
    if (this.character.progress.trial) {
      this.dialog.open(TrialDialogComponent, {
        panelClass: ['fullscreen-panel'],
        data: {
          edition: this.character.progress.trial.edition,
          trial: +this.character.progress.trial.name
        }
      })
    }
  }

  setTrial(event: any) {
    event.target.classList.add('error');
    let trial = +event.target.value;
    if (settingsManager.settings.fhSecondEdition) {
      trial = gameManager.trialsManager.cardIdSecondPrinting(trial);
    }
    if (!this.character.progress.trial || this.character.progress.trial.name != '' + trial) {
      const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.currentEdition() && editionData.trials && editionData.trials.length);
      if (editionData) {
        const trialCard = editionData.trials.find((trialCard) => trialCard.cardId == trial && trialCard.edition == gameManager.currentEdition());
        if (trialCard) {
          event.target.classList.remove('error');
          event.target.classList.add('warning');
          if (!gameManager.game.figures.find((figure) => figure instanceof Character && figure.progress.trial && figure.progress.trial.edition == gameManager.currentEdition() && figure.progress.trial.name == '' + trial)) {
            gameManager.stateManager.before("setTrial", gameManager.characterManager.characterName(this.character), event.target.value);
            this.character.progress.trial = new Identifier('' + trial, gameManager.currentEdition());
            const currentTrialIndex = Math.max(...gameManager.game.figures.filter((figure) => figure instanceof Character).map((character) =>
              editionData.trials.find((trialCard) => character.progress.trial && trialCard.cardId == +character.progress.trial.name && trialCard.edition == character.progress.trial.edition)).map((trialCard) => trialCard ? editionData.trials.indexOf(trialCard) : -1));
            if (!gameManager.game.party.trials || gameManager.game.party.trials != currentTrialIndex) {
              gameManager.game.party.trials = currentTrialIndex;
            }
            event.target.classList.remove('warning');
            gameManager.stateManager.after();
          } else if (this.character.progress.trial) {
            trial = settingsManager.settings.fhSecondEdition ? gameManager.trialsManager.cardIdSecondPrinting(+this.character.progress.trial.name) : +this.character.progress.trial.name;
            event.target.value = trial;
          }
        }
      }
    }
  }
}