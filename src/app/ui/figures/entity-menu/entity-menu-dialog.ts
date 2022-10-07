import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ActionType } from "src/app/game/model/Action";
import { AttackModifier, AttackModifierDeck, AttackModifierType } from "src/app/game/model/AttackModifier";
import { Character } from "src/app/game/model/Character";
import { ConditionName, ConditionType } from "src/app/game/model/Condition";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { Objective } from "src/app/game/model/Objective";
import { Summon, SummonState } from "src/app/game/model/Summon";
import { ghsValueSign } from "../../helper/Static";
import { AttackModiferDeckChange } from "../attackmodifier/attackmodifierdeck";

@Component({
  selector: 'ghs-entity-menu-dialog',
  templateUrl: 'entity-menu-dialog.html',
  styleUrls: [ './entity-menu-dialog.scss' ]
})
export class EntityMenuDialogComponent {


  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  @ViewChild('charactertitle', { static: false }) characterTitleInput!: ElementRef;
  @ViewChild('objectiveTitle', { static: false }) objectiveTitleInput!: ElementRef;

  conditionType: 'character' | 'monster' | '' = '';

  levelDialog: boolean = false;

  health: number = 0;
  experience: number = 0;
  loot: number = 0;
  maxHp: number = 0;
  attack: number = 0;
  movement: number = 0;
  range: number = 0;

  AttackModifierType = AttackModifierType;
  SummonState = SummonState;
  ConditionName = ConditionName;
  ConditionType = ConditionType;

  constructor(@Inject(DIALOG_DATA) public data: { entity: Entity, figure: Figure }, private changeDetectorRef: ChangeDetectorRef, private dialogRef: DialogRef) {
    if (data.entity instanceof Character) {
      this.conditionType = 'character';
    } else if (data.entity instanceof Objective) {
      this.conditionType = 'character';
    } else if (data.entity instanceof MonsterEntity) {
      this.conditionType = 'monster';
    } else if (data.entity instanceof Summon) {
      this.conditionType = 'monster';
      if (data.entity.init) {
        this.levelDialog = true;
      }
    }

    this.dialogRef.closed.subscribe({
      next: (forced) => {
        if (!forced) {
          this.close();
        }
      }
    })
  }


  changeHealth(value: number) {
    this.health += value;
    if (this.data.entity.health + this.health > this.data.entity.maxHealth) {
      this.health = EntityValueFunction('' + this.data.entity.maxHealth) - this.data.entity.health;
    } else if (this.data.entity.health + this.health < 0) {
      this.health = - this.data.entity.health;
    }
    gameManager.entityManager.changeHealthHighlightConditions(this.data.entity, this.health);
  }

  changeExperience(value: number) {
    if (this.data.entity instanceof Character) {
      this.experience += value;
      if (this.data.entity.experience + this.experience <= 0) {
        this.experience = -this.data.entity.experience;
      }
    }
  }

  changeLoot(value: number) {
    if (this.data.entity instanceof Character) {
      this.loot += value;
      if (this.data.entity.loot + this.loot <= 0) {
        this.loot = -this.data.entity.loot;
      }
    }
  }

  attackModifierDeck(): AttackModifierDeck {
    if (this.data.figure instanceof Character) {
      return this.data.figure.attackModifierDeck;
    } else if (this.data.figure instanceof Monster) {
      return settingsManager.settings.allyAttackModifierDeck && this.data.figure.isAlly ? gameManager.game.allyAttackModifierDeck : gameManager.game.monsterAttackModifierDeck;
    }

    return new AttackModifierDeck();
  }

  beforeAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before("updateAttackModifierDeck." + change.type, this.data.figure instanceof Character ? "data.character." + this.data.figure.name : (this.data.figure instanceof Monster && this.data.figure.isAlly ? 'ally' : 'monster'), ...change.values);
  }

  afterAttackModifierDeck(change: AttackModiferDeckChange) {
    let attackModifierDeck = this.attackModifierDeck();
    attackModifierDeck = change.deck;
    gameManager.stateManager.after();
  }

  countAttackModifier(type: AttackModifierType): number {
    return this.attackModifierDeck().cards.filter((attackModifier) => {
      return attackModifier.type == type;
    }).length;
  }

  countUpcomingAttackModifier(type: AttackModifierType): number {
    return this.attackModifierDeck().cards.filter((attackModifier, index) => {
      return attackModifier.type == type && index > this.attackModifierDeck().current;
    }).length;
  }

  countDrawnAttackModifier(type: AttackModifierType): number {
    return this.attackModifierDeck().cards.filter((attackModifier, index) => {
      return attackModifier.type == type && index <= this.attackModifierDeck().current;
    }).length;
  }

  countAllUpcomingAttackModifier(type: AttackModifierType) {
    if (this.data.entity instanceof Character) {
      let count = 0;
      gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character)).forEach((character) => {
        count += character.attackModifierDeck.cards.filter((attackModifier, index) => {
          return attackModifier.type == type && index > character.attackModifierDeck.current;
        }).length
      })
      return count;
    } else {
      return this.countUpcomingAttackModifier(type);
    }
  }

  changeAttackModifier(type: AttackModifierType, value: number) {
    if (value > 0) {
      if (this.countAllUpcomingAttackModifier(type) == 10) {
        return;
      }
      gameManager.attackModifierManager.addModifier(this.attackModifierDeck(), new AttackModifier(type));
    } else if (value < 0) {
      const card = this.attackModifierDeck().cards.find((attackModifier, index) => {
        return attackModifier.type == type && index > this.attackModifierDeck().current;
      });
      if (card) {
        this.attackModifierDeck().cards.splice(this.attackModifierDeck().cards.indexOf(card), 1);
      }
    }
  }

  changeBless(value: number) {
    if (this.data.entity instanceof Character || this.data.entity instanceof MonsterEntity) {
      if (this.data.entity instanceof Character) {
        gameManager.stateManager.before(value < 0 ? "removeBless" : "addBless", "data.character." + this.data.entity.name);
      } else {
        gameManager.stateManager.before(value < 0 ? "removeEntityBless" : "addEntityBless", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number);
      }
      this.changeAttackModifier(AttackModifierType.bless, value)
      gameManager.stateManager.after();
    }
  }

  changeCurse(value: number) {
    if (this.data.entity instanceof Character || this.data.entity instanceof MonsterEntity) {
      if (this.data.entity instanceof Character) {
        gameManager.stateManager.before(value < 0 ? "removeCurse" : "addCurse", "data.character." + this.data.entity.name);
      } else {
        gameManager.stateManager.before(value < 0 ? "removeEntityCurse" : "addEntityCurse", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number);
      }
      this.changeAttackModifier(AttackModifierType.curse, value)
      gameManager.stateManager.after();
    }
  }

  toggleExhausted() {
    if (this.data.entity instanceof Character || this.data.entity instanceof Objective) {
      if (this.data.entity instanceof Character) {
        gameManager.stateManager.before(this.data.entity.exhausted ? "unsetExhausted" : "setExhausted", "data.character." + this.data.entity.name);
      } else {
        gameManager.stateManager.before(this.data.entity.exhausted ? "unsetObjectiveExhausted" : "setObjectiveExhausted", this.data.entity.title || this.data.entity.name);
      }
      this.exhausted();
      gameManager.stateManager.after();
    }
  }

  exhausted() {
    if (this.data.entity instanceof Character || this.data.entity instanceof Objective) {
      this.data.entity.exhausted = !this.data.entity.exhausted;
      if (this.data.entity.exhausted) {
        this.data.entity.off = true;
        this.data.entity.active = false;
      } else {
        this.data.entity.off = false;
      }
      gameManager.sortFigures();
    }
  }

  changeMaxHealth(value: number) {
    this.maxHp += value;
    if (EntityValueFunction('' + this.data.entity.maxHealth) + this.maxHp <= 1) {
      this.maxHp = -EntityValueFunction('' + this.data.entity.maxHealth) + 1;
    }
  }

  setLevel(level: number) {
    if (this.data.entity instanceof Character) {
      gameManager.stateManager.before("setLevel", "data.character." + this.data.entity.name, "" + level);
      gameManager.characterManager.setLevel(this.data.entity, level);
      gameManager.stateManager.after();
    }
  }


  isImmune(conditionName: ConditionName): boolean {
    if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
      return gameManager.entityManager.isImmune(this.data.figure, this.data.entity, conditionName);
    }
    return false;
  }

  shieldValue(): number {
    if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
      const stat = gameManager.monsterManager.getStat(this.data.figure, this.data.entity.type);
      let shieldValue = 0;
      const shieldAction = stat.actions.find((action) => action.type == ActionType.shield);
      if (shieldAction) {
        shieldValue += +shieldAction.value;
      }

      const activeFigure = gameManager.game.figures.find((figure) => figure.active);
      if (this.data.figure.active || gameManager.game.state == GameState.next && (!activeFigure || gameManager.game.figures.indexOf(activeFigure) > gameManager.game.figures.indexOf(this.data.figure))) {
        let ability = gameManager.monsterManager.getAbility(this.data.figure);
        if (ability) {
          ability.actions.forEach((action) => {
            if (action.type == ActionType.shield) {
              shieldValue += +action.value;
            } else if (action.type == ActionType.monsterType && action.value == (this.data.entity as MonsterEntity).type) {
              action.subActions.forEach((action) => {
                if (action.type == ActionType.shield) {
                  shieldValue += +action.value;
                }
              });
            }
          })
        }
      }
      return shieldValue;
    }
    return 0;
  }

  hasMarker(marker: string) {
    return gameManager.entityManager.hasMarker(this.data.entity, marker);
  }

  toggleCharacterMarker() {
    if (this.data.entity instanceof Character) {
      gameManager.stateManager.before(this.data.entity.marker ? "disableMarker" : "enableMarker", "data.character." + this.data.entity.name);
      this.data.entity.marker = !this.data.entity.marker;
      gameManager.stateManager.after();
    }
  }

  toggleMarker(marker: string) {
    if (this.data.entity instanceof MonsterEntity) {
      gameManager.stateManager.before(this.hasMarker(marker) ? "removeEntityMarker" : "addEntityMarker", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number, "data.character." + marker);
    } else if (this.data.entity instanceof Character) {
      gameManager.stateManager.before(this.hasMarker(marker) ? "removeMarker" : "addMarker", "data.character." + this.data.entity.name, "data.character." + marker);
    } else if (this.data.entity instanceof Summon) {
      gameManager.stateManager.before(this.hasMarker(marker) ? "removeSummonMarker" : "addSummonMarker", "data.character." + this.data.figure.name, "data.summon." + this.data.entity.name, "data.character." + marker);
    } else if (this.data.entity instanceof Objective) {
      gameManager.stateManager.before(this.hasMarker(marker) ? "removeObjectiveMarker" : "addObjectiveMarker", this.data.entity.title || this.data.entity.name, "data.character." + marker);
    }

    gameManager.entityManager.toggleMarker(this.data.entity, marker);
    gameManager.stateManager.after();

  }

  toggleSummon() {
    if (this.data.entity instanceof MonsterEntity) {
      let summonState = SummonState.false;
      if (this.data.entity.summon == SummonState.false) {
        summonState = SummonState.new;
      } else if (this.data.entity.summon == SummonState.new) {
        summonState = SummonState.true;
      }

      gameManager.stateManager.before("setEntitySummonState", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number, 'summon.state.' + summonState);
      this.data.entity.summon = summonState;
      gameManager.stateManager.after();
    }
  }

  toggleDead() {
    if (this.data.entity instanceof MonsterEntity) {
      gameManager.stateManager.before("entityDead", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number);
      this.dead();
      gameManager.stateManager.after();
    } else if (this.data.entity instanceof Summon) {
      gameManager.stateManager.before("summonDead", "data.character." + this.data.figure.name, "data.summon." + this.data.entity.name);
      this.dead();
      gameManager.stateManager.after();
    }
  }

  dead() {
    if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
      this.data.entity.dead = true;

      if (this.data.figure.entities.every((monsterEntity) => monsterEntity.dead)) {
        if (this.data.figure.active) {
          gameManager.roundManager.toggleFigure(this.data.figure);
        }
      }

      if (gameManager.game.state == GameState.draw || this.data.entity.entityConditions.length == 0 || this.data.entity.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
        setTimeout(() => {
          if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
            gameManager.monsterManager.removeMonsterEntity(this.data.figure, this.data.entity);
            gameManager.stateManager.after();
          }
        }, 1500);
      }
      ;
    } else if (this.data.figure instanceof Character && this.data.entity instanceof Summon) {
      this.data.entity.dead = true;

      if (gameManager.game.state == GameState.draw || this.data.entity.entityConditions.length == 0 || this.data.entity.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
        setTimeout(() => {
          if (this.data.figure instanceof Character && this.data.entity instanceof Summon) {
            gameManager.characterManager.removeSummon(this.data.figure, this.data.entity);
            gameManager.stateManager.after();
          }
        }, 1500);
      }
    }
    this.dialogRef.close(true);
  }

  changeAttack(value: number) {
    if (this.data.entity instanceof Summon) {
      this.attack += value;
      if (this.data.entity.attack + this.attack < 0) {
        this.attack = -this.data.entity.attack;
      }
    }
  }

  changeMovement(value: number) {
    if (this.data.entity instanceof Summon) {
      this.movement += value;
      if (this.data.entity.movement + this.movement <= 0) {
        this.movement = -this.data.entity.movement;
      }
    }
  }

  changeRange(value: number) {
    if (this.data.entity instanceof Summon) {
      this.range += value;
      if (this.data.entity.range + this.range <= 0) {
        this.range = -this.data.entity.range;
      }
    }
  }

  toggleSummonStatus() {
    if (this.data.entity instanceof Summon) {
      let state = SummonState.new;
      if (this.data.entity.state == SummonState.new) {
        state = SummonState.true;
      }
      gameManager.stateManager.before("setSummonState", "data.character." + this.data.figure.name, "data.summon." + this.data.entity.name, 'summon.state.' + state);
      this.data.entity.state = state;
      gameManager.stateManager.after();
    }
  }



  changeId(value: number) {
    if (this.data.entity instanceof Objective) {
      let id = this.data.entity.id + value;
      if (id < 0) {
        id = 98;
      } else if (id > 98) {
        id = 0;
      }

      while (gameManager.game.figures.some((figure) => figure instanceof Objective && figure.id == id)) {
        id = id + value;
        if (id < 0) {
          id = 98;
        } else if (id > 98) {
          id = 0;
        }
      }

      gameManager.stateManager.before("changeObjectiveId", this.data.entity.title || this.data.entity.name, "" + (id + 1));
      this.data.entity.id = id;
      gameManager.stateManager.after();
    }
  }

  openLevelDialog() {
    this.levelDialog = true;
    this.changeDetectorRef.detectChanges();
    if (this.data.entity instanceof Character) {
      this.characterTitleInput.nativeElement.value = this.data.entity.title || settingsManager.getLabel('data.character.' + this.data.entity.name.toLowerCase());
    }
  }

  close(): void {
    if (this.data.entity instanceof Character) {
      this.closeCharacter();
    } else if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
      this.closeMonster();
    } else if (this.data.entity instanceof Summon) {
      this.closeSummon();
    } else if (this.data.entity instanceof Objective) {
      this.closeObjective();
    }
  }

  closeCharacter(): void {
    if (this.data.entity instanceof Character) {
      if (this.health != 0) {
        gameManager.stateManager.before("changeHP", "data.character." + this.data.entity.name, ghsValueSign(this.health));
        gameManager.entityManager.changeHealth(this.data.entity, this.health);
        if (this.data.entity.health <= 0 || this.data.entity.exhausted && this.health >= 0 && this.data.entity.health > 0) {
          this.exhausted();
        }
        this.health = 0;
        gameManager.stateManager.after();
      }

      if (this.experience != 0) {
        gameManager.stateManager.before("changeXP", "data.character." + this.data.entity.name, ghsValueSign(this.experience));
        this.data.entity.experience += this.experience;
        if (this.data.entity.experience < 0) {
          this.data.entity.experience = 0;
        }
        this.experience = 0;
        gameManager.stateManager.after();
      }

      if (this.loot != 0) {
        gameManager.stateManager.before("changeLoot", "data.character." + this.data.entity.name, ghsValueSign(this.loot));
        this.data.entity.loot += this.loot;
        if (this.data.entity.loot < 0) {
          this.data.entity.loot = 0;
        }
        this.loot = 0;
        gameManager.stateManager.after();
      }

      if (this.maxHp) {
        gameManager.stateManager.before("changeMaxHP", "data.character." + this.data.entity.name, ghsValueSign(this.maxHp));
        if (this.data.entity.maxHealth + this.maxHp < this.data.entity.maxHealth || this.data.entity.health == this.data.entity.maxHealth) {
          this.data.entity.health = this.data.entity.maxHealth + this.maxHp;
        }
        this.data.entity.maxHealth += this.maxHp;
        gameManager.stateManager.after();
        this.maxHp = 0;
      }

      if (this.levelDialog && this.characterTitleInput) {
        if (this.characterTitleInput.nativeElement.value && this.characterTitleInput.nativeElement.value != settingsManager.getLabel('data.character.' + this.data.entity.name.toLowerCase())) {
          if (this.data.entity.title != this.characterTitleInput.nativeElement.value) {
            gameManager.stateManager.before("setTitle", "data.character." + this.data.entity.name, this.characterTitleInput.nativeElement.value);
            this.data.entity.title = this.characterTitleInput.nativeElement.value;
            gameManager.stateManager.after();
          }
        } else if (this.data.entity.title != "") {
          gameManager.stateManager.before("unsetTitle", "data.character." + this.data.entity.name, this.data.entity.title);
          this.data.entity.title = "";
          gameManager.stateManager.after();
        }
      }
    }
  }

  closeMonster() {
    if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
      if (this.health != 0) {
        gameManager.stateManager.before("changeEntityHp", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number, ghsValueSign(this.health));
        gameManager.entityManager.changeHealth(this.data.entity, this.health);
        gameManager.stateManager.after();
        this.health = 0;
      }
      if (this.maxHp) {
        gameManager.stateManager.before("changeEntityMaxHp", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number, ghsValueSign(this.maxHp));
        if (this.data.entity.maxHealth + this.maxHp < this.data.entity.maxHealth || this.data.entity.health == this.data.entity.maxHealth) {
          this.data.entity.health = this.data.entity.maxHealth + this.maxHp;
        }
        this.data.entity.maxHealth += this.maxHp;
        gameManager.stateManager.after();
        this.maxHp = 0;
      }

      if (this.data.entity.health <= 0 || this.data.entity.dead) {
        this.dead();
      }
    }
  }

  closeSummon() {
    if (this.data.figure instanceof Character && this.data.entity instanceof Summon) {
      if (this.data.entity.init) {
        gameManager.characterManager.removeSummon(this.data.figure, this.data.entity);
        gameManager.stateManager.before("addSummon", "data.character." + this.data.figure.name, this.data.entity.name);
        this.data.entity.init = false;
        if (this.health != 0) {
          gameManager.entityManager.changeHealth(this.data.entity, this.health);
        }
        if (this.attack != 0) {
          this.data.entity.attack += this.attack;
        }
        if (this.movement != 0) {
          this.data.entity.movement += this.movement;
        }
        if (this.range != 0) {
          this.data.entity.range += this.range;
        }
        if (this.maxHp) {
          if (this.data.entity.maxHealth + this.maxHp < this.data.entity.maxHealth || this.data.entity.health == this.data.entity.maxHealth) {
            this.data.entity.health = this.data.entity.maxHealth + this.maxHp;
          }
          this.data.entity.maxHealth += this.maxHp;
        }
        gameManager.characterManager.addSummon(this.data.figure, this.data.entity);
        gameManager.stateManager.after();
      } else {
        if (this.health != 0) {
          gameManager.stateManager.before("changeSummonHp", "data.character." + this.data.figure.name, "data.summon." + this.data.entity.name, ghsValueSign(this.health));
          gameManager.entityManager.changeHealth(this.data.entity, this.health);
          gameManager.stateManager.after();
        }
        if (this.attack != 0) {
          gameManager.stateManager.before("changeSummonAttack", "data.character." + this.data.figure.name, "data.summon." + this.data.entity.name, ghsValueSign(this.attack));
          this.data.entity.attack += this.attack;
          gameManager.stateManager.after();
        }
        if (this.movement != 0) {
          gameManager.stateManager.before("changeSummonMove", "data.character." + this.data.figure.name, "data.summon." + this.data.entity.name, ghsValueSign(this.movement));
          this.data.entity.movement += this.movement;
          gameManager.stateManager.after();
        }
        if (this.range != 0) {
          gameManager.stateManager.before("changeSummonRange", "data.character." + this.data.figure.name, "data.summon." + this.data.entity.name, ghsValueSign(this.range));
          this.data.entity.range += this.range;
          gameManager.stateManager.after();
        }
        if (this.maxHp) {
          gameManager.stateManager.before("changeSummonMaxHp", "data.character." + this.data.figure.name, "data.summon." + this.data.entity.name, ghsValueSign(this.maxHp));
          if (this.data.entity.maxHealth + this.maxHp < this.data.entity.maxHealth || this.data.entity.health == this.data.entity.maxHealth) {
            this.data.entity.health = this.data.entity.maxHealth + this.maxHp;
          }
          this.data.entity.maxHealth += this.maxHp;
          gameManager.stateManager.after();
        }
      }

      if (this.data.entity.health <= 0 || this.data.entity.dead) {
        this.dead();
      }
    }
  }

  showMaxHealth(): boolean {
    if (this.data.entity instanceof Objective) {
      return !isNaN(+this.data.entity.maxHealth);
    }
    return false;
  }

  closeObjective() {
    if (this.data.entity instanceof Objective) {
      if (this.health != 0) {
        gameManager.stateManager.before("changeHP", this.data.entity.title || this.data.entity.name, ghsValueSign(this.health));
        const old = this.data.entity.health;
        gameManager.entityManager.changeHealth(this.data.entity, this.health);
        if (this.data.entity.health <= 0 || this.data.entity.exhausted && this.health >= 0 && this.data.entity.health > 0) {
          this.exhausted();
        }
        gameManager.stateManager.after();
        this.health = 0;
      }
      if (this.maxHp) {
        gameManager.stateManager.before("changeObjectiveMaxHp", this.data.entity.title || this.data.entity.name, ghsValueSign(this.maxHp));
        if (+this.data.entity.maxHealth + this.maxHp < this.data.entity.maxHealth || this.data.entity.health == this.data.entity.maxHealth) {
          this.data.entity.health = +this.data.entity.maxHealth + this.maxHp;
        }
        this.data.entity.maxHealth = +this.data.entity.maxHealth + this.maxHp;
        gameManager.stateManager.after();
      }
      if (this.objectiveTitleInput) {
        if (this.objectiveTitleInput.nativeElement.value && this.objectiveTitleInput.nativeElement.value != new Objective(0).name) {
          if (this.data.entity.title != this.objectiveTitleInput.nativeElement.value) {
            gameManager.stateManager.before("setTitle", this.data.entity.name, this.objectiveTitleInput.nativeElement.value);
            this.data.entity.title = this.objectiveTitleInput.nativeElement.value;
            gameManager.stateManager.after();
          }
        } else if (this.data.entity.title != "") {
          gameManager.stateManager.before("unsetTitle", this.data.entity.name, this.data.entity.title);
          this.data.entity.title = "";
          gameManager.stateManager.after();
        }
      }
    }
  }

}