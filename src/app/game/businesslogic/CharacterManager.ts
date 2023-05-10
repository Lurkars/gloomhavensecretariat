import { AttackModifier, AttackModifierType, CsOakDeckAttackModifier } from "src/app/game/model/data//AttackModifier";
import { Character } from "../model/Character";
import { CharacterStat } from "../model/data/CharacterStat";
import { Condition, ConditionName } from "../model/Condition";
import { CharacterData } from "../model/data/CharacterData";
import { ItemData } from "../model/data/ItemData";
import { ObjectiveData, ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { SummonData } from "../model/data/SummonData";
import { EntityValueFunction } from "../model/Entity";
import { FigureError, FigureErrorType } from "src/app/game/model/data//FigureError";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { Objective } from "../model/Objective";
import { Summon, SummonColor, SummonState } from "../model/Summon";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";
import { v4 as uuidv4 } from 'uuid';

export class CharacterManager {

  game: Game;
  xpMap: number[] = [0, 45, 95, 150, 210, 275, 345, 420, 500];

  constructor(game: Game) {
    this.game = game;
  }

  characterIcon(character: string): string {
    const characterData = gameManager.getCharacterData(character);
    if (characterData.iconUrl) {
      return characterData.iconUrl;
    }

    if (characterData.icon) {
      return './assets/images/character/icons/' + characterData.icon + '.svg';
    }

    return './assets/images/character/icons/' + characterData.edition + '-' + characterData.name + '.svg';
  }

  characterIdentityIcon(character: Character, index: number = -1): string {
    if (!character.identities || character.identities.length == 0) {
      return this.characterIcon(character.name);
    }

    if (index == -1) {
      index = character.identity || 0;
    }

    return './assets/images/character/icons/' + character.edition + '-' + character.name + '-' + character.identities[index] + '.svg';
  }

  characterName(character: Character, full: boolean = false): string {
    let name = settingsManager.getLabel('data.character.' + character.name);
    let hasTitle = false;
    if (character.identities.length > 0 && settingsManager.settings.characterIdentities) {
      if (character.title && character.title.split('|')[character.identity]) {
        name = character.title.split('|')[character.identity];
        hasTitle = true;
      } else if (settingsManager.settings.characterIdentityHint) {
        name += " (" + settingsManager.getLabel('data.character.' + character.name + '.' + character.identities[character.identity]) + ")"
      }
    } else if (character.title) {
      name = character.title;
      hasTitle = true;
    }
    if (full && hasTitle) {
      name += " (" + settingsManager.getLabel('data.character.' + character.name) + ")";
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

      if (character.progress.gold == 0) {
        if (gameManager.fhRules()) {
          character.progress.gold = 10 * gameManager.prosperityLevel() + 20;
        } else if (!gameManager.editionRules('jotl')) {
          character.progress.gold = 15 * (character.level + 1);
        }
      }

      this.game.figures.push(character);
      gameManager.addEntityCount(character);

      if (this.game.state == GameState.next) {
        gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);
      }
      gameManager.sortFigures();
    }
    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }
  }

  removeCharacter(character: Character) {
    this.game.figures.splice(this.game.figures.indexOf(character), 1);

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
        } else if (figure instanceof Objective) {
          figure.markers.splice(figure.markers.indexOf(marker), 1);
        } else if (figure instanceof Monster) {
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
  }

  removeSummon(character: Character, summon: Summon) {
    character.summons.splice(character.summons.indexOf(summon), 1);
  }


  addObjective(objectiveData: ObjectiveData | undefined = undefined, name: string | undefined = undefined, objectiveId: ScenarioObjectiveIdentifier | undefined = undefined): Objective {
    const objectiveCount = gameManager.game.figures.filter((figure) => figure instanceof Objective).length;
    let id = objectiveCount % 12;
    if (objectiveCount < 12) {
      while (this.game.figures.some((figure) => figure instanceof Objective && figure.id == id)) {
        id++;
      }
    }

    let objective = new Objective(uuidv4(), id, objectiveId);

    if (objectiveData) {
      if (objectiveData.id && objectiveData.id != -1) {
        objective.id = objectiveData.id;
      }
      objective.marker = objectiveData.marker;
      objective.tags = objectiveData.tags;
      objective.name = objectiveData.name;
      if (name) {
        objective.name = name;
      }
      objective.maxHealth = objectiveData.health;
      objective.health = EntityValueFunction("" + objectiveData.health);
      objective.escort = objectiveData.escort;
      if (objectiveData.initiative) {
        objective.initiative = objectiveData.initiative;
      }
    }

    this.game.figures.push(objective);
    gameManager.addEntityCount(objective);
    gameManager.sortFigures();
    return objective;
  }

  removeObjective(objective: Objective) {
    this.game.figures.splice(this.game.figures.indexOf(objective), 1);
  }

  addXP(character: Character, value: number, levelUp: boolean = true) {
    character.progress.experience += value;
    if (levelUp) {
      this.xpMap.forEach((value, index) => {
        if (character.progress.experience >= value && (index < this.xpMap.length - 1 && character.progress.experience < this.xpMap[index + 1] || index == this.xpMap.length - 1)) {
          this.setLevel(character, index + 1);
        }
      })
    }
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

    if (character.health == character.maxHealth) {
      character.health = character.stat.health;
    }

    character.maxHealth = character.stat.health;
    if (character.health > character.maxHealth) {
      character.health = character.maxHealth;
    }

    character.availableSummons.filter((summonData) => summonData.special).forEach((summonData) => this.createSpecialSummon(character, summonData));

    if (character.progress.experience < gameManager.characterManager.xpMap[level - 1] || character.progress.experience >= gameManager.characterManager.xpMap[level]) {
      character.progress.experience = gameManager.characterManager.xpMap[level - 1];
    }

    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
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

  applyItemEffects(character: Character) {
    if (character.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '3')) {
      const stats = gameManager.getCharacterData(character.name, character.edition).stats.find((stats) => stats.level == character.level);
      if (stats && character.maxHealth <= stats.health) {
        character.maxHealth = stats.health + 1;
        character.health = character.maxHealth;
      }
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
      return [16, 38, 52, 101, 103, 108].indexOf(itemData.id) != -1;
    } else if (itemData.edition == 'cs') {
      return [157, 71].indexOf(itemData.id) != -1;
    } else if (itemData.edition == 'toa') {
      return [101, 107].indexOf(itemData.id) != -1;
    } else if (itemData.edition == 'fh') {
      return [3, 11, 41, 60, 132, 138].indexOf(itemData.id) != -1;
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
        figure.attackModifierDeckVisible = false;
        figure.lootCardsVisible = false;
        figure.longRest = false;

        figure.summons = figure.summons.filter((summon) => gameManager.entityManager.isAlive(summon));

        figure.summons.forEach((summon) => {
          if (summon.state == SummonState.new) {
            summon.state = SummonState.true;
          }
        });

        if (figure.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '57') && gameManager.entityManager.hasCondition(figure, new Condition(ConditionName.wound)) && !gameManager.entityManager.hasCondition(figure, new Condition(ConditionName.regenerate))) {
          gameManager.entityManager.addCondition(figure, new Condition(ConditionName.regenerate), figure.active, figure.off);
        }

      } else if (figure instanceof Objective) {
        figure.off = false;
      }
    })
  }

  draw() {
    if (this.game.round == 1) {
      this.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          this.applyItemEffects(figure);
          this.applyDonations(figure);
          figure.initiativeVisible = true;
        }
      })
    }

    this.game.figures.forEach((figure) => {
      if (figure instanceof Character || figure instanceof Objective) {
        if (gameManager.entityManager.isAlive(figure) && (!(figure instanceof Character) || !figure.absent)) {
          figure.off = false;
        }
      }
    })
  }

}
