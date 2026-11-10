import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, OnInit, inject, input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { RpgMonsterAction } from 'src/app/game/model/data/RpgMonsterAction';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { SummonState } from 'src/app/game/model/Summon';
import { ActionsComponent } from 'src/app/ui/figures/actions/actions';
import { MonsterRpgActionsDialogComponent } from 'src/app/ui/figures/monster/cards/rpg-actions-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

export class RpgActionView {
  index: number;
  action: RpgMonsterAction;
  groups: RpgStandeeGroup[];
  available: boolean;

  constructor(index: number, action: RpgMonsterAction, groups: RpgStandeeGroup[], available: boolean) {
    this.index = index;
    this.action = action;
    this.groups = groups;
    this.available = available;
  }
}

export class RpgStandeeGroup {
  key: string;
  type: MonsterType;
  number: number | undefined;
  entities: MonsterEntity[];

  constructor(key: string, type: MonsterType, number: number | undefined, entities: MonsterEntity[]) {
    this.key = key;
    this.type = type;
    this.number = number;
    this.entities = entities;
  }
}

@Component({
  imports: [NgClass, GhsLabelDirective, ActionsComponent, PointerInputDirective],
  selector: 'ghs-monster-rpg-actions',
  templateUrl: './rpg-actions.html',
  styleUrls: ['./rpg-actions.scss']
})
export class MonsterRpgActionsComponent implements OnInit {
  private ghsManager = inject(GhsManager);
  private dialog = inject(Dialog);

  readonly inputMonster = input.required<Monster>({ alias: 'monster' });
  get monster(): Monster {
    return this.inputMonster();
  }
  readonly popup = input<boolean>(false);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  MonsterType = MonsterType;

  speeds: AbilityCard[] = [];
  speed: number = -1;
  entities: MonsterEntity[] = [];
  groups: RpgStandeeGroup[] = [];
  selected: string[] = [];
  current: MonsterEntity | undefined;
  actions: RpgActionView[] = [];
  round: boolean = false;
  hidden: boolean = false;
  popupOpen: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.speeds = gameManager.abilityCards(this.monster);
    this.round = gameManager.game.state === GameState.next;
    // hide speed chosen by other clients before round start, same as character initiative
    this.hidden = !this.round && !this.monster.abilityVisible;
    this.speed = this.monster.ability > -1 && !this.hidden ? this.monster.abilities[this.monster.ability] : -1;
    this.entities = this.monster.entities
      .filter((entity) => gameManager.entityManager.isAlive(entity) && entity.summon !== SummonState.new)
      .sort(gameManager.monsterManager.sortEntities);
    if (settingsManager.settings.activeStandees) {
      this.groups = this.entities.map((entity) => new RpgStandeeGroup(entity.type + entity.number, entity.type, entity.number, [entity]));
    } else {
      this.groups = [MonsterType.elite, MonsterType.normal]
        .map(
          (type) =>
            new RpgStandeeGroup(
              type,
              type,
              undefined,
              this.entities.filter((entity) => entity.type === type)
            )
        )
        .filter((group) => group.entities.length);
    }
    this.selected = this.selected.filter((key) => this.groups.some((group) => group.key === key));
    this.current =
      this.round && this.monster.active && settingsManager.settings.activeStandees
        ? this.entities.find((entity) => entity.active)
        : undefined;

    this.actions = [];
    if (this.speed === -1) {
      return;
    }

    const targets = this.targets();
    const views = gameManager.monsterManager.rpgActions(this.monster).map(
      (action, index) =>
        new RpgActionView(
          index,
          action,
          this.groups.filter((group) => group.entities.some((entity) => entity.rpgAction === index)),
          gameManager.monsterManager.rpgActionEntities(this.monster, index, targets).length > 0
        )
    );

    if (this.current && this.current.rpgAction > -1) {
      this.actions = views.filter((view) => view.index === this.current!.rpgAction);
    } else if (this.round && !this.current && views.some((view) => view.groups.length)) {
      this.actions = views.filter((view) => view.groups.length);
    } else {
      this.actions = views;
    }
  }

  targets(): MonsterEntity[] {
    if (this.current) {
      return [this.current];
    }
    return this.selected.length
      ? this.groups.filter((group) => this.selected.includes(group.key)).flatMap((group) => group.entities)
      : this.entities;
  }

  actionTargets(index: number): MonsterEntity[] {
    if (!this.current && !this.selected.length) {
      const unassigned = gameManager.monsterManager.rpgActionEntities(
        this.monster,
        index,
        this.entities.filter((entity) => entity.rpgAction === -1)
      );
      if (unassigned.length) {
        return unassigned;
      }
    }
    return this.targets();
  }

  isSelected(group: RpgStandeeGroup): boolean {
    return this.current ? group.entities.includes(this.current) : this.selected.includes(group.key);
  }

  isAssigned(group: RpgStandeeGroup): boolean {
    return !this.hidden && group.entities.every((entity) => entity.rpgAction > -1);
  }

  isCurrent(group: RpgStandeeGroup): boolean {
    return !!this.current && group.entities.includes(this.current);
  }

  toggleSelect(group: RpgStandeeGroup) {
    if (this.round) {
      return;
    }
    if (this.selected.includes(group.key)) {
      this.selected = this.selected.filter((key) => key !== group.key);
    } else {
      this.selected = [...this.selected, group.key];
    }
    this.update();
  }

  setSpeed(speed: number) {
    if (this.round) {
      return;
    }
    if (this.speed !== speed) {
      gameManager.stateManager.before('setRpgSpeed', 'data.monster.' + this.monster.name, 'data.ability.' + this.speeds[speed].name);
      gameManager.monsterManager.setRpgSpeed(this.monster, speed);
      gameManager.sortFigures();
      gameManager.stateManager.after();
    }
  }

  setAction(view: RpgActionView) {
    if (this.round) {
      return;
    }
    if (view.available) {
      gameManager.stateManager.before('setRpgAction', 'data.monster.' + this.monster.name, view.action.label);
      gameManager.monsterManager.setRpgAction(this.monster, view.index, this.actionTargets(view.index));
      this.selected = [];
      gameManager.stateManager.after();
    }
  }

  openPopup() {
    if (this.popup() || this.popupOpen || !settingsManager.settings.abilities) {
      return;
    }
    this.popupOpen = true;
    this.dialog
      .open(MonsterRpgActionsDialogComponent, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: this.monster
      })
      .closed.subscribe(() => (this.popupOpen = false));
  }
}
