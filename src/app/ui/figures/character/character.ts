import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Character } from 'src/app/game/model/Character';
import { Condition, ConditionType } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { DialogComponent } from '../../dialog/dialog';

@Component({
  selector: 'ghs-character',
  templateUrl: './character.html',
  styleUrls: [ './character.scss', '../../dialog/dialog.scss' ]
})
export class CharacterComponent extends DialogComponent {

  @Input() character!: Character;

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterManager: CharacterManager = gameManager.characterManager;

  GameState = GameState;
  ConditionType = ConditionType;
  AttackModifierType = AttackModifierType;
  health: number = 0;
  experience: number = 0;
  loot: number = 0;
  levelDialog: boolean = false;
  levels: number[] = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

  dragHp: number = 0;
  dragHpOffset: number = -1;
  dragXp: number = 0;
  dragXpOffset: number = -1;
  dragLoot: number = 0;
  dragLootOffset: number = -1;

  constructor(private element: ElementRef, private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  emptySummons(): boolean {
    return this.character.summons.length == 0 || this.character.summons.every((summon) => summon.dead);
  }

  changeHealth(value: number) {
    const old = this.character.health;
    gameManager.entityManager.changeHealth(this.character, value);
    this.health += this.character.health - old;
  }

  changeExperience(value: number) {
    gameManager.stateManager.before();
    this.character.experience += value;
    this.experience += value;

    if (this.character.experience <= 0) {
      this.character.experience = 0;
    }
    gameManager.stateManager.after();
  }

  changeLoot(value: number) {
    gameManager.stateManager.before();
    this.character.loot += value;
    this.loot += value;

    if (this.character.loot <= 0) {
      this.character.loot = 0;
    }
    gameManager.stateManager.after();
  }

  changeAttackModifierDeck(deck: AttackModifierDeck) {
    gameManager.stateManager.before();
    this.character.attackModifierDeck = deck;
    gameManager.stateManager.after();
  }

  countAttackModifier(type: AttackModifierType): number {
    return this.character.attackModifierDeck.cards.filter((attackModifier) => {
      return attackModifier.type == type;
    }).length;
  }

  countDrawnAttackModifier(type: AttackModifierType): number {
    return this.character.attackModifierDeck.cards.filter((attackModifier, index) => {
      return attackModifier.type == type && index <= this.character.attackModifierDeck.current;
    }).length;
  }

  countAllAttackModifier(type: AttackModifierType) {
    return gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character).attackModifierDeck.cards).flat().filter((attackModifier) => {
      return attackModifier.type == type;
    }).length;
  }

  changeAttackModifier(type: AttackModifierType, value: number) {
    if (value > 0) {
      if (this.countAllAttackModifier(type) == 10) {
        return;
      }
      gameManager.attackModifierManager.addModifier(this.character.attackModifierDeck, new AttackModifier(type));
    } else if (value < 0) {
      const card = this.character.attackModifierDeck.cards.find((attackModifier, index) => {
        return attackModifier.type == type && index > this.character.attackModifierDeck.current;
      });
      if (card) {
        this.character.attackModifierDeck.cards.splice(this.character.attackModifierDeck.cards.indexOf(card), 1);
      }
    }
  }

  changeBless(value: number) {
    gameManager.stateManager.before();
    this.changeAttackModifier(AttackModifierType.bless, value)
    gameManager.stateManager.after();
  }

  changeCurse(value: number) {
    gameManager.stateManager.before();
    this.changeAttackModifier(AttackModifierType.curse, value)
    gameManager.stateManager.after();
  }

  hasCondition(condition: Condition) {
    return gameManager.entityManager.hasCondition(this.character, condition);
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before();
    gameManager.entityManager.toggleCondition(this.character, condition, this.character.active, this.character.off);
    gameManager.stateManager.after();
  }

  toggleExhausted() {
    gameManager.stateManager.before();
    this.exhausted();
    gameManager.stateManager.after();
  }

  exhausted() {
    this.character.exhausted = !this.character.exhausted;
    if (this.character.exhausted) {
      this.character.off = true;
      this.character.active = false;
    } else {
      this.character.off = false;
    }
    gameManager.sortFigures();
  }

  openLevelDialog() {
    this.levelDialog = true;
    this.changeDetectorRef.detectChanges();
    this.titleInput.nativeElement.value = this.character.title || settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
  }


  changeMaxHealth(value: number) {
    gameManager.stateManager.before();
    this.character.maxHealth += value;

    if (this.character.maxHealth <= 1) {
      this.character.maxHealth = 1;
    }

    if (value < 0) {
      this.character.health = this.character.maxHealth;
    }
    gameManager.stateManager.after();
  }

  setLevel(level: number) {
    gameManager.stateManager.before();
    this.characterManager.setLevel(this.character, level);
    gameManager.stateManager.after();
  }

  dragInitativeMove(value: number) {
    if (settingsManager.settings.dragValues) {

      if (value > 99) {
        value = 99;
      } else if (value < 0) {
        value = 0;
      }

      if (value == 0 && settingsManager.settings.initiativeRequired) {
        value = 1;
      }

      this.character.initiative = value;
      if (this.character instanceof Character) {
        this.character.initiativeVisible = true;
      }
    }
  }

  dragInitativeEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      if (value > 99) {
        value = 99;
      } else if (value < 0) {
        value = 0;
      }

      if (value == 0 && settingsManager.settings.initiativeRequired) {
        value = 1;
      }

      gameManager.stateManager.before();
      this.character.initiative = value;
      if (this.character instanceof Character) {
        this.character.initiativeVisible = true;
      }
      gameManager.sortFigures();
      gameManager.stateManager.after();
    }
  }

  dragHpMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const old = this.character.health;
      if (this.dragHpOffset == -1) {
        this.dragHpOffset = value;
      }
      value = value - this.dragHpOffset;
      const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.character.health += Math.floor(value / dragFactor) - this.dragHp;
      if (this.character.health > this.character.maxHealth) {
        this.character.health = EntityValueFunction("" + this.character.maxHealth);
      } else if (this.character.health < 0) {
        this.character.health = 0;
      }
      this.dragHp += this.character.health - old;
    }
  }

  dragHpEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      this.dragHpOffset = -1;
      if (this.dragHp != 0) {
        this.character.health -= this.dragHp;
        gameManager.stateManager.before();
        this.changeHealth(this.dragHp);
        if (this.character.health <= 0 || this.character.exhausted && this.dragHp >= 0 && this.character.health > 0) {
          this.exhausted();
        }
        this.dragHp = 0;
        this.health = 0;
      }
      gameManager.stateManager.after();
    }
  }

  dragXpMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const old = this.character.experience;
      if (this.dragXpOffset == -1) {
        this.dragXpOffset = value;
      }
      value = value - this.dragXpOffset;
      const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.character.experience += Math.floor(value / dragFactor);
      if (this.character.experience < 0) {
        this.character.experience = 0;
      }
      this.dragXp += this.character.experience - old;
    }
  }

  dragXpEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      this.dragXpOffset = -1;
      if (this.dragXp != 0) {
        this.character.experience -= this.dragXp;
        gameManager.stateManager.before();
        this.character.experience += this.dragXp;
        this.dragXp = 0;
      }
      gameManager.stateManager.after();
    }
  }

  dragLootMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const old = this.character.loot;
      if (this.dragLootOffset == -1) {
        this.dragLootOffset = value;
      }
      value = value - this.dragLootOffset;
      const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.character.loot += Math.floor(value / dragFactor);
      if (this.character.loot < 0) {
        this.character.loot = 0;
      }
      this.dragLoot += this.character.loot - old;
    }
  }

  dragLootEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      this.dragLootOffset = -1;
      if (this.dragLoot != 0) {
        this.character.loot -= this.dragLoot;
        gameManager.stateManager.before();
        this.character.loot += this.dragLoot;
        this.dragLoot = 0;
      }
      gameManager.stateManager.after();
    }
  }

  override toggle(): void {
    if (this.character.attackModifierDeckVisible) {
      this.character.attackModifierDeckVisible = false;
    } else {
      super.toggle();
    }
  }

  toggleAttackModifierDeckVisible() {
    if (this.character.attackModifierDeckVisible) {
      this.character.attackModifierDeckVisible = false;
    } else {
      this.character.attackModifierDeckVisible = true;
    }
    gameManager.stateManager.saveLocal();
  }

  override close(): void {
    super.close();

    if (this.health != 0) {
      this.character.health -= this.health;
      gameManager.stateManager.before();
      this.changeHealth(this.health);
      if (this.character.health <= 0 || this.character.exhausted && this.health >= 0 && this.character.health > 0) {
        this.exhausted();
      }
      this.dragHp = 0;
      this.dragXp = 0;
      this.dragLoot = 0;
      this.health = 0;
      gameManager.stateManager.after();
    }
    this.experience = 0;
    this.loot = 0;
    if (this.levelDialog && this.titleInput) {
      if (this.titleInput.nativeElement.value && this.titleInput.nativeElement.value != settingsManager.getLabel('data.character.' + this.character.name.toLowerCase())) {
        if (this.character.title != this.titleInput.nativeElement.value) {
          gameManager.stateManager.before();
          this.character.title = this.titleInput.nativeElement.value;
          gameManager.stateManager.after();
        }
      } else if (this.character.title != "") {
        gameManager.stateManager.before();
        this.character.title = "";
        gameManager.stateManager.after();
      }
    }

    this.levelDialog = false;
  }

}