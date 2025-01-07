import { AttackModifier, AttackModifierType, CsOakDeckAttackModifier } from "src/app/game/model/data//AttackModifier";
import { FigureError, FigureErrorType } from "src/app/game/model/data//FigureError";
import { v4 as uuidv4 } from 'uuid';
import { Character } from "../model/Character";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
import { Summon, SummonColor, SummonState } from "../model/Summon";
import { Action, ActionType } from "../model/data/Action";
import { CharacterData } from "../model/data/CharacterData";
import { CharacterStat } from "../model/data/CharacterStat";
import { Condition, ConditionName } from "../model/data/Condition";
import { ItemData } from "../model/data/ItemData";
import { PersonalQuest } from "../model/data/PersonalQuest";
import { SummonData } from "../model/data/SummonData";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class CharacterManager {

  game: Game;
  xpMap: number[] = [0, 45, 95, 150, 210, 275, 345, 420, 500];

  constructor(game: Game) {
    this.game = game;
  }

  characterIcon(character: CharacterData | string): string {
    let characterData: CharacterData;
    if (character instanceof CharacterData) {
      characterData = character;
    } else {
      characterData = gameManager.getCharacterData(character);
    }

    if (characterData.iconUrl) {
      return characterData.iconUrl;
    }

    if (characterData.icon) {
      return './assets/images/character/icons/' + characterData.icon + '.svg';
    }

    return './assets/images/character/icons/' + characterData.edition + '-' + characterData.name + '.svg';
  }

  characterIdentityIcon(character: string, index: number): string {
    const characterData = gameManager.getCharacterData(character);
    if (!characterData.identities || characterData.identities.length == 0) {
      return this.characterIcon(character);
    }

    return './assets/images/character/icons/' + characterData.edition + '-' + characterData.name + '-' + characterData.identities[index] + '.svg';
  }

  characterName(character: Character, full: boolean = false, icon: boolean = false, identity: boolean = true): string {
    let name = settingsManager.getLabel('data.character.' + character.name);
    let hasTitle = false;
    if (identity && character.identities.length > 0 && settingsManager.settings.characterIdentities) {
      if (character.title && character.title.split('|')[character.identity] && character.title.split('|')[character.identity]) {
        name = character.title.split('|')[character.identity];
        hasTitle = true;
      } else if (settingsManager.settings.characterIdentityHint && !full) {
        name += " (" + settingsManager.getLabel('data.character.' + character.name + '.' + character.identities[character.identity]) + ")"
      }
    } else if (character.title) {
      name = character.title;
      hasTitle = true;
    }
    if (full && hasTitle) {
      name += " (" + settingsManager.getLabel('data.character.' + character.name) + ")";
    }

    if (icon) {
      name = '%game.characterIconColored.' + character.name + '%' + name;
    }

    if (this.game.figures.find((figure) => figure instanceof Character && figure.name == character.name && figure.edition != character.edition)) {
      name += " [" + settingsManager.getLabel('data.edition.' + character.edition) + "]";
    }

    return name;
  }

  characterColor(character: CharacterData | string): string {
    let characterData: CharacterData;
    if (character instanceof CharacterData) {
      characterData = character;
    } else {
      characterData = gameManager.getCharacterData(character);
    }

    return characterData.color;
  }

  characterThumbnail(characterData: CharacterData) {
    if (characterData.thumbnailUrl) {
      return characterData.thumbnailUrl;
    }

    if (characterData.thumbnail) {
      return './assets/images/character/thumbnail/' + characterData.thumbnail + '.png';
    }

    return './assets/images/character/thumbnail/' + characterData.edition + '-' + characterData.name + '.png';
  }

  characterCount(): number {
    if (this.game.playerCount > 0) {
      return this.game.playerCount;
    }

    return this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length;
  }

  addCharacter(characterData: CharacterData, level: number) {
    if (!this.game.figures.some((figure) => {
      return figure instanceof Character && figure.name == characterData.name && figure.edition == characterData.edition;
    })) {
      let character: Character = new Character(characterData, level);
      character.availableSummons.filter((summonData) => summonData.special).forEach((summonData) => this.createSpecialSummon(character, summonData));

      character.number = 1;
      while (gameManager.game.figures.some((figure) => figure instanceof Character && figure.number == character.number)) {
        character.number++;
      }

      if (this.game.party.retirements) {
        this.game.party.retirements.forEach((retirementModel) => {
          if (retirementModel.number == character.number) {
            character.progress.retirements++;
          }
        })
      }

      if (character.progress.gold == 0) {
        if (gameManager.fhRules()) {
          character.progress.gold = 10 * gameManager.prosperityLevel() + 20;
        } else if (!gameManager.editionRules('jotl')) {
          character.progress.gold = 15 * (character.level + 1);
        }
      }

      character.tags.push('new-character');

      this.game.figures.push(character);
      gameManager.addEntityCount(character);

      if (this.game.state == GameState.next) {
        gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);
      }
      gameManager.sortFigures(character);
    }
    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }
    gameManager.trialsManager.applyTrialCards();
  }

  removeCharacter(character: Character, retirement: boolean = false) {
    const index = this.game.figures.indexOf(character);
    if (index == -1) {
      return;
    }
    this.game.figures.splice(index, 1);

    if (retirement && settingsManager.settings.applyRetirement) {
      gameManager.game.party.prosperity += gameManager.fhRules() ? 2 : 1;
    }

    if (character.marker) {
      // remove marker
      const marker = character.edition + '-' + character.name;
      this.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          figure.markers.splice(figure.markers.indexOf(marker), 1);
          if (figure.summons) {
            figure.summons.forEach((summon) => {
              summon.markers.splice(summon.markers.indexOf(marker), 1);
            })
          }
        } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
          figure.entities.forEach((entity) => {
            entity.markers.splice(entity.markers.indexOf(marker), 1);
          })
        }
      })
    }
    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }
  }

  addSummon(character: Character, summon: Summon) {
    character.summons = character.summons.filter((value) => value.name != summon.name || value.number != summon.number || value.color != summon.color);
    character.summons.push(summon);

    if (character.name == 'boneshaper') {
      if (character.tags.indexOf('solid-bones') != -1 || character.tags.indexOf('unholy-prowess') != -1) {
        if (summon.name === 'shambling-skeleton') {
          summon.maxHealth += 1;
          if (summon.health == summon.maxHealth - 1) {
            summon.health = summon.maxHealth;
          }
          if (character.tags.indexOf('solid-bones') != -1) {
            summon.movement += 1;
            summon.action = new Action(ActionType.pierce, 1);
          }
        }
      }
    }
  }

  removeSummon(character: Character, summon: Summon) {
    character.summons.splice(character.summons.indexOf(summon), 1);
  }

  addXP(character: Character, value: number, levelUp: boolean = true) {
    character.progress.experience += value;
    if (levelUp) {
      this.setLevel(character, this.levelForXp(character.progress.experience));
    }
  }

  levelForXp(xp: number) {
    let level: number = 0;
    this.xpMap.forEach((value, index) => {
      if (xp >= value) {
        level = index + 1;
      }
    });
    return level;
  }

  setLevel(character: Character, level: number) {
    const stat = character.stats.find((characterStat) => characterStat.level == level)
    if (!stat) {
      character.errors = character.errors || [];
      if (!character.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !character.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("No character stat found for level: " + level);
        character.errors.push(new FigureError(FigureErrorType.stat, "character", character.name, character.edition, "", "" + level));
      }
      character.stat = new CharacterStat(level, 0);
    } else {
      character.stat = stat;
    }

    character.level = level;

    const adjustHealth = character.health == character.maxHealth;

    character.maxHealth = character.stat.health;

    if (character.name == 'shackles' && character.edition == 'fh' && character.progress.perks[11] == 2) {
      character.maxHealth += 5;
    }

    if (character.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '3')) {
      character.maxHealth += 1;
      character.health += 1;
    }

    if (character.health > character.maxHealth || adjustHealth) {
      character.health = character.maxHealth;
    }

    character.availableSummons.filter((summonData) => summonData.special).forEach((summonData) => this.createSpecialSummon(character, summonData));

    if (character.progress.experience < gameManager.characterManager.xpMap[level - 1] || character.progress.experience >= gameManager.characterManager.xpMap[level]) {
      character.progress.experience = gameManager.characterManager.xpMap[level - 1];
    }

    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }

    if (character.bb) {
      character.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(character);
    }
  }

  createSpecialSummon(character: Character, summonData: SummonData) {
    character.summons = character.summons.filter((summon) => summon.name != summonData.name || summon.number != 0 || summon.color != SummonColor.custom);
    if (!summonData.level || summonData.level <= character.level) {
      let summon: Summon = new Summon(uuidv4(), summonData.name, summonData.cardId, character.level, 0, SummonColor.custom, summonData);
      summon.state = SummonState.true;
      summon.init = false;
      this.addSummon(character, summon);
    }
  }

  ignoreNegativeItemEffects(character: Character): boolean {
    let perk = character.perks.find((perk) => perk.custom && (perk.custom.indexOf('%game.custom.perks.ignoreNegativeItem%') != -1 || perk.custom.indexOf('%game.custom.perks.ignoreNegativeItemFh%') != -1));
    if (!perk) {
      return false;
    } else {
      const perkIndex = character.perks.indexOf(perk);
      return character.progress.perks[perkIndex] && perk.combined ? (character.progress.perks[perkIndex] == perk.count) : character.progress.perks[perkIndex] > 0;
    }
  }

  ignoreNegativeScenarioffects(character: Character): boolean {
    let perk = character.perks.find((perk) => perk.custom && (perk.custom.indexOf('%game.custom.perks.ignoreNegativeScenario%') != -1 || perk.custom.indexOf('%game.custom.perks.ignoreScenario%') != -1));
    if (!perk) {
      return false;
    } else {
      const perkIndex = character.perks.indexOf(perk);
      return character.progress.perks[perkIndex] && perk.combined ? (character.progress.perks[perkIndex] == perk.count) : character.progress.perks[perkIndex] > 0;
    }
  }

  itemEffect(itemData: ItemData): boolean {
    if (itemData.edition == 'gh') {
      return typeof itemData.id === 'number' && [16, 38, 52, 101, 103, 108].indexOf(itemData.id) != -1;
    } else if (itemData.edition == 'cs') {
      return typeof itemData.id === 'number' && [157, 71].indexOf(itemData.id) != -1;
    } else if (itemData.edition == 'toa') {
      return typeof itemData.id === 'number' && [101, 107].indexOf(itemData.id) != -1;
    } else if (itemData.edition == 'fh') {
      return typeof itemData.id === 'number' && [3, 11, 41, 60, 132, 138, 178].indexOf(itemData.id) != -1;
    }
    return false;
  }

  applyDonations(character: Character) {
    for (let i = 0; i < character.donations; i++) {
      if (gameManager.editionRules('cs')) {
        const oakDouble = CsOakDeckAttackModifier.filter((attackModifier) => !attackModifier.rolling && !this.game.figures.find((figure) => figure instanceof Character && figure.attackModifierDeck.cards.find((am) => am.id == attackModifier.id)));
        const oakRolling = CsOakDeckAttackModifier.filter((attackModifier) => attackModifier.rolling && !this.game.figures.find((figure) => figure instanceof Character && figure.attackModifierDeck.cards.find((am) => am.id == attackModifier.id)));

        if (oakDouble.length > 0) {
          gameManager.attackModifierManager.addModifier(character.attackModifierDeck, oakDouble[Math.floor(Math.random() * oakDouble.length)]);
        }
        if (oakRolling.length > 0) {
          gameManager.attackModifierManager.addModifier(character.attackModifierDeck, oakRolling[Math.floor(Math.random() * oakRolling.length)]);
        }
      } else {
        gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
        gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
      }
    }

    character.donations = 0;
  }

  next() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.initiative = 0;
        figure.initiativeVisible = false;
        figure.off = false;
        if (!settingsManager.settings.characterAttackModifierDeckPermanent) {
          figure.attackModifierDeckVisible = false;
        }
        figure.lootCardsVisible = false;
        figure.longRest = false;

        figure.summons = figure.summons.filter((summon) => gameManager.entityManager.isAlive(summon));

        figure.summons.forEach((summon) => {
          if (summon.state == SummonState.new) {
            summon.state = SummonState.true;
          }
        });

        if (figure instanceof Character && figure.name == 'blinkblade' && figure.tags.find((tag) => tag === 'time_tokens') && figure.primaryToken == 0) {
          figure.identity = 0;
        }

        if (figure.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '57') && gameManager.entityManager.hasCondition(figure, new Condition(ConditionName.wound)) && !gameManager.entityManager.hasCondition(figure, new Condition(ConditionName.regenerate))) {
          gameManager.entityManager.addCondition(figure, figure, new Condition(ConditionName.regenerate));
        }

        if (figure.tags) {
          figure.tags = figure.tags.filter((tag) => !tag.startsWith('roundAction-'));
        }

        if (gameManager.trialsManager.apply && gameManager.trialsManager.trialsEnabled && settingsManager.settings.battleGoals && figure.progress.trial && figure.progress.trial.edition == 'fh' && figure.progress.trial.name == '356' && figure.tags.indexOf('trial-fh-356') != -1) {
          figure.tags.splice(figure.tags.indexOf('trial-fh-356'), 1);
          gameManager.battleGoalManager.drawBattleGoal(figure, true);
        }
      }
    })
  }

  draw() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        if (this.game.round == 1) {
          this.applyDonations(figure);
          figure.initiativeVisible = true;
        }

        if (gameManager.entityManager.isAlive(figure) && !figure.absent) {
          figure.off = false;
        }

        if (figure.name == 'blinkblade' && figure.tags.find((tag) => tag === 'time_tokens') && figure.primaryToken == 0) {
          if (figure.identity == 0 && figure.tokenValues[0] < 2) {
            figure.tokenValues[0] += 1;
          } else if (figure.identity == 1) {
            if (figure.tokenValues[0] > 0) {
              figure.tokenValues[0] -= 1;
            } else {
              figure.identity = 0;
              figure.tokenValues[0] = 1;
            }
          }
        }

        if (gameManager.trialsManager.apply && gameManager.trialsManager.trialsEnabled && settingsManager.settings.battleGoals && figure.progress.trial && figure.progress.trial.edition == 'fh' && figure.progress.trial.name == '356' && figure.tags.indexOf('trial-fh-356') != -1) {
          figure.tags.splice(figure.tags.indexOf('trial-fh-356'), 1);
        }
      }
    })
  }

  personalQuestByCard(edition: string, cardId: string): PersonalQuest | undefined {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1).flatMap((editionData) => editionData.personalQuests).find((pq) => pq.cardId == cardId || pq.altId == cardId || pq.altId == '0' + cardId);
  }
}
