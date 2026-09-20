import { Dialog, DIALOG_DATA } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { Character } from 'src/app/game/model/Character';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { PersonalQuestCardComponent } from 'src/app/ui/figures/character/sheet/personal-quest-card/personal-quest-card';
import { PersonalQuestViewDialog } from 'src/app/ui/figures/character/sheet/personal-quest-card/personal-quest-view-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, TrackUUIDPipe, PersonalQuestCardComponent],
  selector: 'ghs-personal-quest-setup',
  templateUrl: './personal-quest-setup.html',
  styleUrls: ['./personal-quest-setup.scss']
})
export class PersonalQuestSetupDialog implements OnInit {
  private ghsManager = inject(GhsManager);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;
  edition: string;
  editions: string[] = [];
  personalQuests: PersonalQuest[] = [];

  data: { edition: string } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.editions = gameManager.editions();
    this.edition = this.data.edition || this.editions[0] || '';
  }

  ngOnInit(): void {
    this.update();
  }

  selectEdition(edition: string) {
    this.edition = edition;
    this.update();
  }

  update() {
    this.personalQuests = gameManager.personalQuestManager
      .personalQuestsForEdition(this.edition)
      .sort((a, b) =>
        a.altId && b.altId
          ? a.altId.localeCompare(b.altId, undefined, { numeric: true })
          : a.cardId.localeCompare(b.cardId, undefined, { numeric: true })
      );
  }

  unlocked(personalQuest: PersonalQuest): boolean {
    return gameManager.personalQuestManager.personalQuestUnlocked(personalQuest);
  }

  gated(personalQuest: PersonalQuest): boolean {
    if (personalQuest.unlockBuilding) {
      return true;
    }
    return this.personalQuests.some((pq) => pq.unlockPQ === personalQuest.cardId || pq.unlockPQ === personalQuest.altId);
  }

  picked(personalQuest: PersonalQuest): Character | undefined {
    return gameManager.game.figures.find(
      (figure) =>
        figure instanceof Character &&
        (figure.progress.personalQuest === personalQuest.cardId || figure.progress.personalQuest === personalQuest.altId)
    ) as Character | undefined;
  }

  fulfilledBy(personalQuest: PersonalQuest): string | undefined {
    return gameManager.game.party.retirements.find(
      (retirement) =>
        retirement.edition === personalQuest.edition &&
        retirement.progress &&
        (retirement.progress.personalQuest === personalQuest.cardId || retirement.progress.personalQuest === personalQuest.altId)
    )?.name;
  }

  toggleable(personalQuest: PersonalQuest): boolean {
    return this.gated(personalQuest) && !this.picked(personalQuest) && !this.fulfilledBy(personalQuest);
  }

  toggleUnlock(personalQuest: PersonalQuest) {
    if (!this.toggleable(personalQuest)) {
      return;
    }

    if (this.unlocked(personalQuest)) {
      gameManager.stateManager.before('lockPersonalQuest', personalQuest.edition, personalQuest.cardId);
      gameManager.personalQuestManager.lockPersonalQuest(personalQuest.edition, personalQuest.cardId);
    } else {
      gameManager.stateManager.before('unlockPersonalQuest', personalQuest.edition, personalQuest.cardId);
      gameManager.personalQuestManager.unlockPersonalQuest(personalQuest.edition, personalQuest.cardId);
    }
    gameManager.stateManager.after();
  }

  show(personalQuest: PersonalQuest) {
    this.dialog.open(PersonalQuestViewDialog, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: personalQuest
    });
  }
}
