import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventCard, EventCardIdentifier } from 'src/app/game/model/data/EventCard';
import { EventCardComponent } from 'src/app/ui/figures/event/event-card';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, PointerInputDirective, EventCardComponent],
  selector: 'ghs-event-card-dialog',
  templateUrl: './event-card-dialog.html',
  styleUrls: ['./event-card-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCardDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);

  eventCard: EventCard;
  interactive: boolean;
  spoiler: boolean;
  id: EventCardIdentifier | undefined;

  opened: boolean = false;

  gameManager: GameManager = gameManager;

  data: { eventCard: EventCard; interactive: boolean; spoiler: boolean; id: EventCardIdentifier | undefined } = inject(DIALOG_DATA);

  constructor() {
    this.eventCard = this.data.eventCard;
    this.interactive = this.data.interactive;
    this.spoiler = this.data.spoiler;
    this.id = this.data.id;
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(
      () => {
        this.dialogRef.close();
      },
      settingsManager.settings.animations ? 1000 * settingsManager.settings.animationSpeed : 0
    );
  }
}
