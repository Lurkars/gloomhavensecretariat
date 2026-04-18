import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventCard, EventCardIdentifier } from 'src/app/game/model/data/EventCard';
import { EventCardDialogComponent } from 'src/app/ui/figures/event/dialog/event-card-dialog';
import { EventCardComponent } from 'src/app/ui/figures/event/event-card';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, EventCardComponent],
  selector: 'ghs-event-card-draw',
  templateUrl: './event-card-draw.html',
  styleUrls: ['./event-card-draw.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCardDrawComponent {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  event: EventCard | undefined;
  selected: number = -1;
  subSelections: number[] = [];
  checks: number[] = [];
  globalDraw: boolean = false;
  requirementWarning: boolean = false;
  attack: boolean = false;

  settingsManager: SettingsManager = settingsManager;

  data: { edition: string; type: string; cardId: string | undefined } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      if (this.globalDraw && !gameManager.game.eventDraw) {
        this.dialogRef.close();
      }
    });
    const deck = gameManager.game.party.eventDecks[this.data.type];
    this.globalDraw = gameManager.game.eventDraw != undefined;
    if (deck) {
      this.event = gameManager.eventCardManager.getEventCardForEdition(this.data.edition, this.data.type, this.data.cardId || deck[0]);
    }
    if (!this.event) {
      console.debug('No event card found for', this.data.edition, this.data.type);
      this.dialogRef.close();
    }

    if (this.event && this.event.requirement && this.event.requirement.partyAchievement) {
      this.requirementWarning = !gameManager.game.party.achievementsList.includes(this.event.requirement.partyAchievement);
    }
  }

  select(change: EventCardIdentifier) {
    this.selected = change.selected;
    this.subSelections = change.subSelections;
    this.checks = change.checks;
    this.attack = change.attack;
  }

  cancel() {
    gameManager.stateManager.before('eventDraw.cancel');
    gameManager.game.eventDraw = undefined;
    gameManager.stateManager.after();
    ghsDialogClosingHelper(this.dialogRef);
  }

  accept(apply: boolean = true) {
    if (this.event && (this.selected != -1 || !apply)) {
      gameManager.stateManager.before('eventDraw.accept');
      gameManager.game.eventDraw = undefined;
      const result = gameManager.eventCardManager.applyEvent(
        this.event,
        this.selected,
        this.subSelections,
        this.checks,
        gameManager.game.scenario != undefined && gameManager.roundManager.firstRound,
        this.attack,
        apply
      );
      gameManager.stateManager.after(settingsManager.settings.animations ? 1000 : 250);
      ghsDialogClosingHelper(this.dialogRef, result.length ? result : undefined);
    }
  }

  drawNew() {
    if (this.event) {
      const edition = this.event.edition;
      const type = this.event.type;
      const cardId = this.event.cardId;
      gameManager.stateManager.before('eventDraw.new');
      gameManager.eventCardManager.removeEvent(type, cardId);
      const deck = gameManager.game.party.eventDecks[type];
      if (deck) {
        this.event = gameManager.eventCardManager.getEventCardForEdition(edition, type, deck[0]);
        if (this.event) {
          this.requirementWarning = false;
          if (this.event.requirement && this.event.requirement.partyAchievement) {
            this.requirementWarning = !gameManager.game.party.achievementsList.includes(this.event.requirement.partyAchievement);
          }
        }
      }
      gameManager.eventCardManager.addEvent(type, cardId);
      gameManager.stateManager.after();
    }
  }

  showEventCard(eventCard: EventCard) {
    this.dialog.open(EventCardDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: {
        eventCard: eventCard,
        interactive: true,
        id:
          this.selected != -1
            ? new EventCardIdentifier(
                eventCard.cardId,
                eventCard.edition,
                eventCard.type,
                this.selected,
                this.subSelections,
                this.checks,
                this.attack,
                false
              )
            : undefined
      }
    });
  }
}
