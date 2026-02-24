import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ActionHint } from 'src/app/game/model/data/Action';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Condition, ConditionName, ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ObjectiveData } from 'src/app/game/model/data/ObjectiveData';
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
export class StandeeComponent implements OnInit {

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

  entityHealth: number = 0;
  health: number = 0;
  maxHp: number = 0;

  activeConditions: EntityCondition[] = [];
  actionHints: ActionHint[] = [];
  activeIndex: number = -1;
  activeTurn: boolean = false;
  marker: string = "";
  specialActionsMarker: string[] = [];
  objectiveData: ObjectiveData | undefined;
  entityBorderClasses: Record<string, boolean> = {};
  entityTypeClass: string = '';
  standeeClasses: Record<string, boolean> = {};
  numberClasses: string = '';
  numberDisplay: string | number = '?';
  summonStateClasses: Record<string, boolean> = {};
  healthClasses: Record<string, boolean> = {};
  conditionCenterBase: boolean = false;
  monsterSummonClasses: Record<string, boolean> = {};

  EntityValueFunction = EntityValueFunction;

  constructor(private element: ElementRef, private dialog: Dialog, private overlay: Overlay, private ghsManager: GhsManager) {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
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

    this.activeTurn = false;
    if (this.figure instanceof Monster) {
      const entities = this.figure.entities.filter((entity) => entity.active).sort(gameManager.monsterManager.sortEntities);
      if (entities.length && entities[0] == this.entity) {
        this.activeTurn = true;
      }
    }

    this.entityHealth = this.entity.health;
    this.maxHp = EntityValueFunction(this.entity.maxHealth);

    this.specialActionsMarker = [];
    this.entity.tags.forEach((tag) => {
      if (this.figure instanceof Character && this.figure.name == 'prism' && this.figure.specialActions.find((specialAction) => specialAction.name == tag && specialAction.summon)) {
        if (tag == 'prism_mode') {
          this.specialActionsMarker.push('mode');
        }
      }
    })

    if (this.figure instanceof ObjectiveContainer && this.figure.objectiveId) {
      this.objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(this.figure.objectiveId);
    }

    const isMonsterEntity = gameManager.isMonsterEntity(this.entity);
    const isObjectiveEntity = gameManager.isObjectiveEntity(this.entity);
    const isSummon = gameManager.isSummon(this.entity);
    const isMonster = gameManager.isMonster(this.figure);

    this.entityBorderClasses = {
      'dead': this.entity.dead,
      'off': !this.entity.dormant && this.entity.off,
      'dormant': this.entity.dormant,
      'revealed': !this.entity.dormant && this.entity.revealed && settingsManager.settings.scenarioRooms,
      'revealed-active': this.figure.active && !this.entity.dormant && this.entity.revealed && settingsManager.settings.scenarioRooms && settingsManager.settings.activeStandees,
      'active': !this.entity.dormant && (isMonsterEntity && this.entity.active && settingsManager.settings.activeStandees || isSummon && this.entity.active && settingsManager.settings.activeSummons),
      'active-focus': !this.entity.dormant && this.entity.active && settingsManager.settings.activeStandees && !this.figure.active,
      'active-turn': this.activeTurn,
      'monster': isMonsterEntity,
      'objective': isObjectiveEntity,
      'summon': isSummon,
      'denied': isMonster && !gameManager.stateManager.monsterPermissions[this.figure.name + '|' + this.figure.edition] || gameManager.isObjectiveContainer(this.figure) && gameManager.stateManager.permissions && !gameManager.stateManager.permissions.characters || gameManager.isCharacter(this.figure) && !gameManager.stateManager.characterPermissions[this.figure.name + '|' + this.figure.edition],
      'action-hint-border': this.actionHints.length > 0 && (this.actionHints.length % 2) == 1 && this.activeConditions.length == 0 && (isObjectiveEntity && isMonsterEntity && gameManager.toMonsterEntity(this.entity).summon == SummonState.false || isSummon && gameManager.toSummon(this.entity).state == SummonState.false),
      'fh': settingsManager.settings.theme == 'fh',
      'modern': settingsManager.settings.theme == 'modern'
    };

    this.entityTypeClass = isMonsterEntity ? gameManager.toMonsterEntity(this.entity).type : '';

    this.standeeClasses = {
      'monster-standee': isMonsterEntity,
      'objective-standee': isObjectiveEntity,
      'summon-standee': isSummon,
      'bb-elite': isMonster && gameManager.toMonster(this.figure).bb && isMonsterEntity && gameManager.toMonsterEntity(this.entity).type == MonsterType.elite
    };

    this.numberClasses = (isMonster && gameManager.toMonster(this.figure).bb ? 'bb-' + this.entity.number : '') + (this.entity.number < 1 && settingsManager.settings.animations ? ' highlight' : '');
    this.numberDisplay = this.entity.number < 0 ? '?' : this.entity.number;

    if (isSummon) {
      const summon = gameManager.toSummon(this.entity);
      this.summonStateClasses = {
        'active': summon.state == SummonState.true,
        'new': summon.state == SummonState.new,
        'center': (summon.entityConditions.length % 2) == 0,
        'fh': summon.color == SummonColor.fh
      };
    }

    this.healthClasses = {
      'damage': settingsManager.settings.damageHP || !!(this.objectiveData && this.objectiveData.trackDamage)
    };

    this.conditionCenterBase = (isMonsterEntity && gameManager.toMonsterEntity(this.entity).summon == SummonState.false || isSummon || isObjectiveEntity);

    if (isMonsterEntity) {
      const me = gameManager.toMonsterEntity(this.entity);
      this.monsterSummonClasses = {
        'active': me.summon == SummonState.true,
        'new': me.summon == SummonState.new
      };
    }
  }

  dragHpMove(value: number) {
    if ((EntityValueFunction(this.entity.maxHealth) > 0 || this.objectiveData && this.objectiveData.trackDamage) && (!(this.figure instanceof Monster) || !this.figure.immortal)) {
      this.health = value;
      if ((!this.objectiveData || !this.objectiveData.trackDamage) && this.entity.health + this.health > EntityValueFunction(this.entity.maxHealth)) {
        this.health = EntityValueFunction(this.entity.maxHealth) - this.entity.health;
      }
    }
  }

  dragHpEnd(value: number) {
    if (this.health != 0 && (EntityValueFunction(this.entity.maxHealth) > 0 || this.objectiveData && this.objectiveData.trackDamage) && (!(this.figure instanceof Monster) || !this.figure.immortal)) {
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
    if (entityCondition.types.indexOf(ConditionType.stackable) && entityCondition.value > 1) {
      entityCondition.value--;
    } else {
      gameManager.entityManager.removeCondition(this.entity, this.figure, entityCondition, entityCondition.permanent);
    }
    gameManager.stateManager.after();
  }

  removeMarker() {
    if ((this.entity instanceof MonsterEntity || this.entity instanceof ObjectiveEntity) && this.entity.marker) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "removeEntityMarker"), this.marker);
      this.entity.marker = "";
      gameManager.stateManager.after();
    }
  }

  removeCharacterMarker(marker: string) {
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
            this.ghsManager.triggerUiChange();
          }
        }
      })
    }
  }




}