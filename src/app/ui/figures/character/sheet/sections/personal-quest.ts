import { Dialog } from '@angular/cdk/dialog';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { PersonalQuestViewDialog } from 'src/app/ui/figures/character/sheet/personal-quest-card/personal-quest-view-dialog';
import { PersonalQuestDrawDialog } from 'src/app/ui/figures/character/sheet/personal-quest-draw-dialog';
import { CharacterRetirementDialog } from 'src/app/ui/figures/character/sheet/retirement-dialog';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { TrialDialogComponent } from 'src/app/ui/figures/trials/dialog/trial-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, NgTemplateOutlet, GhsLabelDirective, GhsRangePipe, GhsTooltipDirective, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-character-sheet-personal-quest',
  templateUrl: 'personal-quest.html',
  styleUrls: ['../../../sheet.scss', './personal-quest.scss']
})
export class CharacterSheetPersonalQuestComponent extends CharacterSheetSection implements OnInit {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  readonly fh = input<boolean>(false);

  EntityValueFunction = EntityValueFunction;
  personalQuest: PersonalQuest | undefined;
  retireEnabled: boolean = false;

  constructor() {
    super();
    this.ghsManager.uiChangeEffect(() => {
      if (gameManager.game.scenario) {
        this.retireEnabled = false;
      } else if (this.personalQuest) {
        this.refreshPersonalQuestRetireState();
      } else {
        this.retireEnabled = true;
      }
    });
  }

  ngOnInit(): void {
    if (this.character.progress.personalQuest) {
      this.personalQuest = gameManager.personalQuestManager.personalQuestByCard(
        gameManager.currentEdition(),
        this.character.progress.personalQuest
      );
      if (!this.character.progress.personalQuestProgress) {
        this.character.progress.personalQuestProgress = [];
      }
    }

    if (!gameManager.game.scenario) {
      if (this.personalQuest) {
        this.refreshPersonalQuestRetireState();
      } else {
        this.retireEnabled = true;
      }
    }
  }

  setPersonalQuest(event: any) {
    if (this.character.progress.personalQuest !== event.target.value) {
      gameManager.stateManager.before('setPQ', this.characterName, event.target.value);
      this.character.progress.personalQuest = event.target.value;
      this.character.progress.personalQuestProgress = [];
      this.character.progress.personalQuestAutotrack = false;
      this.personalQuest = gameManager.personalQuestManager.personalQuestByCard(
        gameManager.currentEdition(),
        this.character.progress.personalQuest
      );
      if (this.personalQuest) {
        this.character.progress.personalQuest = this.personalQuest.cardId;
        this.retireEnabled = this.personalQuest.requirements.every(
          (requirement, i) => this.getPersonalQuestCount(i) >= EntityValueFunction(requirement.counter)
        );
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

    if (this.character.progress.personalQuestProgress[index] === value) {
      value--;
    }

    gameManager.stateManager.before('setPQProgress', this.characterName, index + 1, value);
    this.character.progress.personalQuestProgress[index] = value;

    if (!!this.personalQuest) {
      this.personalQuest.requirements.forEach((requirement, i) => {
        if (
          !!requirement.requires &&
          requirement.requires.some(
            (j) =>
              !!this.personalQuest &&
              this.character.progress.personalQuestProgress[j - 1] < EntityValueFunction(this.personalQuest.requirements[j - 1].counter)
          )
        ) {
          this.character.progress.personalQuestProgress[i] = 0;
        }
      });
    }
    gameManager.stateManager.after();

    if (!gameManager.game.scenario) {
      this.refreshPersonalQuestRetireState(true);
    }
  }

  refreshPersonalQuestRetireState(openDialog: boolean = false) {
    const retiredEnabled = this.retireEnabled;
    if (this.personalQuest) {
      this.retireEnabled = this.personalQuest.requirements.every(
        (requirement, i) => this.getPersonalQuestCount(i) >= EntityValueFunction(requirement.counter)
      );
    }

    if (
      openDialog &&
      !retiredEnabled &&
      this.retireEnabled &&
      settingsManager.settings.applyRetirement &&
      gameManager.game.party.campaignMode
    ) {
      this.retire(false, true);
    }
  }
  personalQuestAutotrackSupported(): boolean {
    return (
      !!this.personalQuest &&
      this.personalQuest.requirements.some((requirement, i) =>
        gameManager.personalQuestManager.personalQuestAutotrackSupported(this.personalQuest!, i)
      )
    );
  }
  personalQuestRequirementAutotracked(index: number): boolean {
    return (
      this.character.progress.personalQuestAutotrack &&
      !!this.personalQuest &&
      gameManager.personalQuestManager.personalQuestAutotrackSupported(this.personalQuest, index)
    );
  }
  togglePersonalQuestAutotrack() {
    gameManager.stateManager.before(
      this.character.progress.personalQuestAutotrack ? 'unsetPQAutotrack' : 'setPQAutotrack',
      this.characterName
    );
    this.character.progress.personalQuestAutotrack = !this.character.progress.personalQuestAutotrack;
    gameManager.stateManager.after();
  }
  drawPersonalQuest() {
    this.dialog
      .open(PersonalQuestDrawDialog, {
        panelClass: ['dialog'],
        data: this.character
      })
      .closed.subscribe({
        next: (cardId) => {
          if (typeof cardId === 'string' && cardId) {
            this.setPersonalQuest({ target: { value: cardId } });
          }
        }
      });
  }
  openPersonalQuestCard() {
    if (this.personalQuest) {
      this.dialog.open(PersonalQuestViewDialog, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: this.personalQuest
      });
    }
  }
  getPersonalQuestCount(i: number): number {
    if (!this.personalQuest || i < 0 || i >= this.personalQuest.requirements.length) {
      return 0;
    }
    return gameManager.personalQuestManager.personalQuestRequirementCount(this.character, this.personalQuest, i);
  }
  isPersonalQuestCheckboxChecked(index: number, bit: number): boolean {
    return (this.character.progress.personalQuestProgress[index] & (1 << bit)) !== 0;
  }
  setPersonalQuestCheckboxProgress(index: number, bit: number) {
    this.setPersonalQuestProgress(index, this.character.progress.personalQuestProgress[index] ^ (1 << bit));
  }
  retire(force: boolean = false, dialogOnly: boolean = false) {
    if (force || this.retireEnabled) {
      if (settingsManager.settings.applyRetirement && gameManager.game.party.campaignMode) {
        this.dialog
          .open(CharacterRetirementDialog, {
            panelClass: ['dialog'],
            data: this.character
          })
          .closed.subscribe({
            next: (retired) => {
              const dialogRef = this.dialogRef();
              if (retired && dialogRef) {
                ghsDialogClosingHelper(dialogRef);
              }
            }
          });
      } else if (!dialogOnly) {
        const dialogRef = this.dialogRef();
        if (dialogRef) {
          ghsDialogClosingHelper(dialogRef);
        }
        gameManager.stateManager.before(this.character.progress.retired ? 'setRetired' : 'unsetRetired', this.characterName);
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
    return (
      this.personalQuest !== undefined &&
      this.personalQuest.requirements[index] !== undefined &&
      this.personalQuest.requirements[index].requires &&
      this.personalQuest.requirements[index].requires.every(
        (requireIndex) =>
          this.personalQuest &&
          this.getPersonalQuestCount(requireIndex - 1) >= EntityValueFunction(this.personalQuest.requirements[requireIndex - 1].counter)
      )
    );
  }
  openTrial() {
    if (this.character.progress.trial) {
      this.dialog.open(TrialDialogComponent, {
        panelClass: ['fullscreen-panel'],
        data: {
          edition: this.character.progress.trial.edition,
          trial: +this.character.progress.trial.name
        }
      });
    }
  }
  setTrial(event: any) {
    event.target.classList.add('error');
    let trial = +event.target.value;
    if (settingsManager.settings.fhSecondEdition) {
      trial = gameManager.trialsManager.cardIdSecondPrinting(trial);
    }
    if (!this.character.progress.trial || this.character.progress.trial.name !== '' + trial) {
      const editionData = gameManager.editionData.find(
        (editionData) => editionData.edition === gameManager.currentEdition() && editionData.trials && editionData.trials.length
      );
      if (editionData) {
        const trialCard = editionData.trials.find(
          (trialCard) => trialCard.cardId === trial && trialCard.edition === gameManager.currentEdition()
        );
        if (trialCard) {
          event.target.classList.remove('error');
          event.target.classList.add('warning');
          if (
            !gameManager.game.figures.find(
              (figure) =>
                figure instanceof Character &&
                figure.progress.trial &&
                figure.progress.trial.edition === gameManager.currentEdition() &&
                figure.progress.trial.name === '' + trial
            )
          ) {
            gameManager.stateManager.before('setTrial', this.characterName, event.target.value);
            this.character.progress.trial = new Identifier(trial, gameManager.currentEdition());
            const currentTrialIndex = Math.max(
              ...gameManager.game.figures
                .filter((figure) => figure instanceof Character)
                .map((character) =>
                  editionData.trials.find(
                    (trialCard) =>
                      character.progress.trial &&
                      trialCard.cardId === +character.progress.trial.name &&
                      trialCard.edition === character.progress.trial.edition
                  )
                )
                .map((trialCard) => (trialCard ? editionData.trials.indexOf(trialCard) : -1))
            );
            if (!gameManager.game.party.trials || gameManager.game.party.trials !== currentTrialIndex) {
              gameManager.game.party.trials = currentTrialIndex;
            }
            event.target.classList.remove('warning');
            gameManager.stateManager.after();
          } else if (this.character.progress.trial) {
            trial = settingsManager.settings.fhSecondEdition
              ? gameManager.trialsManager.cardIdSecondPrinting(+this.character.progress.trial.name)
              : +this.character.progress.trial.name;
            event.target.value = trial;
          }
        }
      }
    }
  }
}
