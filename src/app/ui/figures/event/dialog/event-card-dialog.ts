import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { EventCard, EventCardIdentifier, EventCardResult } from 'src/app/game/model/data/EventCard';
import { EventCardComponent } from 'src/app/ui/figures/event/event-card';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, PointerInputDirective, EventCardComponent, GhsTooltipDirective],
  selector: 'ghs-event-card-dialog',
  templateUrl: './event-card-dialog.html',
  styleUrls: ['./event-card-dialog.scss']
})
export class EventCardDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);

  eventCard: EventCard;
  interactive: boolean;
  spoiler: boolean;
  id: EventCardIdentifier | undefined;

  result: EventCardResult | undefined;

  flipped: boolean = false;

  opened: boolean = false;

  gameManager: GameManager = gameManager;

  data: { eventCard: EventCard; interactive: boolean; spoiler: boolean; id: EventCardIdentifier | undefined } = inject(DIALOG_DATA);

  constructor() {
    this.eventCard = this.data.eventCard;
    this.interactive = this.data.interactive;
    this.spoiler = this.data.spoiler;
    this.id = this.data.id;
    if (!!this.id) {
      this.flipped = true;
    }
  }

  ngOnInit(): void {
    this.opened = true;
  }

  select(change: EventCardIdentifier) {
    if (this.id && !this.flipped) {
      return;
    }
    this.result = new EventCardResult(change.selected, change.subSelections, change.checks, change.attack);
  }

  toggleFlip(event: PointerEvent) {
    this.flipped = !this.flipped;
    event.stopPropagation();
    event.preventDefault();
  }

  close() {
    this.opened = false;
    setTimeout(
      () => {
        this.dialogRef.close(this.result);
      },
      settingsManager.settings.animations ? 1000 * settingsManager.settings.animationSpeed : 0
    );
  }
}
