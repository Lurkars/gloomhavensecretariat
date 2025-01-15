import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ActionHint } from 'src/app/game/model/data/Action';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Condition, ConditionName, ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';
import { ghsDefaultDialogPositions } from 'src/app/ui/helper/Static';
import { EntityMenuDialogComponent } from '../entity-menu/entity-menu-dialog';
import { MonsterNumberPickerDialog } from '../monster/dialogs/numberpicker-dialog';

@Component({
  standalone: false,
  selector: 'ghs-standee',
  templateUrl: './standee.html',
  styleUrls: ['./standee.scss']
})
export class StandeeComponent implements OnInit, OnDestroy {

  @ViewChild('standee') standee!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  @Input() figure!: Monster | Character | ObjectiveContainer;
  @Input() entity!: MonsterEntity | Summon | ObjectiveEntity;
  Conditions = Condition;
  AttackModifierType = AttackModifierType;
  SummonState = SummonState;
  SummonColor = SummonColor;
  ConditionName = ConditionName;
  ConditionType = ConditionType;
  MonsterType = MonsterType;

  health: number = 0;
  maxHp: number = 0;

  activeConditions: EntityCondition[] = [];
  actionHints: ActionHint[] = [];
  activeIndex: number = -1;
  marker: string = "";
  specialActionsMarker: string[] = [];

  EntityValueFunction = EntityValueFunction;

  constructor(private element: ElementRef, private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  additionalType(): string {
    return this.entity instanceof MonsterEntity ? this.entity.type : (this.entity instanceof Summon ? this.entity.name : "");
  }

  update(): void {
    this.activeConditions = gameManager.entityManager.activeConditions(this.entity, true);
    this.entity.immunities.forEach((immunity) => {
      if (!this.activeConditions.find((entityCondition) => entityCondition.name == immunity)) {
        this.activeConditions.push(new EntityCondition(immunity));
      }
    })
    this.actionHints = [];

    if (settingsManager.settings.standeeStats) {
      this.actionHints = gameManager.actionsManager.calcActionHints(this.figure, this.entity);
    }
    if (this.entity.revealed) {
      const activeFigure = gameManager.game.figures.find((figure) => figure.active);
      if (activeFigure) {
        const activeIndex: number = gameManager.game.figures.indexOf(activeFigure);
        if (activeIndex != -1) {
          if (this.activeIndex == -1) {
            this.activeIndex = activeIndex;
          } else if (this.activeIndex != activeIndex && this.entity.number > 0) {
            this.entity.revealed = false;
          }
        }
      }
    }
    this.marker = (this.entity instanceof MonsterEntity || this.entity instanceof ObjectiveEntity) ? this.entity.marker : "";
    if (this.figure instanceof ObjectiveContainer && this.figure.entities.flatMap((entity) => entity.marker).every((marker, index, self) => self.indexOf(marker) == 0)) {
      this.marker = "";
    }

    this.maxHp = EntityValueFunction(this.entity.maxHealth);

    this.specialActionsMarker = [];
    this.entity.tags.forEach((tag) => {
      if (this.figure instanceof Character && this.figure.name == 'prism' && this.figure.specialActions.find((specialAction) => specialAction.name == tag && specialAction.summon)) {
        if (tag == 'prism_mode') {
          this.specialActionsMarker.push('mode');
        }
      }
    })
  }

  dragHpMove(value: number) {
    if (EntityValueFunction(this.entity.maxHealth) > 0 && (!(this.figure instanceof Monster) || !this.figure.immortal)) {
      this.health = value;
      if (this.entity.health + this.health > EntityValueFunction(this.entity.maxHealth)) {
        this.health = EntityValueFunction(this.entity.maxHealth) - this.entity.health;
      }
    }
  }

  dragHpEnd(value: number) {
    if (this.health != 0 && EntityValueFunction(this.entity.maxHealth) > 0 && (!(this.figure instanceof Monster) || !this.figure.immortal)) {
      let name = this.figure.name;
      if (!name && this.figure instanceof ObjectiveContainer) {
        name = this.figure.title;
        if (!name) {
          name = this.figure.escort ? '%escort%' : '%objective%';
        }
      }
      gameManager.stateManager.before(this.figure.type + "ChangeEntityHp", name, "" + this.entity.number, "" + this.health, this.additionalType());
      gameManager.entityManager.changeHealth(this.entity, this.figure, this.health);

      if (this.figure instanceof Monster && this.figure.entities.every((monsterEntity) => monsterEntity.dead)) {
        if (this.figure.active) {
          gameManager.roundManager.toggleFigure(this.figure);
        }
      }

      gameManager.stateManager.after();
    }
    this.health = 0;
  }

  dragHpCancel(value: number) {
    this.health = 0;
  }

  removeCondition(entityCondition: EntityCondition) {
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "removeCondition"), entityCondition.name, this.entity instanceof MonsterEntity ? 'monster.' + this.entity.type + ' ' : '');
    gameManager.entityManager.removeCondition(this.entity, this.figure, entityCondition, entityCondition.permanent);
    gameManager.stateManager.after();
  }

  removeMarker(marker: string) {
    const markerChar = new Character(gameManager.getCharacterData(marker), 1);
    const markerName = gameManager.characterManager.characterName(markerChar);
    const characterIcon = markerChar.name;
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "removeMarker"), markerName, characterIcon);
    this.entity.markers = this.entity.markers.filter((value) => value != marker);
    gameManager.stateManager.after();
  }

  doubleClick(event: any): void {
    if (this.entity.revealed) {
      this.entity.revealed = false;
    } else if (settingsManager.settings.activeStandees && this.entity instanceof MonsterEntity) {
      gameManager.stateManager.before(this.figure.type + (this.entity.active ? "UnsetEntityActive" : "SetEntityActive"), this.figure.name, "" + this.entity.number, this.additionalType());
      gameManager.entityManager.toggleActive(this.figure, this.entity);
      gameManager.stateManager.after();
    } else if (settingsManager.settings.activeSummons && this.entity instanceof Summon) {
      this.toggleActive();
    }
  }


  toggleActive() {
    if (this.entity instanceof Summon && this.figure instanceof Character) {
      if (this.entity.active) {
        gameManager.stateManager.before("summonInactive", gameManager.characterManager.characterName(this.figure), "data.summon." + this.entity.name);
        if (settingsManager.settings.activeSummons && this.figure.active) {
          gameManager.roundManager.toggleFigure(this.figure);
        } else {
          this.entity.active = false;
        }
        gameManager.stateManager.after();
      } else {
        gameManager.stateManager.before("summonActive", gameManager.characterManager.characterName(this.figure), "data.summon." + this.entity.name);
        const activeSummon = this.figure.summons.find((summon) => summon.active);
        if (settingsManager.settings.activeSummons && this.figure.active && gameManager.entityManager.isAlive(this.entity, true) && (!activeSummon || this.figure.summons.indexOf(activeSummon) < this.figure.summons.indexOf(this.entity))) {
          while (!this.entity.active) {
            gameManager.roundManager.toggleFigure(this.figure);
          }
        } else {
          this.figure.summons.forEach((summon) => summon.active = false);
          this.entity.active = true;
        }
        gameManager.stateManager.after();
      }
    }
  }

  openEntityMenu(event: any): void {
    if (this.entity.number < 0 && this.figure instanceof Monster && this.entity instanceof MonsterEntity) {
      if (settingsManager.settings.randomStandees) {
        const number = gameManager.monsterManager.monsterRandomStandee(this.figure);
        gameManager.stateManager.before("addRandomStandee", "data.monster." + this.figure.name, "monster." + this.entity.type, "" + number);
        this.entity.number = number;
        gameManager.stateManager.after();
      } else {
        this.dialog.open(MonsterNumberPickerDialog, {
          panelClass: ['dialog'],
          data: {
            monster: this.figure,
            type: this.entity.type,
            range: [],
            entity: this.entity,
            entities: this.figure.entities
          },
          positionStrategy: this.overlay.position().flexibleConnectedTo(this.standee).withPositions(ghsDefaultDialogPositions())
        })
      }
    } else {
      const dialogRef = this.dialog.open(EntityMenuDialogComponent, {
        panelClass: ['dialog'],
        data: {
          entity: this.entity,
          figure: this.figure,
          positionElement: this.standee
        },
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.standee).withPositions(ghsDefaultDialogPositions())
      });

      dialogRef.closed.subscribe({
        next: () => {
          if ((this.entity instanceof MonsterEntity || this.entity instanceof ObjectiveEntity) && this.entity.dead) {
            this.element.nativeElement.classList.add('dead');
            gameManager.uiChange.emit();
          }
        }
      })
    }
  }




}