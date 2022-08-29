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
import { ghsValueSign } from '../../helper/Static';
import { AttackModiferDeckChange } from '../attackmodifier/attackmodifierdeck';

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
  experience: number = 0;
  loot: number = 0;
  levelDialog: boolean = false;
  levels: number[] = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

  dragInitiative: number = -1;
  dragHp: number = 0;
  dragXp: number = 0;
  dragLoot: number = 0;

  constructor(private element: ElementRef, private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  emptySummons(): boolean {
    return this.character.summons.length == 0 || this.character.summons.every((summon) => summon.dead);
  }

  changeHealth(value: number) {
    this.dragHp += value;
  }

  changeExperience(value: number) {
    this.character.experience += value;
    this.experience += value;

    if (this.character.experience <= 0) {
      this.character.experience = 0;
    }
  }

  changeLoot(value: number) {
    this.character.loot += value;
    this.loot += value;

    if (this.character.loot <= 0) {
      this.character.loot = 0;
    }
  }

  beforeAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before("updateAttackModifierDeck." + change.type, "data.character." + this.character.name, ...change.values);
  }

  afterAttackModifierDeck(change: AttackModiferDeckChange) {
    this.character.attackModifierDeck = change.deck;
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
    gameManager.stateManager.before(value < 0 ? "removeBless" : "addBless", "data.character." + this.character.name);
    this.changeAttackModifier(AttackModifierType.bless, value)
    gameManager.stateManager.after();
  }

  changeCurse(value: number) {
    gameManager.stateManager.before(value < 0 ? "removeCurse" : "addCurse", "data.character." + this.character.name);
    this.changeAttackModifier(AttackModifierType.curse, value)
    gameManager.stateManager.after();
  }

  toggleExhausted() {
    gameManager.stateManager.before(this.character.exhausted ? "unsetExhausted" : "setExhausted", "data.character." + this.character.name);
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
    gameManager.stateManager.before("changeMaxHP", "data.character." + this.character.name, ghsValueSign(value));
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
    gameManager.stateManager.before("setLevel", "data.character." + this.character.name, "" + level);
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

      if (this.dragInitiative == -1) {
        this.dragInitiative = this.character.initiative;
      }

      this.character.initiative = value;
      this.character.initiativeVisible = true;
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

      this.character.initiative = this.dragInitiative;
      gameManager.stateManager.before("setInitiative", "data.character." + this.character.name, "" + value);
      this.character.initiative = value;
      this.dragInitiative = -1;
      if (this.character instanceof Character) {
        this.character.initiativeVisible = true;
      }
      gameManager.sortFigures();
      gameManager.stateManager.after();
    }
  }

  dragHpMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.dragHp = Math.floor(value / dragFactor);
      if (this.character.health + this.dragHp > this.character.maxHealth) {
        this.dragHp = this.character.maxHealth - this.character.health;
      } else if (this.character.health + this.dragHp < 0) {
        this.dragHp = - this.character.health;
      }
    }
  }

  dragHpEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      if (this.dragHp != 0) {
        gameManager.stateManager.before("changeHP", "data.character." + this.character.name, ghsValueSign(this.dragHp));
        gameManager.entityManager.changeHealth(this.character, this.dragHp);
        if (this.character.health <= 0 || this.character.exhausted && this.dragHp >= 0 && this.character.health > 0) {
          this.exhausted();
        }
        this.dragHp = 0;
      }
      gameManager.stateManager.after();
    }
  }

  dragXpMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.dragXp = Math.floor(value / dragFactor);
      if (this.character.experience + this.dragXp < 0) {
        this.dragXp = - this.character.experience;
      }
    }
  }

  dragXpEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      if (this.dragXp != 0) {
        gameManager.stateManager.before("changeXP", "data.character." + this.character.name, ghsValueSign(this.dragXp));
        this.character.experience += this.dragXp;
        this.dragXp = 0;
      }
      gameManager.stateManager.after();
    }
  }

  dragLootMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.dragLoot = Math.floor(value / dragFactor);
      if (this.character.loot + this.dragLoot < 0) {
        this.dragLoot = - this.character.loot;
      }
    }
  }

  dragLootEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      if (this.dragLoot != 0) {
        gameManager.stateManager.before("changeLoot", "data.character." + this.character.name, ghsValueSign(this.dragLoot));
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
    if (this.dragHp != 0) {
      gameManager.stateManager.before("changeHP", "data.character." + this.character.name, ghsValueSign(this.dragHp));
      gameManager.entityManager.changeHealth(this.character, this.dragHp);
      if (this.character.health <= 0 || this.character.exhausted && this.dragHp >= 0 && this.character.health > 0) {
        this.exhausted();
      }
      this.dragHp = 0;
      gameManager.stateManager.after();
    }

    if (this.experience != 0) {
      this.character.experience -= this.experience;
      gameManager.stateManager.before("changeXP", "data.character." + this.character.name, ghsValueSign(this.experience));
      this.character.experience += this.experience;
      if (this.character.experience < 0) {
        this.character.experience = 0;
      }
      this.experience = 0;
      gameManager.stateManager.after();
    }

    if (this.loot != 0) {
      this.character.loot -= this.loot;
      gameManager.stateManager.before("changeLoot", "data.character." + this.character.name, ghsValueSign(this.loot));
      this.character.loot += this.loot;
      if (this.character.loot < 0) {
        this.character.loot = 0;
      }
      this.loot = 0;
      gameManager.stateManager.after();
    }


    if (this.levelDialog && this.titleInput) {
      if (this.titleInput.nativeElement.value && this.titleInput.nativeElement.value != settingsManager.getLabel('data.character.' + this.character.name.toLowerCase())) {
        if (this.character.title != this.titleInput.nativeElement.value) {
          gameManager.stateManager.before("setTitle", "data.character." + this.character.name, this.titleInput.nativeElement.value);
          this.character.title = this.titleInput.nativeElement.value;
          gameManager.stateManager.after();
        }
      } else if (this.character.title != "") {
        gameManager.stateManager.before("unsetTitle", "data.character." + this.character.name, this.character.title);
        this.character.title = "";
        gameManager.stateManager.after();
      }
    }

    this.levelDialog = false;
  }

}