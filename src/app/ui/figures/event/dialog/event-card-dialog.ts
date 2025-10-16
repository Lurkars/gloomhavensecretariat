import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventCard, EventCardIdentifier } from 'src/app/game/model/data/EventCard';

@Component({
  standalone: false,
  selector: 'ghs-event-card-dialog',
  templateUrl: './event-card-dialog.html',
  styleUrls: ['./event-card-dialog.scss'],
})
export class EventCardDialogComponent implements OnInit {

  eventCard: EventCard;
  interactive: boolean;
  spoiler: boolean;
  id: EventCardIdentifier | undefined;

  opened: boolean = false;

  gameManager: GameManager = gameManager;

  constructor(@Inject(DIALOG_DATA) data: { eventCard: EventCard, interactive: boolean, spoiler: boolean, id: EventCardIdentifier | undefined }, private dialogRef: DialogRef) {
    this.eventCard = data.eventCard;
    this.interactive = data.interactive;
    this.spoiler = data.spoiler;
    this.id = data.id;
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(() => {
      this.dialogRef.close();
    }, settingsManager.settings.animations ? 1000 * settingsManager.settings.animationSpeed : 0);
  }
}