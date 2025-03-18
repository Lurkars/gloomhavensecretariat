import { AttackModifier, AttackModifierDeck, AttackModifierType, AttackModifierValueType, CsOakDeckAttackModifier, GameAttackModifierDeckModel, additionalTownGuardAttackModifier, defaultAttackModifier, defaultTownGuardAttackModifier } from "src/app/game/model/data/AttackModifier";
import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Character } from "../model/Character";
import { CharacterData } from "../model/data/CharacterData";
import { CampaignData } from "../model/data/EditionData";
import { Perk, PerkCard, PerkType } from "../model/data/Perks";
import { Figure } from "../model/Figure";
import { Game } from "../model/Game";
import { Monster } from "../model/Monster";
import { Party } from "../model/Party";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class AttackModifierManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  byFigure(figure: Figure): AttackModifierDeck {
    if (figure instanceof Character) {
      return figure.attackModifierDeck;
    } else if (figure instanceof Monster) {
      return (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules()) && (figure.isAlly || figure.isAllied) ? this.game.allyAttackModifierDeck : this.game.monsterAttackModifierDeck;
    }

    return new AttackModifierDeck();
  }

  countUpcomingBlesses(): number {
    let count = 0;
    if (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied))) {
      count += gameManager.game.allyAttackModifierDeck.cards.filter((attackModifier, index) => {
        return attackModifier.type == AttackModifierType.bless && index > gameManager.game.allyAttackModifierDeck.current;
      }).length;
    }

    count += gameManager.game.monsterAttackModifierDeck.cards.filter((attackModifier, index) => {
      return attackModifier.type == AttackModifierType.bless && index > gameManager.game.monsterAttackModifierDeck.current;
    }).length;

    gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character)).forEach((character) => {
      count += character.attackModifierDeck.cards.filter((attackModifier, index) => {
        return attackModifier.type == AttackModifierType.bless && index > character.attackModifierDeck.current;
      }).length
    })
    return count;
  }

  countUpcomingCurses(isMonster: boolean): number {
    if (isMonster) {
      return gameManager.game.monsterAttackModifierDeck.cards.filter((attackModifier, index) => {
        return attackModifier.type == AttackModifierType.curse && index > gameManager.game.monsterAttackModifierDeck.current;
      }).length;
    }

    let count = 0;
    if (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied))) {
      count += gameManager.game.allyAttackModifierDeck.cards.filter((attackModifier, index) => {
        return attackModifier.type == AttackModifierType.curse && index > gameManager.game.allyAttackModifierDeck.current;
      }).length;
    }

    gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character)).forEach((character) => {
      count += character.attackModifierDeck.cards.filter((attackModifier, index) => {
        return attackModifier.type == AttackModifierType.curse && index > character.attackModifierDeck.current;
      }).length
    })
    return count;
  }

  getAdditional(character: Character, type: AttackModifierType, all: boolean = false): AttackModifier[] {
    let additional: AttackModifier[] = [];
    if (character.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type == type)) {
      character.additionalModifier.forEach((card, index) => {
        if (card.attackModifier && card.attackModifier.type == type) {
          let am = Object.assign(new AttackModifier(card.attackModifier.type, card.attackModifier.value, card.attackModifier.valueType), card.attackModifier);
          am.id = "additional-" + character.name + index;
          am.character = true;
          const existing: number = all ? 0 : this.countUpcomingAdditional(character, type);
          for (let i = 0; i < card.count - existing; i++) {
            additional.push(JSON.parse(JSON.stringify(am)));
          }
        }
      })
    }
    return additional;
  }

  getAllAdditional(): AttackModifier[] {
    let additional: AttackModifier[] = [];

    gameManager.charactersData().forEach((character) => {
      if (character.additionalModifier.find((perk) => perk.attackModifier)) {
        character.additionalModifier.forEach((card, index) => {
          if (card.attackModifier) {
            let am = Object.assign(new AttackModifier(card.attackModifier.type, card.attackModifier.value, card.attackModifier.valueType), card.attackModifier);
            am.id = "additional-" + character.name + index;
            am.character = true;
            for (let i = 0; i < card.count; i++) {
              additional.push(JSON.parse(JSON.stringify(am)));
            }
          }
        })
      }
    })
    return additional;
  }

  countUpcomingAdditional(character: Character, type: AttackModifierType) {
    let count = 0;
    if (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied))) {
      count += gameManager.game.allyAttackModifierDeck.cards.filter((attackModifier, index) => {
        return index > gameManager.game.allyAttackModifierDeck.current && attackModifier.type == type && attackModifier.id && attackModifier.id.startsWith("additional-" + character.name);
      }).length;
    }

    count += gameManager.game.monsterAttackModifierDeck.cards.filter((attackModifier, index) => {
      return index > gameManager.game.monsterAttackModifierDeck.current && attackModifier.type == type && attackModifier.id && attackModifier.id.startsWith("additional-" + character.name);
    }).length;

    gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character)).forEach((figure) => {
      count += figure.attackModifierDeck.cards.filter((attackModifier, index) => {
        return index > figure.attackModifierDeck.current && attackModifier.type == type && attackModifier.id && attackModifier.id.startsWith("additional-" + character.name);
      }).length;
    });

    return count;
  }

  countExtraMinus1(): number {
    let count = 0;
    if (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied))) {
      count += gameManager.game.allyAttackModifierDeck.cards.filter((attackModifier) => {
        return attackModifier.type == AttackModifierType.minus1extra;
      }).length;
    }

    count += gameManager.game.monsterAttackModifierDeck.cards.filter((attackModifier) => {
      return attackModifier.type == AttackModifierType.minus1extra;
    }).length;

    gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character)).forEach((character) => {
      count += character.attackModifierDeck.cards.filter((attackModifier) => {
        return attackModifier.type == AttackModifierType.minus1extra;
      }).length;
    });

    return count;
  }

  addModifier(attackModifierDeck: AttackModifierDeck, attackModifier: AttackModifier, index: number = -1) {
    if (index < 0 || index > attackModifierDeck.cards.length) {
      index = Math.floor(Math.random() * (attackModifierDeck.cards.length - attackModifierDeck.current)) + attackModifierDeck.current + 1;
    }
    attackModifierDeck.cards.splice(index, 0, attackModifier);
  }

  drawModifier(attackModifierDeck: AttackModifierDeck, state: 'advantage' | 'disadvantage' | undefined) {
    if (attackModifierDeck.bb) {
      this.drawBB(attackModifierDeck, state);
    } else if (attackModifierDeck.current >= attackModifierDeck.cards.length - 1) {
      this.shuffleModifiers(attackModifierDeck);
    } else if (state) {
      this.drawAdvantage(attackModifierDeck, state);
    } else {
      this.drawNormal(attackModifierDeck);
    }
  }

  drawNormal(attackModifierDeck: AttackModifierDeck) {
    attackModifierDeck.current = attackModifierDeck.current + 1;
    if (attackModifierDeck.state) {
      attackModifierDeck.lastVisible = attackModifierDeck.current;
    }
    attackModifierDeck.state = undefined;
    let currentCard = attackModifierDeck.cards[attackModifierDeck.current];
    if (currentCard && currentCard.rolling) {
      while (currentCard.rolling) {
        if (attackModifierDeck.current == attackModifierDeck.cards.length - 1) {
          return;
        }
        attackModifierDeck.current = attackModifierDeck.current + 1;
        currentCard = attackModifierDeck.cards[attackModifierDeck.current];
        this.updateLastVisible(attackModifierDeck);
      }
    }
    this.updateLastVisible(attackModifierDeck);
  }

  updateLastVisible(attackModifierDeck: AttackModifierDeck) {
    let count = 0;
    attackModifierDeck.cards.slice(attackModifierDeck.lastVisible, attackModifierDeck.current + 1).reverse().forEach((card, index) => {
      if (!card.rolling) {
        count++;
      }
      if (count == 3) {
        attackModifierDeck.lastVisible = attackModifierDeck.current - index + 1;
        count++;
      }
    })
    gameManager.uiChange.emit();
  }

  drawAdvantage(attackModifierDeck: AttackModifierDeck, state: 'advantage' | 'disadvantage') {
    let additionalDraw = false;
    const fhRules = gameManager.fhRules() || settingsManager.settings.alwaysFhAdvantage;
    attackModifierDeck.current = attackModifierDeck.current + 1;
    attackModifierDeck.lastVisible = attackModifierDeck.current;
    attackModifierDeck.state = state;
    if (attackModifierDeck.current == attackModifierDeck.cards.length) {
      return;
    }
    gameManager.uiChange.emit();
    let card = attackModifierDeck.cards[attackModifierDeck.current];

    if (card && card.rolling) {
      additionalDraw = fhRules;
      while (card.rolling) {
        if (attackModifierDeck.current == attackModifierDeck.cards.length - 1) {
          return;
        }
        attackModifierDeck.current = attackModifierDeck.current + 1;
        card = attackModifierDeck.cards[attackModifierDeck.current];
        gameManager.uiChange.emit();
      }
    } else {
      attackModifierDeck.current = attackModifierDeck.current + 1;
      card = attackModifierDeck.cards[attackModifierDeck.current];
      gameManager.uiChange.emit();

      if (fhRules && settingsManager.settings.amAdvantageHouseRule && card && card.rolling) {
        while (card.rolling) {
          if (attackModifierDeck.current == attackModifierDeck.cards.length - 1) {
            return;
          }
          attackModifierDeck.current = attackModifierDeck.current + 1;
          card = attackModifierDeck.cards[attackModifierDeck.current];
          gameManager.uiChange.emit();
        }
      }
    }

    if (additionalDraw) {
      if (attackModifierDeck.current == attackModifierDeck.cards.length - 1) {
        return;
      }
      attackModifierDeck.current = attackModifierDeck.current + 1;
      gameManager.uiChange.emit();
    }
  }

  drawBB(attackModifierDeck: AttackModifierDeck, state: 'advantage' | 'disadvantage' | undefined) {
    let row = Math.floor(attackModifierDeck.current / 3) + 1;
    attackModifierDeck.state = state;
    if (row >= Math.floor(attackModifierDeck.cards.length / 3)) {
      attackModifierDeck.current = -1;
      attackModifierDeck.lastVisible = -1;
    } else {
      attackModifierDeck.current = row * 3 + Math.floor(Math.random() * 3);
      if (state) {
        let nextRow = row + 1;
        if (nextRow >= Math.floor(attackModifierDeck.cards.length / 3)) {
          nextRow = 0;
        }
        const nextCard = nextRow * 3 + Math.floor(Math.random() * 3);
        attackModifierDeck.lastVisible = attackModifierDeck.current;
        attackModifierDeck.current = nextCard;
      } else {
        attackModifierDeck.lastVisible = attackModifierDeck.current;
      }
    }
  }

  shuffleModifiers(attackModifierDeck: AttackModifierDeck, onlyUpcoming: boolean = false) {
    if (attackModifierDeck.bb) {
      attackModifierDeck.current = -1;
      attackModifierDeck.lastVisible = -1;
      return;
    }

    const current = attackModifierDeck.current;
    const lastVisible = attackModifierDeck.lastVisible;
    let restoreCards: AttackModifier[] = onlyUpcoming && current > -1 ? attackModifierDeck.cards.splice(0, current + 1) : [];
    attackModifierDeck.cards = attackModifierDeck.cards.filter((attackModifier, index) =>
      index > attackModifierDeck.current || (attackModifier.type != AttackModifierType.bless && attackModifier.type != AttackModifierType.curse && attackModifier.type != AttackModifierType.empower && attackModifier.type != AttackModifierType.enfeeble)
    );

    // apply Challenge #1500
    if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1500, 'fh')) {
      attackModifierDeck.cards = attackModifierDeck.cards.filter((attackModifier, index) =>
        index > attackModifierDeck.current || (attackModifier.type != AttackModifierType.minus1 && attackModifier.type != AttackModifierType.minus2)
      );
    }

    attackModifierDeck.current = -1;
    attackModifierDeck.lastVisible = 0;
    attackModifierDeck.discarded = [];
    ghsShuffleArray(attackModifierDeck.cards);
    if (onlyUpcoming) {
      attackModifierDeck.current = current;
      attackModifierDeck.lastVisible = lastVisible;
      attackModifierDeck.cards.unshift(...restoreCards);
    }
  }

  removeDrawnDiscards(attackModifierDeck: AttackModifierDeck) {
    const before = attackModifierDeck.cards.length;
    attackModifierDeck.cards = attackModifierDeck.cards.filter(
      (attackModifier, index) =>
        index > attackModifierDeck.current ||
        (attackModifier.type != AttackModifierType.bless &&
          attackModifier.type != AttackModifierType.curse &&
          attackModifier.type != AttackModifierType.empower &&
          attackModifier.type != AttackModifierType.enfeeble)
    );
    attackModifierDeck.current = attackModifierDeck.current - (before - attackModifierDeck.cards.length);
  }

  next() {
    this.checkShuffle(this.game.monsterAttackModifierDeck);
    this.checkShuffle(this.game.allyAttackModifierDeck);
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.checkShuffle(figure.attackModifierDeck);
      }
    })
  }

  firstRound() {
    this.shuffleModifiers(this.game.monsterAttackModifierDeck);
    this.shuffleModifiers(this.game.allyAttackModifierDeck);
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.shuffleModifiers(figure.attackModifierDeck);
      }
    })
  }

  checkShuffle(attackModifierDeck: AttackModifierDeck) {
    if (!attackModifierDeck.bb && attackModifierDeck.cards.some((attackModifier, index) => index <= attackModifierDeck.current && attackModifier.shuffle)) {
      this.shuffleModifiers(attackModifierDeck);
    }
  }


  buildCharacterAttackModifierDeck(character: Character): AttackModifierDeck {
    if (character.bb && character.amTables && character.amTables.length >= character.level) {
      return new AttackModifierDeck(character.amTables[character.level - 1].map((value, index) => {

        if (typeof value === 'string') {
          let am = new AttackModifier(value as AttackModifierType);
          am.character = true;
          return am;
        } else {
          let am: AttackModifier = value as AttackModifier;
          am.character = true;
          am.id = 'bb-' + character.level + '-' + index;
          return am;
        }
      }), settingsManager.settings.bbAm);
    }

    let attackModifierDeck = new AttackModifierDeck();

    let perkId = 0;
    character.perks.forEach((perk) => {
      if (perk.cards) {
        perk.cards.forEach((card, index) => {
          if (perk.type == PerkType.add || perk.type == PerkType.replace) {
            let am = Object.assign(new AttackModifier(card.attackModifier.type, card.attackModifier.value, card.attackModifier.valueType), card.attackModifier);
            am.id = "perk" + perkId;
            am.shuffle = card.attackModifier.shuffle || false;
            if (!this.findByAttackModifier(defaultAttackModifier, am) || perk.type == PerkType.add || index > 0) {
              am.character = true;
            }
            if (!this.findByAttackModifier(attackModifierDeck.attackModifiers, am)) {
              perkId++;
              attackModifierDeck.attackModifiers.push(am);
            }
          }
        })
      }
    })

    if (character.progress && character.progress.perks) {
      character.progress.perks.forEach((checked, index) => {
        const perk = character.perks[index];
        if (!perk) {
          // error
          return;
        }
        if (perk.combined) {
          if (checked == perk.count) {
            this.addPerkCard(perk, attackModifierDeck, defaultAttackModifier);
          }
        } else {
          for (let check = 0; check < checked; check++) {
            this.addPerkCard(perk, attackModifierDeck, defaultAttackModifier);
          }
        }
      })
    }

    if (gameManager.trialsManager.apply && gameManager.trialsManager.trialsEnabled && character.progress.trial && character.progress.trial.edition == 'fh' && character.progress.trial.name == '348') {
      attackModifierDeck = new AttackModifierDeck();
      attackModifierDeck.cards = attackModifierDeck.cards.filter((am) => [AttackModifierType.double, AttackModifierType.plus1, AttackModifierType.plus2].indexOf(am.type) == -1);
    }

    if (!gameManager.characterManager.ignoreNegativeItemEffects(character)) {
      for (let itemIdentifier of character.progress.equippedItems) {
        const itemData = gameManager.itemManager.getItem(itemIdentifier.name, itemIdentifier.edition, true);
        if (itemData && itemData.minusOne) {
          for (let i = 0; i < itemData.minusOne; i++) {
            this.addModifier(attackModifierDeck, new AttackModifier(AttackModifierType.minus1));
          }
        }
      }
    }

    if (character.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '101')) {
      let minus1 = attackModifierDeck.cards.find((am) => am.id == AttackModifierType.minus1);
      if (minus1) {
        attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus1), 1);
        minus1 = attackModifierDeck.cards.find((am) => am.id == AttackModifierType.minus1);
        if (minus1) {
          attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus1), 1);
        }
      }
    }

    if (character.progress.equippedItems.find((identifier) => identifier.edition == 'toa' && identifier.name == '107')) {
      const minus2 = attackModifierDeck.cards.find((am) => am.id == AttackModifierType.minus2);
      if (minus2) {
        attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus2), 1);
      }
    }

    if (character.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '11')) {
      const minus1 = attackModifierDeck.cards.find((am) => am.id == AttackModifierType.minus1);
      if (minus1) {
        attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus1), 1);
      }
    }

    if (character.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '41')) {
      const plus0 = attackModifierDeck.cards.find((am) => am.id == AttackModifierType.plus0);
      if (plus0) {
        attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(plus0), 1);
      }

      const minus1 = attackModifierDeck.cards.find((am) => am.id == AttackModifierType.minus1);
      if (minus1) {
        attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(minus1), 1);
      }
    }

    return attackModifierDeck;
  }

  buildTownGuardAttackModifierDeck(party: Party, campaignData: CampaignData): AttackModifierDeck {
    const defaultTownGuardDeck = defaultTownGuardAttackModifier.map((am) => am.clone());
    const attackModifierDeck = new AttackModifierDeck(defaultTownGuardDeck);
    attackModifierDeck.attackModifiers.push(...additionalTownGuardAttackModifier);

    let perkId = 0;
    campaignData.townGuardPerks.forEach((townGuardPerk) => {
      const perk = townGuardPerk.perk;
      if (perk.cards) {
        perk.cards.forEach((card, index) => {
          if (perk.type == PerkType.add || perk.type == PerkType.replace) {
            let am = Object.assign(new AttackModifier(card.attackModifier.type, card.attackModifier.value, card.attackModifier.valueType), card.attackModifier);
            am.id = "perk" + perkId;
            if (!this.findByAttackModifier(defaultTownGuardDeck, am) || perk.type == PerkType.add || index > 0) {
              am.character = true;
            }
            if (!this.findByAttackModifier(attackModifierDeck.attackModifiers, am)) {
              perkId++;
              attackModifierDeck.attackModifiers.push(am);
            }
          }
        })
      }
    })

    if (party.townGuardPerkSections) {
      campaignData.townGuardPerks.forEach((townGuardPerk) => {
        const perk = townGuardPerk.perk;
        if (!perk) {
          // error
          return;
        }
        const checked = townGuardPerk.sections.filter((section) => party.townGuardPerkSections.indexOf(section) != -1).length;
        if (perk.combined) {
          if (checked == perk.count) {
            this.addPerkCard(perk, attackModifierDeck, defaultTownGuardDeck);
          }
        } else {
          for (let check = 0; check < checked; check++) {
            this.addPerkCard(perk, attackModifierDeck, defaultTownGuardDeck);
          }
        }
      })
    }

    party.scenarios.forEach((scenarioModel) => {
      const scenarioData = gameManager.scenarioManager.scenarioDataForModel(scenarioModel);
      if (scenarioData && scenarioData.rewards && scenarioData.rewards.townGuardAm) {
        scenarioData.rewards.townGuardAm.forEach((id, index) => {
          let am = attackModifierDeck.attackModifiers.find((attackModifier) => attackModifier.id == id);
          if (am) {
            attackModifierDeck.cards.push(am.clone());
          } else {
            console.warn("Unknown Town Guard AM:", id);
          }

        })
      }
    })

    party.conclusions.forEach((sectionModel) => {
      const sectionData = gameManager.scenarioManager.sectionDataForModel(sectionModel);
      if (sectionData && sectionData.rewards && sectionData.rewards.townGuardAm) {
        sectionData.rewards.townGuardAm.forEach((id, index) => {
          let am = attackModifierDeck.attackModifiers.find((attackModifier) => attackModifier.id == id);
          if (am) {
            attackModifierDeck.cards.push(am.clone());
          } else {
            console.warn("Unknown Town Guard AM:", id);
          }
        })
      }
    })

    return attackModifierDeck;
  }

  addPerkCard(perk: Perk, attackModifierDeck: AttackModifierDeck, characterCards: AttackModifier[]) {
    perk.cards = perk.cards || [];

    perk.cards.forEach((card, index) => {
      if (!this.findByAttackModifier(characterCards, card.attackModifier) || perk.type == PerkType.add || perk.type == PerkType.replace && index >= this.replaceCount(perk)) {
        card.attackModifier.character = true;
      }
    })

    if (perk.type == PerkType.add) {
      this.addCards(attackModifierDeck, perk.cards);
    } else if (perk.type == PerkType.remove) {
      this.removeCards(attackModifierDeck, perk.cards);
    } else if (perk.type == PerkType.replace) {
      const count = this.replaceCount(perk);
      if (count) {
        this.removeCards(attackModifierDeck, perk.cards.slice(0, count));
        this.addCards(attackModifierDeck, perk.cards.slice(count, perk.cards.length));
      }
    }
  }

  perkCards(characterData: CharacterData): AttackModifier[] {
    let attackModifiers: AttackModifier[] = [];
    characterData.perks.forEach((perk) => {
      for (let i = 0; i < (perk.combined ? 1 : perk.count); i++) {
        if (perk.cards) {
          perk.cards.forEach((card, index) => {
            if (perk.type == PerkType.add || perk.type == PerkType.replace && index >= this.replaceCount(perk)) {
              attackModifiers.push(Object.assign(new AttackModifier(card.attackModifier.type, card.attackModifier.value, card.attackModifier.valueType), card.attackModifier));
            }
          })
        }
      }
    })
    return attackModifiers;
  }

  replaceCount(perk: Perk): number {
    let count: number = 0;
    if (perk.type == PerkType.replace) {
      count = 1;
      perk.cards.forEach((card, index, self) => {
        let count = self.slice(0, index + 1).map((a) => a.count).reduce((a, b) => a + b);
        if (index < self.length - 1 && count <= self.slice(index + 1, self.length).map((a) => a.count).reduce((a, b) => a + b)) {
          count = index + 1;
        }
      })
    }
    return count;
  }

  findByAttackModifier(attackModifiers: AttackModifier[], attackModifier: AttackModifier, ignoreCharacter: boolean = false): AttackModifier | undefined {
    return attackModifiers.find((other) => {
      let am = Object.assign(new AttackModifier(attackModifier.type, attackModifier.value, attackModifier.valueType), attackModifier);
      am.id = "";
      am.revealed = false;
      am.shuffle = attackModifier.shuffle || false;
      let clone = Object.assign(new AttackModifier(other.type, other.value, other.valueType), other);
      clone.id = "";
      clone.revealed = false;
      clone.shuffle = other.shuffle || false;
      if (ignoreCharacter && clone.character) {
        clone.character = false;
      }

      return JSON.stringify(am) == JSON.stringify(clone);
    });
  }

  addCards(attackModifierDeck: AttackModifierDeck, cards: PerkCard[]) {
    cards.forEach((card) => {
      for (let cardCount = 0; cardCount < card.count; cardCount++) {
        const toAdd = this.findByAttackModifier(attackModifierDeck.attackModifiers, card.attackModifier);
        if (toAdd) {
          let attackModifier = Object.assign(new AttackModifier(toAdd.type, toAdd.value, toAdd.valueType), toAdd);
          attackModifierDeck.cards.push(attackModifier);
        } else {
          console.warn("Did not found AM to add: ", card.attackModifier, attackModifierDeck);
        }
      }
    })
  }

  removeCards(attackModifierDeck: AttackModifierDeck, cards: PerkCard[]) {
    cards.forEach((card) => {
      for (let cardCount = 0; cardCount < card.count; cardCount++) {
        let removed: boolean = false;
        let toRemove = this.findByAttackModifier(attackModifierDeck.cards, card.attackModifier);
        if (toRemove) {
          const replaceIndex = attackModifierDeck.cards.indexOf(toRemove);
          attackModifierDeck.cards.splice(replaceIndex, 1);
          removed = true;
        } else if (!card.attackModifier.id && !card.attackModifier.character) {
          toRemove = this.findByAttackModifier(attackModifierDeck.cards, card.attackModifier, true);
          if (toRemove) {
            const replaceIndex = attackModifierDeck.cards.indexOf(toRemove);
            attackModifierDeck.cards.splice(replaceIndex, 1);
            removed = true;
          }
        }

        if (!removed) {
          console.warn("Did not found AM to remove: ", card.attackModifier, attackModifierDeck);
        }
      }
    })
  }

  cardById(attackModifierDeck: AttackModifierDeck, id: string): AttackModifier | undefined {
    let attackModifier = attackModifierDeck.attackModifiers.find((attackModifier) => attackModifier.id == id);
    if (!attackModifier) {
      attackModifier = defaultAttackModifier.find((attackModifier) => attackModifier.id == id);
      if (!attackModifier) {
        attackModifier = CsOakDeckAttackModifier.find((attackModifier) => attackModifier.id == id);
      }
      if (!attackModifier) {
        attackModifier = this.getAllAdditional().find((attackModifier) => attackModifier.id == id);
      }
      if (!attackModifier) {
        attackModifier = this.findForChallenge(id);
      }
      if (!attackModifier) {
        attackModifier = defaultTownGuardAttackModifier.find((attackModifier) => attackModifier.id == id);
      }
      if (!attackModifier) {
        return undefined;
      }
    }
    return JSON.parse(JSON.stringify(attackModifier));
  }

  findForChallenge(id: string): AttackModifier | undefined {
    if (id.startsWith('challenge-fh-1503-')) {
      const characterName = id.replace('challenge-fh-1503-', '').split('-')[0];
      const index = +id.replace('challenge-fh-1503-', '').split('-')[1];
      const characterData = gameManager.charactersData('fh').find((other) => other.edition == 'fh' && other.name == characterName);
      if (characterData) {
        let am = this.perkCards(characterData)[index];
        if (am) {
          am.id = 'challenge-fh-1503-' + characterData.name + '-' + index;
          am.character = true;
          return am;
        }
      }
    }
    return undefined;
  }

  fromModel(attackModifierDeck: AttackModifierDeck, model: GameAttackModifierDeckModel) {

    attackModifierDeck.current = model.current;
    attackModifierDeck.lastVisible = model.lastVisible;

    // migration
    model.cards = model.cards.map((id) => {
      if (id == "scenario-reward-55-0") {
        id = "fh-tg-add-plus50-algox";
      } else if (id == "scenario-reward-56-0") {
        id = "fh-tg-add-plus50";
      } else if (id == "scenario-reward-57-0") {
        id = "fh-tg-add-plus50";
      } else if (id == "scenario-reward-58-0") {
        id = "fh-tg-add-plus50-unfettered";
      } else if (id == "scenario-reward-59-0") {
        id = "fh-tg-add-plus50-unfettered";
      } else if (id == "scenario-reward-60-0") {
        id = "fh-tg-add-plus50-lurkers";
      } else if (id == "conclusion-reward-50.2-0") {
        id = "fh-tg-add-plus20";
      }

      return id;
    })

    attackModifierDeck.cards = model.cards.map((id) => this.cardById(attackModifierDeck, id) || new AttackModifier(AttackModifierType.invalid, 0, AttackModifierValueType.default, id));
    attackModifierDeck.discarded = model.discarded || model.disgarded || [];
    attackModifierDeck.active = model.active;
    attackModifierDeck.state = model.state;
    attackModifierDeck.bb = model.bb;
  }

}
