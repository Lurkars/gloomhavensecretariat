import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventCard, EventCardIdentifier, EventCardResult } from 'src/app/game/model/data/EventCard';
import { EventCardDialogComponent } from 'src/app/ui/figures/event/dialog/event-card-dialog';
import { EventCardComponent } from 'src/app/ui/figures/event/event-card';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, EventCardComponent],
  selector: 'ghs-event-card-draw',
  templateUrl: './event-card-draw.html',
  styleUrls: ['./event-card-draw.scss']
})
export class EventCardDrawComponent {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  event: EventCard | undefined;
  globalDraw: boolean = false;
  requirementWarning: boolean = false;
  result: EventCardResult = new EventCardResult();

  settingsManager: SettingsManager = settingsManager;

  data: { edition: string; type: string; cardId: string | undefined } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      if (this.globalDraw && !gameManager.game.eventDraw) {
        this.dialogRef.close();
      }
    });
    const deck = gameManager.game.party.eventDecks[this.data.type];
    this.globalDraw = gameManager.game.eventDraw !== undefined;
    if (deck) {
      this.event = gameManager.eventCardManager.getEventCardForEdition(this.data.edition, this.data.type, this.data.cardId || deck[0]);
    }
    if (!this.event) {
      console.debug('No event card found for', this.data.edition, this.data.type);
      this.dialogRef.close();
    }
    this.resetResult();

    if (this.event && this.event.requirement && this.event.requirement.partyAchievement) {
      this.requirementWarning = !gameManager.game.party.achievementsList.includes(this.event.requirement.partyAchievement);
    }
  }

  fortellerLink(): string | undefined {
    return this.event && gameManager.editionManager.fortellerLink(this.event.edition, this.event.forteller);
  }

  resetResult() {
    const stored = this.event
      ? gameManager.eventCardManager.lastEventCardResult(this.event.edition, this.event.type, this.event.cardId)
      : undefined;
    this.result = new EventCardResult(-1, [], stored ? [...(stored.checks || [])] : [], false);
  }

  select(change: EventCardIdentifier | EventCardResult) {
    this.result = new EventCardResult(change.selected, change.subSelections, change.checks, change.attack);
  }

  cancel() {
    if (this.event && gameManager.eventCardManager.canCancelEventDraw()) {
      gameManager.stateManager.before('eventDraw.cancel', this.event.edition, this.event.type, this.event.cardId);
      gameManager.eventCardManager.cancelEventDraw();
      gameManager.stateManager.after();
    }
    ghsDialogClosingHelper(this.dialogRef);
  }

  accept(apply: boolean = true) {
    if (this.event && gameManager.eventCardManager.canAcceptEvent(this.event, this.result.selected, apply)) {
      gameManager.stateManager.before('eventDraw.accept', this.event.edition, this.event.type, this.event.cardId);
      const result =
        gameManager.eventCardManager.acceptEvent(
          this.event,
          this.result.selected,
          this.result.subSelections,
          this.result.checks,
          this.result.attack,
          apply
        ) || [];
      gameManager.stateManager.after(settingsManager.settings.animations ? 1000 : 250);
      ghsDialogClosingHelper(this.dialogRef, result.length ? result : undefined);
    }
  }

  drawNew() {
    if (this.event && gameManager.eventCardManager.canDrawNewEvent(this.event.type, this.event.cardId)) {
      const edition = this.event.edition;
      const type = this.event.type;
      gameManager.stateManager.before('eventDraw.new', this.event.edition, this.event.type, this.event.cardId);
      const next = gameManager.eventCardManager.drawNewEvent(type, this.event.cardId);
      this.event = next ? gameManager.eventCardManager.getEventCardForEdition(edition, type, next) : undefined;
      this.resetResult();
      this.requirementWarning = false;
      if (this.event && this.event.requirement && this.event.requirement.partyAchievement) {
        this.requirementWarning = !gameManager.game.party.achievementsList.includes(this.event.requirement.partyAchievement);
      }
      gameManager.stateManager.after();
    }
  }

  showEventCard(eventCard: EventCard) {
    this.dialog
      .open(EventCardDialogComponent, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: {
          eventCard: eventCard,
          interactive: true,
          id:
            this.result.selected !== -1
              ? new EventCardIdentifier(
                  eventCard.cardId,
                  eventCard.edition,
                  eventCard.type,
                  this.result.selected,
                  this.result.subSelections,
                  this.result.checks,
                  this.result.attack,
                  false
                )
              : undefined
        }
      })
      .closed.subscribe({
        next: (result) => {
          if (result instanceof EventCardResult) {
            this.select(result);
            gameManager.triggerUiChange();
          }
        }
      });
  }
}
