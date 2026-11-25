import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import {
  additionalTownGuardAttackModifier,
  AttackModifier,
  AttackModifierDeck,
  AttackModifierType,
  AttackModifierValueType,
  defaultAttackModifier,
  defaultTownGuardAttackModifier,
  GameAttackModifierDeckModel,
  RpgAttackModifier,
  RpgAttackModifierCards
} from 'src/app/game/model/data/AttackModifier';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CampaignData } from 'src/app/game/model/data/EditionData';
import { Perk, PerkCard, PerkType } from 'src/app/game/model/data/Perks';
import { Game } from 'src/app/game/model/Game';
import { Party } from 'src/app/game/model/Party';

export class AttackModifierBuildManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  buildMonsterAttackModifierDeck(ally: boolean = false): AttackModifierDeck {
    const attackModifierDeck = gameManager.attackModifierManager.defaultDeck();
    if (!ally) {
      if (settingsManager.settings.gh2eImbuementKeep) {
        if (gameManager.imbuementManager.imbuement === 'advanced') {
          gameManager.imbuementManager.advanced(attackModifierDeck, false);
        } else if (gameManager.imbuementManager.imbuement) {
          gameManager.imbuementManager.enable(attackModifierDeck, false);
        }
      }

      this.game.figures.forEach((figure) => {
        if (figure instanceof Character && figure.perks && figure.perks.find((perk) => perk.monsterDeck)) {
          gameManager.attackModifierBuildManager.applyCharacterPerks(figure, attackModifierDeck, true);
        }
      });
    }
    return attackModifierDeck;
  }

  bbMonsterAttackModifiers(): AttackModifier[] | undefined {
    const editionData = gameManager.editionManager.editionData.find(
      (editionData) => editionData.edition === 'bb' && editionData.monsterAmTables && editionData.monsterAmTables.length
    );
    return editionData
      ? editionData.monsterAmTables[gameManager.levelManager.bbMonsterDifficutly()].map(
          (value) => new AttackModifier(value as AttackModifierType)
        )
      : undefined;
  }

  defaultMonsterAttackModifierDeck(ally: boolean = false): AttackModifierDeck {
    if (!gameManager.bbRules()) {
      return this.buildMonsterAttackModifierDeck(ally);
    }
    const attackModifiers = this.bbMonsterAttackModifiers();
    return attackModifiers
      ? new AttackModifierDeck(attackModifiers, settingsManager.settings.bbAm)
      : this.buildMonsterAttackModifierDeck(ally);
  }

  buildCharacterAttackModifierDeck(character: Character): AttackModifierDeck {
    if (
      character.editionRules === 'bb' &&
      character.amTables &&
      character.amTables.length >= character.level &&
      character.amTables[character.level - 1]
    ) {
      return new AttackModifierDeck(
        character.amTables[character.level - 1].map((value, index) => {
          if (typeof value === 'string') {
            const am = new AttackModifier(value as AttackModifierType);
            am.character = true;
            return am;
          } else {
            const am: AttackModifier = value as AttackModifier;
            am.character = true;
            am.id = 'bb-' + character.level + '-' + index;
            return am;
          }
        }),
        settingsManager.settings.bbAm
      );
    }

    const attackModifierDeck = gameManager.characterRpgManager.isRpgCharacter(character)
      ? new AttackModifierDeck(RpgAttackModifierCards)
      : new AttackModifierDeck();
    this.applyCharacterPerks(character, attackModifierDeck);
    return attackModifierDeck;
  }

  applyCharacterPerks(character: Character, attackModifierDeck: AttackModifierDeck, monsterDeck: boolean = false) {
    let perkId = 0;
    const baseAttackModifier = (monsterDeck ? gameManager.rpgRules() : gameManager.characterRpgManager.isRpgCharacter(character))
      ? RpgAttackModifier
      : defaultAttackModifier;
    character.perks.forEach((perk) => {
      if (!!perk.monsterDeck === monsterDeck && perk.cards) {
        perk.cards.forEach((card, index) => {
          if (perk.type === PerkType.add || perk.type === PerkType.replace) {
            const am = Object.assign(new AttackModifier(card.attackModifier.type), card.attackModifier);
            am.id = 'perk' + perkId;
            am.shuffle = card.attackModifier.shuffle || false;
            if (
              !gameManager.attackModifierManager.findByAttackModifier(baseAttackModifier, am) ||
              perk.type === PerkType.add ||
              index > 0
            ) {
              am.character = true;
            }
            if (!gameManager.attackModifierManager.findByAttackModifier(attackModifierDeck.attackModifiers, am)) {
              perkId++;
              attackModifierDeck.attackModifiers.push(am);
            }
          }
        });
      }
    });

    if (character.progress && character.progress.perks) {
      character.progress.perks.forEach((checked, index) => {
        const perk = character.perks[index];
        if (!perk) {
          // error
          return;
        }
        if (!!perk.monsterDeck === monsterDeck) {
          if (perk.combined) {
            if (checked === perk.count) {
              this.addPerkCard(perk, attackModifierDeck, baseAttackModifier);
            }
          } else {
            for (let check = 0; check < checked; check++) {
              this.addPerkCard(perk, attackModifierDeck, baseAttackModifier);
            }
          }
        }
      });
    }

    if (!monsterDeck) {
      if (
        gameManager.trialsManager.apply &&
        gameManager.trialsManager.trialsEnabled &&
        character.progress.trial &&
        character.progress.trial.edition === 'fh' &&
        character.progress.trial.name === '348'
      ) {
        attackModifierDeck.cards = new AttackModifierDeck().cards.filter(
          (am) => ![AttackModifierType.double, AttackModifierType.plus1, AttackModifierType.plus2].includes(am.type)
        );
      }

      if (!gameManager.characterManager.ignoreNegativeItemEffects(character)) {
        for (const itemIdentifier of character.progress.equippedItems) {
          const itemData = gameManager.itemManager.getItem(itemIdentifier.name, itemIdentifier.edition, true);
          if (itemData && itemData.minusOne) {
            gameManager.attackModifierManager.addModifierBatch(
              attackModifierDeck,
              gameManager.attackModifierManager.getExtraMinus1(itemData.minusOne)
            );
          }
        }
      }

      if (character.progress.equippedItems.find((identifier) => identifier.edition === 'gh' && identifier.name === '101')) {
        let minus1 = attackModifierDeck.cards.find((am) => am.id === AttackModifierType.minus1);
        if (minus1) {
          attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus1), 1);
          minus1 = attackModifierDeck.cards.find((am) => am.id === AttackModifierType.minus1);
          if (minus1) {
            attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus1), 1);
          }
        }
      }

      if (character.progress.equippedItems.find((identifier) => identifier.edition === 'toa' && identifier.name === '107')) {
        const minus2 = attackModifierDeck.cards.find((am) => am.id === AttackModifierType.minus2);
        if (minus2) {
          attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus2), 1);
        }
      }

      if (character.progress.equippedItems.find((identifier) => identifier.edition === 'fh' && identifier.name === '11')) {
        const minus1 = attackModifierDeck.cards.find((am) => am.id === AttackModifierType.minus1);
        if (minus1) {
          attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus1), 1);
        }
      }

      if (character.progress.equippedItems.find((identifier) => identifier.edition === 'fh' && identifier.name === '41')) {
        const plus0 = attackModifierDeck.cards.find((am) => am.id === AttackModifierType.plus0);
        if (plus0) {
          attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(plus0), 1);
        }

        const minus1 = attackModifierDeck.cards.find((am) => am.id === AttackModifierType.minus1);
        if (minus1) {
          attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus1), 1);
        }
      }
    }
  }

  buildTownGuardAttackModifierDeck(party: Party, campaignData: CampaignData): AttackModifierDeck {
    const defaultTownGuardDeck = defaultTownGuardAttackModifier.map((am) => Object.assign(new AttackModifier(am.type), am));
    const attackModifierDeck = new AttackModifierDeck(defaultTownGuardDeck);
    attackModifierDeck.attackModifiers.push(...additionalTownGuardAttackModifier);

    let perkId = 0;
    if (campaignData.townGuardPerks) {
      campaignData.townGuardPerks.forEach((townGuardPerk) => {
        const perk = townGuardPerk.perk;
        if (perk.cards) {
          perk.cards.forEach((card, index) => {
            if (perk.type === PerkType.add || perk.type === PerkType.replace) {
              const am = Object.assign(
                new AttackModifier(card.attackModifier.type, card.attackModifier.value, card.attackModifier.valueType),
                card.attackModifier
              );
              am.id = 'perk' + perkId;
              if (
                !gameManager.attackModifierManager.findByAttackModifier(defaultTownGuardDeck, am) ||
                perk.type === PerkType.add ||
                index > 0
              ) {
                am.character = true;
              }
              if (!gameManager.attackModifierManager.findByAttackModifier(attackModifierDeck.attackModifiers, am)) {
                perkId++;
                attackModifierDeck.attackModifiers.push(am);
              }
            }
          });
        }
      });

      if (party.townGuardPerkSections) {
        campaignData.townGuardPerks.forEach((townGuardPerk) => {
          const perk = townGuardPerk.perk;
          if (!perk) {
            // error
            return;
          }
          const checked = townGuardPerk.sections.filter((section) => party.townGuardPerkSections.includes(section)).length;
          if (perk.combined) {
            if (checked === perk.count) {
              this.addPerkCard(perk, attackModifierDeck, defaultTownGuardDeck);
            }
          } else {
            for (let check = 0; check < checked; check++) {
              this.addPerkCard(perk, attackModifierDeck, defaultTownGuardDeck);
            }
          }
        });
      }

      party.scenarios.forEach((scenarioModel) => {
        const scenarioData = gameManager.scenarioManager.scenarioDataForModel(scenarioModel);
        if (scenarioData && scenarioData.rewards && scenarioData.rewards.townGuardAm) {
          scenarioData.rewards.townGuardAm.forEach((id) => {
            const am = attackModifierDeck.attackModifiers.find((attackModifier) => attackModifier.id === id);
            if (am) {
              attackModifierDeck.cards = [...attackModifierDeck.cards, Object.assign(new AttackModifier(am.type), am)];
            } else {
              console.warn('Unknown Town Guard AM:', id);
            }
          });
        }
      });

      party.conclusions.forEach((sectionModel) => {
        const sectionData = gameManager.scenarioManager.sectionDataForModel(sectionModel);
        if (sectionData && sectionData.rewards && sectionData.rewards.townGuardAm) {
          sectionData.rewards.townGuardAm.forEach((id) => {
            const am = attackModifierDeck.attackModifiers.find((attackModifier) => attackModifier.id === id);
            if (am) {
              attackModifierDeck.cards = [...attackModifierDeck.cards, Object.assign(new AttackModifier(am.type), am)];
            } else {
              console.warn('Unknown Town Guard AM:', id);
            }
          });
        }
      });
    }

    return attackModifierDeck;
  }

  addPerkCard(perk: Perk, attackModifierDeck: AttackModifierDeck, characterCards: AttackModifier[]) {
    perk.cards = perk.cards || [];

    perk.cards.forEach((card, index) => {
      if (
        !gameManager.attackModifierManager.findByAttackModifier(characterCards, card.attackModifier) ||
        perk.type === PerkType.add ||
        (perk.type === PerkType.replace && index >= this.replaceCount(perk))
      ) {
        card.attackModifier.character = true;
      }
    });

    if (perk.type === PerkType.add) {
      this.addCards(attackModifierDeck, perk.cards);
    } else if (perk.type === PerkType.remove) {
      this.removeCards(attackModifierDeck, perk.cards);
    } else if (perk.type === PerkType.replace) {
      const count = this.replaceCount(perk);
      if (count) {
        this.removeCards(attackModifierDeck, perk.cards.slice(0, count));
        this.addCards(attackModifierDeck, perk.cards.slice(count, perk.cards.length));
      }
    }
  }

  perkCards(characterData: CharacterData): AttackModifier[] {
    const attackModifiers: AttackModifier[] = [];
    characterData.perks.forEach((perk) => {
      for (let i = 0; i < (perk.combined ? 1 : perk.count); i++) {
        if (perk.cards) {
          perk.cards.forEach((card, index) => {
            if (perk.type === PerkType.add || (perk.type === PerkType.replace && index >= this.replaceCount(perk))) {
              attackModifiers.push(Object.assign(new AttackModifier(card.attackModifier.type), card.attackModifier));
            }
          });
        }
      }
    });
    return attackModifiers;
  }

  replaceCount(perk: Perk): number {
    if (perk.replaceCount) {
      return perk.replaceCount;
    }

    let count: number = 0;
    if (perk.type === PerkType.replace) {
      count = 1;
      perk.cards.forEach((card, index, self) => {
        let count = self
          .slice(0, index + 1)
          .map((a) => a.count)
          .reduce((a, b) => a + b);
        if (
          index < self.length - 1 &&
          count <=
            self
              .slice(index + 1, self.length)
              .map((a) => a.count)
              .reduce((a, b) => a + b)
        ) {
          count = index + 1;
        }
      });
    }
    return count;
  }

  addCards(attackModifierDeck: AttackModifierDeck, cards: PerkCard[]) {
    cards.forEach((card) => {
      for (let cardCount = 0; cardCount < card.count; cardCount++) {
        const toAdd = gameManager.attackModifierManager.findByAttackModifier(attackModifierDeck.attackModifiers, card.attackModifier);
        if (toAdd) {
          const attackModifier = Object.assign(new AttackModifier(toAdd.type), toAdd);
          attackModifierDeck.cards = [...attackModifierDeck.cards, attackModifier];
        } else {
          console.warn('Did not found AM to add: ', card.attackModifier, attackModifierDeck);
        }
      }
    });
  }

  removeCards(attackModifierDeck: AttackModifierDeck, cards: PerkCard[]) {
    cards.forEach((card) => {
      for (let cardCount = 0; cardCount < card.count; cardCount++) {
        let removed: boolean = false;
        let toRemove = gameManager.attackModifierManager.findByAttackModifier(attackModifierDeck.cards, card.attackModifier);
        if (toRemove) {
          const replaceIndex = attackModifierDeck.cards.indexOf(toRemove);
          attackModifierDeck.cards.splice(replaceIndex, 1);
          removed = true;
        } else if (!card.attackModifier.id && !card.attackModifier.character) {
          toRemove = gameManager.attackModifierManager.findByAttackModifier(attackModifierDeck.cards, card.attackModifier, true);
          if (toRemove) {
            const replaceIndex = attackModifierDeck.cards.indexOf(toRemove);
            attackModifierDeck.cards.splice(replaceIndex, 1);
            removed = true;
          }
        }

        if (!removed) {
          console.warn('Did not found AM to remove: ', card.attackModifier, attackModifierDeck);
        }
      }
    });
  }

  mergeAttackModifierDeck(sourceDeck: AttackModifierDeck, attackModifierDeck: AttackModifierDeck): boolean {
    let changed = false;
    if (!sourceDeck) {
      sourceDeck = new AttackModifierDeck();
      changed = true;
    }

    if (
      attackModifierDeck.discarded.length !== sourceDeck.discarded.length ||
      !attackModifierDeck.discarded.every((value, index) => sourceDeck.discarded.indexOf(value) === index)
    ) {
      sourceDeck.discarded = attackModifierDeck.discarded;
      changed = true;
    }

    if (sourceDeck.current !== attackModifierDeck.current) {
      sourceDeck.current = attackModifierDeck.current;
      changed = true;
    }

    if (sourceDeck.lastVisible !== attackModifierDeck.lastVisible) {
      sourceDeck.lastVisible = attackModifierDeck.lastVisible;
      changed = true;
    }

    if (sourceDeck.state !== attackModifierDeck.state) {
      sourceDeck.state = attackModifierDeck.state;
      changed = true;
    }

    if (
      sourceDeck.attackModifiers.length !== attackModifierDeck.attackModifiers.length ||
      !sourceDeck.attackModifiers.map((card) => card.id).every((cardId, index) => attackModifierDeck.attackModifiers[index].id === cardId)
    ) {
      sourceDeck.attackModifiers = attackModifierDeck.attackModifiers;
      changed = true;
    }
    if (
      sourceDeck.cards.length !== attackModifierDeck.cards.length ||
      !sourceDeck.cards.map((card) => card.id).every((cardId, index) => attackModifierDeck.cards[index].id === cardId)
    ) {
      sourceDeck.cards = attackModifierDeck.cards;
      changed = true;
    }

    return changed;
  }

  fromModel(attackModifierDeck: AttackModifierDeck, model: GameAttackModifierDeckModel) {
    attackModifierDeck.current = model.current;
    attackModifierDeck.lastVisible = model.lastVisible;

    // migration
    model.cards = model.cards.map((id) => {
      if (id === 'success') {
        id = 'tg-success';
      } else if (id === 'wreck') {
        id = 'tg-wreck';
      } else if (id === 'scenario-reward-55-0') {
        id = 'fh-tg-add-plus50-algox';
      } else if (id === 'scenario-reward-56-0') {
        id = 'fh-tg-add-plus50';
      } else if (id === 'scenario-reward-57-0') {
        id = 'fh-tg-add-plus50';
      } else if (id === 'scenario-reward-58-0') {
        id = 'fh-tg-add-plus50-unfettered';
      } else if (id === 'scenario-reward-59-0') {
        id = 'fh-tg-add-plus50-unfettered';
      } else if (id === 'scenario-reward-60-0') {
        id = 'fh-tg-add-plus50-lurkers';
      } else if (id === 'conclusion-reward-50.2-0') {
        id = 'fh-tg-add-plus20';
      }

      return id;
    });

    attackModifierDeck.cards = model.cards.map(
      (id) =>
        gameManager.attackModifierManager.cardById(attackModifierDeck, id) ||
        new AttackModifier(AttackModifierType.invalid, 0, AttackModifierValueType.default, id)
    );
    attackModifierDeck.discarded = model.discarded || model.disgarded || [];

    if (!!model.revealed) {
      model.revealed.forEach((value, i) => {
        if (!!attackModifierDeck.cards[i]) {
          attackModifierDeck.cards[i].revealed = value;
        }
      });
    }

    attackModifierDeck.active = model.active;
    attackModifierDeck.state = model.state;
    attackModifierDeck.bb = model.bb;
  }
}
