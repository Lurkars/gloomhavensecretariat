import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierDeck, AttackResult } from 'src/app/game/model/data/AttackModifier';
import { EventCardAttack, EventCardAttackTarget, EventCardEffect } from 'src/app/game/model/data/EventCard';
import { OutpostAttackResource } from 'src/app/game/model/data/OutpostAttack';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { AttackModifierComponent } from 'src/app/ui/figures/attackmodifier/attackmodifier';
import { AttackModiferDeckChange, AttackModifierDeckComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { EventCardAttackComponent } from 'src/app/ui/figures/event/attack/event-card-attack';
import { EventCardEffectComponent } from 'src/app/ui/figures/event/effect/event-card-effect';
import { Building } from 'src/app/ui/figures/party/buildings/buildings';
import { BuildingsListComponent } from 'src/app/ui/figures/party/buildings/list/buildings-list';
import { PartySheetDialogComponent } from 'src/app/ui/figures/party/party-sheet-dialog';
import { WorldMapComponent } from 'src/app/ui/figures/party/world-map/world-map';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsFloorPipe, GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    FormsModule,
    DragDropModule,
    GhsLabelDirective,
    GhsTooltipDirective,
    PointerInputDirective,
    GhsRangePipe,
    GhsFloorPipe,
    TrackUUIDPipe,
    AttackModifierDeckComponent,
    AttackModifierComponent,
    EventCardAttackComponent,
    EventCardEffectComponent,
    BuildingsListComponent
  ],
  selector: 'ghs-outpost-attack',
  templateUrl: './outpost-attack.html',
  styleUrls: ['./outpost-attack.scss']
})
export class OutpostAttackComponent implements OnInit {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  private cdr = inject(ChangeDetectorRef);

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  EntityValueFunction = EntityValueFunction;
  attack: EventCardAttack = new EventCardAttack(50, 4, new EventCardAttackTarget(), '', '', []);
  defaultAttack: EventCardAttack | undefined;
  manualAttackValue: number = 50;
  manualTargetNumber: number = 4;
  townGuardDeck: AttackModifierDeck = new AttackModifierDeck();
  allBuildings: Building[] = [];
  buildings: Building[] = [];
  disabledBuildings: Building[] = [];

  factor: 'advantage' | 'disadvantage' | false = false;

  lowerBoundary: number = 0;
  upperBoundary: number = 0;
  parity: 'even' | 'odd' | 0 = 0;
  level: 'low' | 'high' | 0 = 0;
  distance: 'previousTarget' | string | WorldMapCoordinates | undefined;
  desc: boolean = false;

  barracks: boolean = false;
  soldiers: number = 0;
  moraleDefense: number = 0;
  attacks: number = 0;
  attackResult: AttackResult | undefined;
  resources: OutpostAttackResource[] = [];

  private closing: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    const model = gameManager.game.party.outpostAttack;
    if (!model) {
      if (!this.closing) {
        this.closing = true;
        ghsDialogClosingHelper(this.dialogRef);
      }
      return;
    }

    const townGuardDeck = gameManager.outpostAttackManager.townGuardDeck();
    if (!townGuardDeck) {
      console.warn('Invalid state, no Town Guard Deck found!');
      this.dialogRef.close();
      return;
    }
    this.townGuardDeck = townGuardDeck;

    this.allBuildings = gameManager.outpostAttackManager.buildings();
    const byName = (name: string) => this.allBuildings.find((building) => building.model.name === name);
    this.buildings = model.buildings.map(byName).filter((building) => !!building) as Building[];
    this.disabledBuildings = model.others.map(byName).filter((building) => !!building) as Building[];

    this.defaultAttack = model.attack;
    this.attack = gameManager.outpostAttackManager.attack() || this.attack;
    this.manualAttackValue = model.manualAttackValue;
    this.manualTargetNumber = model.manualTargetNumber;
    this.lowerBoundary = model.target.lowerBoundary || 0;
    this.upperBoundary = model.target.upperBoundary || 0;
    this.parity = model.target.parity || 0;
    this.level = model.target.level || 0;
    this.distance = model.target.distance || undefined;
    this.desc = model.target.desc;

    const barracks = gameManager.outpostAttackManager.barracksBonus();
    this.barracks = !!barracks && barracks.available;
    this.factor = gameManager.outpostAttackManager.factor();
    this.soldiers = model.soldiers;
    this.moraleDefense = gameManager.outpostAttackManager.moraleDefense();
    this.attacks = model.attacks;
    this.attackResult = gameManager.outpostAttackManager.result(this.townGuardDeck);
    this.resources = model.resources;
  }

  private change(valid: boolean, apply: () => void, ...info: (string | number)[]) {
    if (!valid) {
      return;
    }
    gameManager.stateManager.before(...info);
    apply();
    gameManager.stateManager.after();
  }

  beforeTownGuardDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before('updateAttackModifierDeck.' + change.type, 'party.campaign.townGuard', ...change.values);
    gameManager.outpostAttackManager.beforeDraw(change.deck);
  }

  afterTownGuardDeck(change: AttackModiferDeckChange) {
    this.townGuardDeck = change.deck;
    gameManager.outpostAttackManager.afterDraw(change.deck, change.type.startsWith('draw'));
    gameManager.stateManager.after();
  }

  toggleAttackResult() {
    this.change(
      gameManager.outpostAttackManager.canToggleResult(this.townGuardDeck),
      () => gameManager.outpostAttackManager.toggleResult(this.townGuardDeck),
      'outpostAttack.result'
    );
  }

  nextTarget() {
    const target = gameManager.outpostAttackManager.target();
    const state = gameManager.outpostAttackManager.targetState(this.townGuardDeck);
    if (target && state) {
      this.change(
        gameManager.outpostAttackManager.canAttackTarget(this.townGuardDeck),
        () => gameManager.outpostAttackManager.attackTarget(this.townGuardDeck),
        'buildingAttacked.' + state,
        target.data.id,
        target.data.name
      );
    }
  }

  toggleSoldier(soldier: number) {
    this.change(
      gameManager.outpostAttackManager.canToggleSoldier(soldier),
      () => gameManager.outpostAttackManager.toggleSoldier(soldier),
      'outpostAttack.soldiers',
      this.soldiers === soldier ? soldier - 1 : soldier
    );
  }

  toggleResource(index: number) {
    this.change(
      gameManager.outpostAttackManager.canToggleResource(index),
      () => gameManager.outpostAttackManager.toggleResource(index),
      this.resources[index] && this.resources[index].enabled ? 'outpostAttack.resource.disable' : 'outpostAttack.resource.enable'
    );
  }

  applyManual() {
    this.change(
      gameManager.outpostAttackManager.canSetManual(+this.manualAttackValue, +this.manualTargetNumber),
      () => gameManager.outpostAttackManager.setManual(+this.manualAttackValue, +this.manualTargetNumber),
      'outpostAttack.manual',
      +this.manualAttackValue,
      +this.manualTargetNumber
    );
  }

  applyFilter() {
    const target: Partial<EventCardAttackTarget> = {
      lowerBoundary: +this.lowerBoundary || 0,
      upperBoundary: +this.upperBoundary || 0,
      parity: this.parity || 0,
      level: this.level || 0,
      distance: this.distance || undefined,
      desc: this.desc
    };
    this.change(
      gameManager.outpostAttackManager.canSetTarget(target),
      () => gameManager.outpostAttackManager.setTarget(target),
      'outpostAttack.target'
    );
  }

  targetDistance(building: Building): number {
    return gameManager.outpostAttackManager.distance(building);
  }

  randomize() {
    this.change(
      gameManager.outpostAttackManager.canRandomize(),
      () => gameManager.outpostAttackManager.randomize(),
      'outpostAttack.randomize'
    );
  }

  dropBuildings(event: CdkDragDrop<Building[]>) {
    this.moveBuilding(
      event.container === event.previousContainer ? 'buildings' : 'others',
      event.previousIndex,
      'buildings',
      event.currentIndex
    );
  }

  dropDisabledBuildings(event: CdkDragDrop<Building[]>) {
    this.moveBuilding(
      event.container === event.previousContainer ? 'others' : 'buildings',
      event.previousIndex,
      'others',
      event.currentIndex
    );
  }

  private moveBuilding(fromList: 'buildings' | 'others', fromIndex: number, toList: 'buildings' | 'others', toIndex: number) {
    this.change(
      gameManager.outpostAttackManager.canMoveBuilding(fromList, fromIndex, toList, toIndex),
      () => gameManager.outpostAttackManager.moveBuilding(fromList, fromIndex, toList, toIndex),
      'outpostAttack.order'
    );
  }

  partySheet() {
    this.dialog.open(PartySheetDialogComponent, {
      panelClass: ['dialog-invert'],
      data: gameManager.editionManager.currentEdition()
    });
  }

  worldMap(pick: boolean = false) {
    this.dialog
      .open(WorldMapComponent, {
        panelClass: ['fullscreen-panel'],
        backdropClass: ['fullscreen-backdrop'],
        data: { edition: gameManager.editionManager.currentEdition(), pick: pick }
      })
      .closed.subscribe({
        next: (result) => {
          if (pick) {
            this.distance = result ? (result as WorldMapCoordinates) : undefined;
            this.applyFilter();
            this.cdr.markForCheck();
          }
        }
      });
  }

  resetDistance() {
    this.distance = undefined;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  close(finish: boolean = false) {
    this.closing = true;
    if (!finish) {
      ghsDialogClosingHelper(this.dialogRef);
      return;
    }
    let resources: EventCardEffect[] = [];
    if (gameManager.outpostAttackManager.canFinish()) {
      gameManager.stateManager.before('outpostAttack.finish');
      resources = gameManager.outpostAttackManager.finish();
      gameManager.stateManager.after();
    }
    ghsDialogClosingHelper(this.dialogRef, resources);
  }
}
