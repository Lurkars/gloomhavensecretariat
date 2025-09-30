import { Dialog, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { ConditionName, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { EventCardAttack, EventCardCondition, EventCardConditionType, EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import { Summon, SummonColor } from 'src/app/game/model/Summon';
import { ghsValueSign } from 'src/app/ui/helper/Static';
import { CharacterSheetDialog } from '../character/dialogs/character-sheet-dialog';
import { EventCardDeckComponent } from '../event/deck/event-card-deck';
import { EventCardDrawComponent } from '../event/draw/event-card-draw';
import { PartySheetDialogComponent } from '../party/party-sheet-dialog';
import { FavorsComponent } from './favors/favors';
import { OutpostAttackComponent } from './outpost-attack/outpost-attack';
import { EventRandomItemDialogComponent } from './random-item/random-item-dialog';
import { EventRandomScenarioDialogComponent } from './random-scenario/random-scenario-dialog';

@Component({
  standalone: false,
  selector: 'ghs-event-effects',
  templateUrl: './event-effects.html',
  styleUrls: ['./event-effects.scss']
})
export class EventEffectsDialog implements OnInit, OnDestroy {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  menu: boolean = false;

  characters: Character[] = [];
  activeCharacters: Character[] = [];
  activeSummons: Summon[] = [];
  entityConditions: EntityCondition[] = [];
  immunities: ConditionName[] = [];
  newImmunities: ConditionName[] = [];
  health: number[] = [];
  experience: number[] = [];
  gold: number[] = [];
  battleGoals: number[] = [];
  bless: number = 0;
  curse: number = 0;
  prosperity: number = 0;
  reputation: number = 0;
  morale: number = 0;
  inspiration: number = 0;
  loot: Partial<Record<LootType, number>>[] = [];
  lootColumns: LootType[] = [];
  SummonColor = SummonColor;
  eventTypes: string[] = [];

  eventEffectsManual: EventCardEffect[] = [];
  eventOutpostAttackEffects: EventCardEffect[] = [];
  eventConditionManual: EventCardCondition[] = [];
  eventAttack: EventCardAttack | undefined;

  constructor(@Inject(DIALOG_DATA) data: { menu: boolean, eventResults: (EventCardEffect | EventCardCondition)[] }, private dialog: Dialog) {
    this.menu = data && data.menu || false;
    this.createEventResults(data && data.eventResults || [], true);
  }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    this.close();
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update(toggle: boolean = false) {
    if (!toggle) {
      this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
      this.activeCharacters = this.characters.filter((character) => !character.absent && !character.exhausted);
      this.activeSummons = gameManager.roundManager.firstRound ? [] : this.activeCharacters.map((character) => character.summons).flat();
      this.lootColumns = gameManager.fhRules() ? [LootType.lumber, LootType.metal, LootType.hide, LootType.arrowvine, LootType.axenut, LootType.corpsecap, LootType.flamefruit, LootType.rockroot, LootType.snowthistle] : [];
    }

    this.entityConditions = [];
    this.immunities = [];
    this.newImmunities = [];

    this.activeCharacters.forEach((character, index, self) => {
      character.entityConditions.forEach((entityCondition) => {
        if (!this.entityConditions.find((other) => other.name == entityCondition.name) && self.every((otherEntity) => otherEntity.entityConditions.find((other) => other.name == entityCondition.name && other.state == entityCondition.state))) {
          this.entityConditions.push(JSON.parse(JSON.stringify(entityCondition)));
        }
      })

      character.immunities.forEach((immunity) => {
        if (!this.immunities.find((other) => other == immunity) && self.every((otherEntity) => otherEntity.immunities.find((other) => other == immunity))) {
          this.immunities.push(immunity);
          this.newImmunities.push(immunity);
        }
      })
    })

    this.activeSummons.forEach((summon, index, self) => {
      summon.entityConditions.forEach((entityCondition) => {
        if (!this.entityConditions.find((other) => other.name == entityCondition.name) && self.every((otherEntity) => otherEntity.entityConditions.find((other) => other.name == entityCondition.name && other.state == entityCondition.state))) {
          this.entityConditions.push(JSON.parse(JSON.stringify(entityCondition)));
        }
      })

      summon.immunities.forEach((immunity) => {
        if (!this.immunities.find((other) => other == immunity) && self.every((otherEntity) => otherEntity.immunities.find((other) => other == immunity))) {
          this.immunities.push(immunity);
          this.newImmunities.push(immunity);
        }
      })
    })

    this.eventTypes = Object.keys(gameManager.game.party.eventDecks);
    if (gameManager.game.edition == 'fh') {
      if (Math.max(gameManager.game.party.weeks - 1, 0) % 20 < 10) {
        this.eventTypes = this.eventTypes.filter((type) => !type.startsWith('winter-'));
      } else {
        this.eventTypes = this.eventTypes.filter((type) => !type.startsWith('summer-'));
      }
    }
  }

  toggleCharacter(character: Character) {
    if (this.activeCharacters.indexOf(character) == -1) {
      this.activeCharacters.push(character);
      character.summons.forEach((summon) => {
        if (this.activeSummons.indexOf(summon) == -1) {
          this.activeSummons.push(summon);
        }
      })
    } else {
      this.activeCharacters.splice(this.activeCharacters.indexOf(character), 1);
      character.summons.forEach((summon) => {
        const index = this.activeSummons.indexOf(summon);
        if (index != -1) {
          this.activeSummons.splice(index, 1);
        }
      })
    }
    this.update(true);
  }

  toggleSummon(summon: Summon) {
    if (this.activeSummons.indexOf(summon) == -1) {
      this.activeSummons.push(summon);
    } else {
      this.activeSummons.splice(this.activeSummons.indexOf(summon), 1);
    }
    this.update(true);
  }

  changeHealth(value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.health[i] = this.health[i] || 0;
      this.health[i] += value;

      let maxHealth = EntityValueFunction(character.maxHealth);
      if (character.name == 'lightning' && character.tags.find((tag) => tag === 'unbridled-power')) {
        maxHealth = Math.max(maxHealth, 26);
      }

      if (character.health + this.health[i] > maxHealth) {
        this.health[i] = maxHealth - character.health;
      } else if (character.health + this.health[i] < 0) {
        this.health[i] = - character.health;
      }
    });


    this.activeSummons.forEach((summon, index) => {
      const i = this.activeCharacters.length + index;
      this.health[i] = this.health[i] || 0;
      this.health[i] += value;
      const maxHealth = EntityValueFunction(summon.maxHealth);
      if (summon.health + this.health[i] > maxHealth) {
        this.health[i] = maxHealth - summon.health;
      } else if (summon.health + this.health[i] < 0) {
        this.health[i] = - summon.health;
      }
    });
  }

  minHealth(): number {
    if (this.health.length == 0) {
      this.health[0] = 0;
    }
    return this.health.reduce((a, b) => Math.min(a, b));
  }

  maxHealth(): number {
    if (this.health.length == 0) {
      this.health[0] = 0;
    }
    return this.health.reduce((a, b) => Math.max(a, b));
  }

  changeExperience(value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.experience[i] = this.experience[i] || 0;
      this.experience[i] += value;
      if (character.progress.experience + this.experience[i] < 0) {
        this.experience[i] = - character.progress.experience;
      }
    });
  }

  minExperience(): number {
    if (this.experience.length == 0) {
      this.experience[0] = 0;
    }
    return this.experience.reduce((a, b) => Math.min(a, b));
  }

  maxExperience(): number {
    if (this.experience.length == 0) {
      this.experience[0] = 0;
    }
    return this.experience.reduce((a, b) => Math.max(a, b));
  }

  changeGold(value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.gold[i] = this.gold[i] || 0;
      this.gold[i] += value;
      if (character.progress.gold + this.gold[i] < 0) {
        this.gold[i] = - character.progress.gold;
      }
    });
  }

  minGold(): number {
    if (this.gold.length == 0) {
      this.gold[0] = 0;
    }
    return this.gold.reduce((a, b) => Math.min(a, b));
  }

  maxGold(): number {
    if (this.gold.length == 0) {
      this.gold[0] = 0;
    }
    return this.gold.reduce((a, b) => Math.max(a, b));
  }

  changeBattleGoals(value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.battleGoals[i] = this.battleGoals[i] || 0;
      this.battleGoals[i] += value;
      if (character.progress.battleGoals + this.battleGoals[i] < 0) {
        this.battleGoals[i] = - character.progress.battleGoals;
      }

      if (this.battleGoals[i] < -(character.progress.battleGoals % 3)) {
        this.battleGoals[i] = -(character.progress.battleGoals % 3);
      }
    });
  }

  minBattleGoals(): number {
    if (this.battleGoals.length == 0) {
      this.battleGoals[0] = 0;
    }
    return this.battleGoals.reduce((a, b) => Math.min(a, b));
  }

  maxBattleGoals(): number {
    if (this.battleGoals.length == 0) {
      this.battleGoals[0] = 0;
    }
    return this.battleGoals.reduce((a, b) => Math.max(a, b));
  }

  changeBless(value: number) {
    this.bless += value;
    const count = gameManager.attackModifierManager.countUpcomingBlesses();
    if (count + this.bless < 0) {
      this.bless = -count;
    } else if (count + this.bless > 10) {
      this.bless = 10 - count;
    }
  }

  changeCurse(value: number) {
    this.curse += value;
    const count = gameManager.attackModifierManager.countUpcomingCurses(false);
    if (count + this.curse < 0) {
      this.curse = -count;
    } else if (count + this.curse > 10) {
      this.curse = 10 - count;
    }
  }

  changeConditions(entityConditions: EntityCondition[]) {
    this.entityConditions = entityConditions;
  }

  changeProsperity(value: number) {
    this.prosperity += value;
    if (gameManager.game.party.prosperity + this.prosperity < 0) {
      this.prosperity = -gameManager.game.party.prosperity;
    }
  }

  changeReputation(value: number) {
    this.reputation += value;
    if (gameManager.game.party.reputation + this.reputation < -20) {
      this.reputation = -gameManager.game.party.reputation - 20;
    } else if (gameManager.game.party.reputation + this.reputation > 20) {
      this.reputation = -gameManager.game.party.reputation + 20;
    }
  }

  changeMorale(value: number) {
    this.morale += value;
    if (gameManager.game.party.morale + this.morale < 0) {
      this.morale = -gameManager.game.party.morale;
    } else if (gameManager.game.party.morale + this.morale > 20) {
      this.morale = -gameManager.game.party.morale + 20;
    }
  }

  changeInspiration(value: number) {
    this.inspiration += value;
    if (gameManager.game.party.inspiration + this.inspiration < 0) {
      this.inspiration = -gameManager.game.party.inspiration;
    }
  }

  changeLoot(type: LootType, value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.loot[i] = this.loot[i] || {};
      this.loot[i][type] = (this.loot[i][type] || 0) + value;
      if ((character.progress.loot[type] || 0) + (this.loot[i][type] || 0) < 0) {
        this.loot[i][type] = - (character.progress.loot[type] || 0);
      }
    });
  }

  minLoot(type: LootType): number {
    if (this.loot.length == 0) {
      this.loot[0] = {};
      this.loot[0][type] = 0;
    }
    return this.loot.map((loot) => loot[type] || 0).reduce((a, b) => Math.min(a, b));
  }

  maxLoot(type: LootType): number {
    if (this.loot.length == 0) {
      this.loot[0] = {};
      this.loot[0][type] = 0;
    }
    return this.loot.map((loot) => loot[type] || 0).reduce((a, b) => Math.max(a, b));
  }

  drawRandomItem(blueprint: boolean = false) {
    let itemData = gameManager.itemManager.drawRandomItem(gameManager.currentEdition(), blueprint);
    if (itemData) {
      this.dialog.open(EventRandomItemDialogComponent, {
        panelClass: ['dialog'],
        data: { item: itemData, blueprint: blueprint }
      }).closed.subscribe({
        next: (result: unknown) => {
          if (result) {
            const itemData = result as ItemData;
            gameManager.stateManager.before("eventEffect.drawRandomItem" + (blueprint ? 'Blueprint' : ''), itemData.id, itemData.edition, itemData.name);
            gameManager.game.party.unlockedItems.push(new CountIdentifier('' + itemData.id, itemData.edition));
            gameManager.stateManager.after();
          }
        }
      });
    } else if (blueprint) {
      this.inspiration++;
    }
  }

  drawRandomScenario(section: boolean = false) {
    let scenarioData = section ? gameManager.scenarioManager.drawRandomScenarioSection(gameManager.currentEdition()) : gameManager.scenarioManager.drawRandomScenario(gameManager.currentEdition());
    if (scenarioData) {
      this.dialog.open(EventRandomScenarioDialogComponent, {
        panelClass: ['dialog'],
        data: { scenario: scenarioData, section: section }
      }).closed.subscribe({
        next: (result: unknown) => {
          if (result) {
            const scenarioData = result as ScenarioData;
            if (section) {
              const unlocks = scenarioData.unlocks ? scenarioData.unlocks.map((unlock) => '%data.scenarioNumber:' + unlock + '%').join(', ') : '';
              gameManager.stateManager.before("eventEffect.drawRandomScenarioSection", scenarioData.index, scenarioData.edition, scenarioData.name, unlocks);
              gameManager.game.party.conclusions.push(new GameScenarioModel('' + scenarioData.index, scenarioData.edition, scenarioData.group));
              gameManager.stateManager.after();
            } else {
              gameManager.stateManager.before("eventEffect.drawRandomScenario", scenarioData.index, scenarioData.edition, scenarioData.name);
              gameManager.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
              gameManager.stateManager.after();
            }
          }
        }
      });
    } else if (section) {
      this.inspiration++;
    }
  }

  drawEvent(type: string) {
    this.dialog.open(EventCardDrawComponent, {
      panelClass: ['dialog'],
      data: {
        edition: gameManager.game.party.edition || gameManager.currentEdition(),
        type: type
      }
    }).closed.subscribe({
      next: (results: (EventCardEffect | EventCardCondition)[] | any) => {
        if (settingsManager.settings.eventsApply && results) {
          this.createEventResults(results);
        }
      }
    })
  }

  createEventResults(results: (EventCardEffect | EventCardCondition | EventCardAttack)[], initial: boolean = false) {
    this.eventEffectsManual = [];
    this.eventOutpostAttackEffects = [];
    this.eventConditionManual = [];
    this.eventAttack = undefined;
    results.forEach((result) => {
      if ('type' in result && result.type in EventCardEffectType) {
        if (result.type == EventCardEffectType.outpostAttack || result.type == EventCardEffectType.outpostTarget) {
          this.eventOutpostAttackEffects.push(result as EventCardEffect);
        } else {
          this.eventEffectsManual.push(result as EventCardEffect);
        }
      } else if ('type' in result && result.type in EventCardConditionType) {
        this.eventConditionManual.push(result as EventCardCondition);
      } else if (!('type' in result)) {
        this.eventAttack = result as EventCardAttack;
      }
    })
  }

  openOutpostAttack() {
    this.dialog.open(OutpostAttackComponent, {
      panelClass: ['dialog'],
      data: {
        attack: this.eventAttack,
        effects: this.eventOutpostAttackEffects
      }
    }).closed.subscribe({
      next: (result) => {
        if (result) {
          this.eventAttack = undefined;
          this.eventOutpostAttackEffects = [];
        }
      }
    })
  }

  close() {
    const characterIcons = this.activeCharacters.map((character) => '%game.characterIconColored.' + character.name + '%').join(',');

    this.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.new || entityCondition.state == EntityConditionState.removed).forEach((entityCondition) => {
      gameManager.stateManager.before(entityCondition.state == EntityConditionState.removed ? "eventEffect.removeCondition" : "eventEffect.addCondition", entityCondition.name, characterIcons);
      this.activeCharacters.forEach((character) => {
        if (entityCondition.state == EntityConditionState.removed) {
          gameManager.entityManager.removeCondition(character, character, entityCondition, entityCondition.permanent);
        } else {
          gameManager.entityManager.addCondition(character, character, entityCondition, entityCondition.permanent);
        }
      })

      this.characters.forEach((character) => {
        character.summons.forEach((summon) => {
          if (this.activeSummons.indexOf(summon) != -1) {
            if (entityCondition.state == EntityConditionState.removed) {
              gameManager.entityManager.removeCondition(summon, character, entityCondition, entityCondition.permanent);
            } else {
              gameManager.entityManager.addCondition(summon, character, entityCondition, entityCondition.permanent);
            }
          }
        })
      })
      gameManager.stateManager.after();
    })

    this.entityConditions.forEach((condition) => {
      if (this.activeCharacters.find((character) => character.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired && entityCondition.value != condition.value))) {
        gameManager.stateManager.before("eventEffect.setConditionValue", condition.name, "" + condition.value, characterIcons);
        this.activeCharacters.forEach((character) => {
          const entityCondition = character.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
          if (entityCondition && entityCondition.value != condition.value) {
            entityCondition.value = condition.value;
          }
        })

        this.characters.forEach((character) => {
          character.summons.forEach((summon) => {
            if (this.activeSummons.indexOf(summon) != -1) {
              const entityCondition = summon.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
              if (entityCondition && entityCondition.value != condition.value) {
                entityCondition.value = condition.value;
              }
            }
          })
        })
        gameManager.stateManager.after();
      }
    })

    this.immunities.forEach((immunity) => {
      if (this.newImmunities.indexOf(immunity) == -1) {
        gameManager.stateManager.before("eventEffect.removeImmunity", immunity, characterIcons);
        this.activeCharacters.forEach((character) => {
          character.immunities = character.immunities.filter((existing) => existing != immunity);
        })
        this.characters.forEach((character) => {
          character.summons.forEach((summon) => {
            if (this.activeSummons.indexOf(summon) != -1) {
              summon.immunities = summon.immunities.filter((existing) => existing != immunity);
            }
          })
        })
        gameManager.stateManager.after();
      }
    })

    this.newImmunities.forEach((immunity) => {
      if (this.immunities.indexOf(immunity) == -1) {
        gameManager.stateManager.before("eventEffect.addImmunity", immunity, characterIcons);
        this.activeCharacters.find((character) => {
          character.immunities.push(immunity);
        })
        this.characters.find((character) => {
          character.summons.forEach((summon) => {
            if (this.activeSummons.indexOf(summon) != -1) {
              summon.immunities.push(immunity);
            }
          })
        })
        gameManager.stateManager.after();
      }
    })

    if (this.minHealth() != 0 || this.maxHealth() != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterHP", ghsValueSign(this.minHealth() != 0 ? this.minHealth() : this.maxHealth()), characterIcons);
      this.activeCharacters.forEach((character, i) => {
        if (this.health[i] && this.health[i] != 0) {
          gameManager.entityManager.changeHealth(character, character, this.health[i]);
          this.health[i] = 0;
        }

        if (character.maxHealth > 0 && character.health <= 0 || character.exhausted) {
          character.exhausted = true;
        }
      })

      this.characters.forEach((character) => {
        character.summons.forEach((summon) => {
          const index = this.activeSummons.indexOf(summon);
          if (index != -1) {
            const i = this.activeCharacters.length + index;
            if (this.health[i] && this.health[i] != 0) {
              gameManager.entityManager.changeHealth(summon, character, this.health[i]);
              this.health[i] = 0;
            }
            if (summon.maxHealth > 0 && summon.health <= 0 || summon.dead) {
              summon.dead = true;
            }
          }
        })
      })
      gameManager.stateManager.after();
    }

    if (this.minExperience() != 0 || this.maxExperience() != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterXP", ghsValueSign(this.minExperience() != 0 ? this.minExperience() : this.maxExperience()), characterIcons);
      this.activeCharacters.forEach((character, i) => {
        if (this.experience[i] && this.experience[i] != 0) {
          character.progress.experience += this.experience[i];
          this.experience[i] = 0;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.minGold() != 0 || this.maxGold() != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterGold", ghsValueSign(this.minGold() != 0 ? this.minGold() : this.maxGold()), characterIcons);
      this.activeCharacters.forEach((character, i) => {
        if (this.gold[i] && this.gold[i] != 0) {
          character.progress.gold += this.gold[i];
          this.gold[i] = 0;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.minBattleGoals() != 0 || this.maxBattleGoals() != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterBattleGoals", ghsValueSign(this.minBattleGoals() != 0 ? this.minBattleGoals() : this.maxBattleGoals()), characterIcons);
      this.activeCharacters.forEach((character, i) => {
        if (this.battleGoals[i] && this.battleGoals[i] != 0) {
          character.progress.battleGoals += this.battleGoals[i];
          this.battleGoals[i] = 0;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.bless != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterBless", ghsValueSign(this.bless), characterIcons);
      let count = Math.abs(this.bless);
      let index = 0;

      while (count > 0) {
        const chararacter = this.activeCharacters[index % this.activeCharacters.length];

        if (this.bless < 0) {
          let card = chararacter.attackModifierDeck.cards.find((attackModifier, index) => {
            return attackModifier.type == AttackModifierType.bless && index > chararacter.attackModifierDeck.current;
          });
          if (card) {
            chararacter.attackModifierDeck.cards.splice(chararacter.attackModifierDeck.cards.indexOf(card), 1);
            count--;
          }
        } else {
          gameManager.attackModifierManager.addModifier(chararacter.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
          count--;
        }
        index++;
      }
      gameManager.stateManager.after();
    }

    if (this.curse != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterCurse", ghsValueSign(this.curse), characterIcons);
      let count = Math.abs(this.curse);
      let index = 0;

      while (count > 0) {
        const chararacter = this.activeCharacters[index % this.activeCharacters.length];

        if (this.curse < 0) {
          let card = chararacter.attackModifierDeck.cards.find((attackModifier, index) => {
            return attackModifier.type == AttackModifierType.curse && index > chararacter.attackModifierDeck.current;
          });
          if (card) {
            chararacter.attackModifierDeck.cards.splice(chararacter.attackModifierDeck.cards.indexOf(card), 1);
            count--;
          }
        } else {
          gameManager.attackModifierManager.addModifier(chararacter.attackModifierDeck, new AttackModifier(AttackModifierType.curse));
          count--;
        }
        index++;
      }
      gameManager.stateManager.after();
    }

    if (this.prosperity != 0) {
      gameManager.stateManager.before("eventEffect.prosperity", ghsValueSign(this.prosperity));
      gameManager.game.party.prosperity += this.prosperity;
      gameManager.stateManager.after();
    }

    if (this.reputation != 0) {
      gameManager.stateManager.before("eventEffect.reputation", ghsValueSign(this.reputation));
      gameManager.game.party.reputation += this.reputation;
      gameManager.stateManager.after();
    }

    if (this.morale != 0) {
      gameManager.stateManager.before("eventEffect.morale", ghsValueSign(this.morale));
      gameManager.game.party.morale += this.morale;
      gameManager.stateManager.after();
    }

    if (this.inspiration != 0) {
      gameManager.stateManager.before("eventEffect.inspiration", ghsValueSign(this.inspiration));
      gameManager.game.party.inspiration += this.inspiration;
      gameManager.stateManager.after();
    }

    this.lootColumns.forEach((type) => {
      if (this.minLoot(type) != 0 || this.maxLoot(type) != 0) {
        gameManager.stateManager.before("eventEffect.changeCharacterResource", type, ghsValueSign(this.minLoot(type) != 0 ? this.minLoot(type) : this.maxLoot(type)), characterIcons);
        this.activeCharacters.forEach((character, i) => {
          if (this.loot[i] && this.loot[i][type]) {
            character.progress.loot[type] = (character.progress.loot[type] || 0) + (this.loot[i][type] || 0);
            this.loot[i][type] = 0;
          }
        })
        gameManager.stateManager.after();
      }
    })
  }

  openFavors() {
    this.dialog.open(FavorsComponent, {
      panelClass: ['dialog']
    })
  }

  toggleImbuement(advanced: boolean = false) {
    if (gameManager.imbuementManager.imbuement) {
      gameManager.stateManager.before('gh2eImbuement.disable');
      gameManager.imbuementManager.disable(gameManager.game.monsterAttackModifierDeck);
    } else if (advanced) {
      gameManager.stateManager.before('gh2eImbuement.advanced');
      gameManager.imbuementManager.advanced(gameManager.game.monsterAttackModifierDeck);
    } else {
      gameManager.stateManager.before('gh2eImbuement');
      gameManager.imbuementManager.enable(gameManager.game.monsterAttackModifierDeck);
    }
    gameManager.stateManager.after();
  }

  setupEvents(type: string) {
    this.dialog.open(EventCardDeckComponent, {
      panelClass: ['dialog'],
      data: {
        type: type,
        edition: gameManager.game.edition || gameManager.currentEdition()
      }
    });
  }

  openPartySheet() {
    this.dialog.open(PartySheetDialogComponent, {
      panelClass: ['dialog-invert'],
      data: { partySheet: true }
    });
  }

  openCharacterSheet(character: Character) {
    this.dialog.open(CharacterSheetDialog, {
      panelClass: ['dialog-invert'],
      data: { character: character }
    });
  }
}