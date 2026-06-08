import { KeyValuePipe, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, effect, inject, input, OnInit, output } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { ActionsComponent } from 'src/app/ui/figures/actions/actions';
import { CardRevealDirective } from 'src/app/ui/helper/CardReveal';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    KeyValuePipe,
    GhsLabelDirective,
    PointerInputDirective,
    CardRevealDirective,
    TrackUUIDPipe,
    ActionComponent,
    ActionsComponent
  ],
  selector: 'ghs-item',
  templateUrl: './item.html',
  styleUrls: ['./item.scss']
})
export class ItemComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  private cdr = inject(ChangeDetectorRef);

  readonly inputItem = input<ItemData>(undefined, { alias: 'item' });

  readonly inputIdentifier = input<Identifier | undefined | false>(undefined, { alias: 'identifier' });
  get identifier(): Identifier | undefined | false {
    return this.inputIdentifier();
  }

  readonly inputFlipped = input<boolean>(false, { alias: 'flipped' });
  readonly reveal = input<boolean>(false);
  readonly count = input<number | '-'>(1);
  readonly slotsMarked = input<string[]>([]);
  readonly slotsBackMarked = input<string[]>([]);
  readonly editionLabel = input<string>('');
  readonly revealed = output<boolean>();
  readonly interactive = input<boolean>(false);
  readonly clickedConsumed = output<boolean>();
  readonly clickedSpent = output<boolean>();
  readonly clickedFlip = output<boolean>();
  readonly clickedSlot = output<number>();
  readonly clickedSlotBack = output<number>();
  readonly clickedPersistent = output<boolean>();

  item: ItemData | undefined;
  flipped: boolean = false;
  fhStyle: boolean = false;
  bb: boolean = false;
  craft: boolean = false;
  edition: string = '';
  slots: Action[] = [];
  slotsBack: Action[] = [];
  idNumber: boolean = false;
  usable: boolean = true;
  fhSpecialCount: number = 0;

  settingsManager: SettingsManager = settingsManager;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    effect(() => {
      this.initItem();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.initItem();
  }

  initItem(): void {
    this.fhStyle = false;
    this.bb = false;
    this.craft = false;
    this.edition = '';
    this.slots = [];
    this.slotsBack = [];

    this.item = this.inputItem();
    this.flipped = this.inputFlipped();
    if (!this.item && this.identifier) {
      this.item = gameManager.itemManager.getItem(this.identifier.name, this.identifier.edition, true);
    }

    if (this.item) {
      if (this.item.edition !== this.editionLabel()) {
        this.edition = this.item.edition;
      }

      if (gameManager.newItemStyle(this.item.edition)) {
        this.fhStyle = true;
      }

      if (this.item.edition === 'bb') {
        this.bb = true;
      }

      if (
        (this.item.resources && Object.values(this.item.resources).some((value) => value)) ||
        (this.item.requiredItems && this.item.requiredItems.length > 0) ||
        (this.item.resourcesAny && this.item.resourcesAny.length > 0)
      ) {
        this.fhStyle = true;
        this.craft = true;
      }

      this.item.actions = this.item.actions || [];

      this.applySlots(this.item.slots, this.slots);
      if (this.item.slotsBack) {
        this.item.actionsBack = this.item.actionsBack || [];
        this.applySlots(this.item.slotsBack, this.slotsBack);
      }

      if (this.item.summon && !this.item.actions.find((action) => action.type === ActionType.summon && action.value === 'summonDataItem')) {
        const action = new Action(ActionType.summon, 'summonDataItem');
        action.valueObject = this.item.summon;
        action.small = true;
        this.item.actions.push(action);
      }

      this.idNumber = typeof this.item.id === 'number';
      this.usable = gameManager.itemManager.itemUsable(this.item);
      this.fhSpecialCount = !!this.item.specialFh && this.item.specialFh.length && this.count() !== '-' ? +this.count() - 1 : 0;
    }
  }

  update() {
    if (this.item) {
      this.usable = gameManager.itemManager.itemUsable(this.item);
    }
  }

  applySlots(slotCount: number, actions: Action[]) {
    if (
      slotCount &&
      !actions.find((action) => action.type === ActionType.card && action.subActions.length > 0 && ('' + action.value).startsWith('slot'))
    ) {
      for (let i = 0; i < slotCount; i++) {
        let action = new Action(ActionType.card, 'slot');
        if (this.fhStyle && i === 0) {
          action = new Action(ActionType.card, 'slotStart');
        } else if (this.fhStyle && i === slotCount - 1) {
          action = new Action(ActionType.card, 'slotEnd');
        }

        if (slotCount > 3) {
          action.small = true;
        }
        actions.push(action);
      }
    }
  }

  applySlotsGrid(slotCount: number, actions: Action[]) {
    if (
      slotCount &&
      !actions.find(
        (action) =>
          action.type === ActionType.grid &&
          action.subActions.length > 0 &&
          action.subActions[0].type === ActionType.card &&
          ('' + action.subActions[0].value).startsWith('slot')
      )
    ) {
      if (slotCount < 5) {
        const action = new Action(ActionType.grid, slotCount);
        for (let i = 0; i < slotCount; i++) {
          if (this.fhStyle && i === 0) {
            action.subActions.push(new Action(ActionType.card, 'slotStart'));
          } else if (this.fhStyle && i === slotCount - 1) {
            action.subActions.push(new Action(ActionType.card, 'slotEnd'));
          } else {
            action.subActions.push(new Action(ActionType.card, 'slot'));
          }
        }
        if (slotCount > 3) {
          action.small = true;
        }
        actions.push(action);
      } else {
        const columns = Math.ceil(slotCount / 3);
        for (let grid = 0; grid < columns; grid++) {
          const slots = grid < columns - 1 ? 3 : slotCount % 3;
          const action = new Action(ActionType.grid, slots);
          if (columns > 1) {
            action.small = true;
          }
          for (let i = 0; i < slots; i++) {
            if (this.fhStyle && i === 0 && grid === 0) {
              action.subActions.push(new Action(ActionType.card, 'slotStart'));
            } else if (this.fhStyle && i === slots - 1 && grid === columns - 1) {
              action.subActions.push(new Action(ActionType.card, 'slotEnd'));
            } else {
              action.subActions.push(new Action(ActionType.card, 'slot'));
            }
          }
          actions.push(action);
        }
      }
    }
  }

  emitRevealed(revealed: boolean) {
    this.revealed.emit(revealed);
  }
}
