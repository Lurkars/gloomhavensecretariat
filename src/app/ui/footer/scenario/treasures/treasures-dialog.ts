import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Scenario } from 'src/app/game/model/Scenario';
import { TreasureLabelComponent } from 'src/app/ui/footer/scenario/treasures/label/label';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, TrackUUIDPipe, TreasureLabelComponent],
  selector: 'ghs-scenario-treasures-dialog',
  templateUrl: './treasures-dialog.html',
  styleUrls: ['./treasures-dialog.scss']
})
export class ScenarioTreasuresDialogComponent implements OnInit {
  private ghsManager = inject(GhsManager);
  private dialogRef = inject(DialogRef);

  gameManager: GameManager = gameManager;

  scenario: Scenario | undefined;
  characters: Character[] = [];
  character: Character | undefined;

  treasures: ('G' | number)[] = [];
  treasureIndex: number = -1;
  edition: string = '';
  looted: number[] = [];
  rewardResults: string[][] = [];
  init: boolean = true;

  data: { treasures: ('G' | number)[] | undefined; edition: string | undefined } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    if (!gameManager.game.scenario && (!this.data.treasures || !this.data.edition)) {
      ghsDialogClosingHelper(this.dialogRef);
    } else if (!!this.data && this.data.treasures && this.data.edition) {
      this.treasures = this.data.treasures;
      this.edition = this.data.edition;
    } else if (gameManager.game.scenario) {
      this.scenario = gameManager.game.scenario || gameManager.scenarioManager.createScenario();
      this.edition = this.scenario.edition;
    }
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.scenario = gameManager.game.scenario || gameManager.scenarioManager.createScenario();
    this.characters = gameManager.game.figures
      .filter((figure) => figure instanceof Character && !figure.absent && gameManager.entityManager.isAlive(figure))
      .map((figure) => figure as Character);
    if (this.scenario && (!this.data || !this.data.treasures)) {
      this.edition = this.scenario.edition;
      this.treasures = gameManager.treasureManager.getTreasures(this.scenario, gameManager.game.sections);
    }
    this.looted = [];
    let activeIndex = -1;
    this.treasures.forEach((treasure, index) => {
      if (
        !this.looted.includes(index) &&
        (this.characters.find((character) => gameManager.treasureManager.hasTreasure(character, treasure, index)) ||
          gameManager.game.party.treasures.find((identifier) => identifier.name === '' + treasure && identifier.edition === this.edition))
      ) {
        this.looted.push(index);
      } else {
        activeIndex = index;
      }
    });

    if (
      this.init &&
      this.treasures.length === this.looted.length + 1 &&
      this.treasureIndex !== activeIndex &&
      !this.looted.includes(activeIndex)
    ) {
      this.treasureIndex = activeIndex;
    }

    if (!this.character && this.treasures.length !== this.looted.length) {
      this.character = this.characters.find((figure) => figure.active) || (this.characters.length > 0 && this.characters[0]) || undefined;
    }
  }

  toggleCharacter(character: Character) {
    if (this.character !== character && this.treasures.length !== this.looted.length) {
      this.character = character;
      if (this.treasureIndex !== -1 && this.looted.includes(this.treasureIndex)) {
        this.treasureIndex = -1;
      }
    } else {
      this.character = undefined;
    }
  }

  toggleTreasure(index: number) {
    if (this.treasureIndex !== index) {
      this.treasureIndex = index;
    } else {
      this.treasureIndex = -1;
    }
  }

  removeTreasure(character: Character, treasure: string | number) {
    if (!gameManager.treasureManager.canRemoveScenarioTreasure(character, treasure)) {
      return;
    }
    const parsed = gameManager.treasureManager.parseScenarioTreasure(treasure);
    if (parsed.goal) {
      gameManager.stateManager.before('removeCharTreasure', 'G', this.edition);
    } else {
      gameManager.stateManager.before(
        'removeCharTreasure',
        parsed.number >= 0 ? '' + parsed.number : '???',
        this.edition,
        gameManager.characterManager.characterName(character, true, true)
      );
    }
    const treasureIndex = parsed.goal ? parsed.goalIndex : this.treasures.indexOf(parsed.number);
    this.looted = this.looted.filter((value) => value !== treasureIndex);
    gameManager.treasureManager.removeScenarioTreasure(character, treasure, this.edition);
    gameManager.stateManager.after();
  }

  lootTreasure() {
    if (this.treasureIndex !== -1) {
      this.init = false;
      this.rewardResults = [];
      const treasure = this.treasures[this.treasureIndex];
      if (this.character && treasure && gameManager.treasureManager.canLootScenarioTreasure(this.character, treasure, this.treasureIndex)) {
        gameManager.stateManager.before(
          'lootCharTreasure',
          ('' + treasure).startsWith('G') || +treasure >= 0 ? treasure : '???',
          this.edition,
          gameManager.characterManager.characterName(this.character, true, true)
        );
        this.looted.push(this.treasureIndex);
        this.rewardResults = gameManager.treasureManager.lootScenarioTreasure(this.character, treasure, this.treasureIndex, this.edition);

        gameManager.stateManager.after();
      }
    }
  }
}
