import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { AttackModifier, AttackModifierDeck, AttackModifierType, defaultAttackModifier, defaultTownGuardAttackModifier } from "src/app/game/model/data/AttackModifier";
import { Character } from "../model/Character";
import { CampaignData } from "../model/data/EditionData";
import { Figure } from "../model/Figure";
import { Game } from "../model/Game";
import { Monster } from "../model/Monster";
import { Party } from "../model/Party";
import { Perk, PerkCard, PerkType } from "../model/data/Perks";
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
      return (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules()) && figure.isAlly ? this.game.allyAttackModifierDeck : this.game.monsterAttackModifierDeck;
    }

    return new AttackModifierDeck();
  }

  countUpcomingBlesses(): number {
    let count = 0;
    if (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly)) {
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
    if (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly)) {
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

  countExtraMinus1(): number {
    let count = 0;
    if (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly)) {
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

  drawModifier(attackModifierDeck: AttackModifierDeck) {
    attackModifierDeck.current = attackModifierDeck.current + 1;
    if (attackModifierDeck.current == attackModifierDeck.cards.length) {
      this.shuffleModifiers(attackModifierDeck);
    }
  }

  shuffleModifiers(attackModifierDeck: AttackModifierDeck) {
    attackModifierDeck.cards = attackModifierDeck.cards.filter(
      (attackModifier, index) =>
        index > attackModifierDeck.current ||
        (attackModifier.type != AttackModifierType.bless &&
          attackModifier.type != AttackModifierType.curse)
    );

    attackModifierDeck.current = -1;
    ghsShuffleArray(attackModifierDeck.cards);
  }

  removeDrawnDiscards(attackModifierDeck: AttackModifierDeck) {
    const before = attackModifierDeck.cards.length;
    attackModifierDeck.cards = attackModifierDeck.cards.filter(
      (attackModifier, index) =>
        index > attackModifierDeck.current ||
        (attackModifier.type != AttackModifierType.bless &&
          attackModifier.type != AttackModifierType.curse)
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

  draw() {
    this.shuffleModifiers(this.game.monsterAttackModifierDeck);
    this.shuffleModifiers(this.game.allyAttackModifierDeck);
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.shuffleModifiers(figure.attackModifierDeck);
      }
    })
  }

  checkShuffle(attackModifierDeck: AttackModifierDeck) {
    if (
      attackModifierDeck.cards.some(
        (attackModifier, index) => {
          return index <= attackModifierDeck.current && attackModifier.shuffle;
        }
      )
    ) {
      this.shuffleModifiers(attackModifierDeck);
    }
  }


  buildCharacterAttackModifierDeck(character: Character): AttackModifierDeck {
    const attackModifierDeck = new AttackModifierDeck();

    let perkId = 0;
    character.perks.forEach((perk) => {
      if (perk.cards) {
        perk.cards.forEach((card, index) => {
          if (perk.type == PerkType.add || perk.type == PerkType.replace) {
            let am = Object.assign(new AttackModifier(card.attackModifier.type), card.attackModifier);
            am.id = "perk" + perkId;
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

    let perkId = 0;
    campaignData.townGuardPerks.forEach((townGuardPerk) => {
      const perk = townGuardPerk.perk;
      if (perk.cards) {
        perk.cards.forEach((card, index) => {
          if (perk.type == PerkType.add || perk.type == PerkType.replace) {
            let am = Object.assign(new AttackModifier(card.attackModifier.type), card.attackModifier);
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

    return attackModifierDeck;
  }

  addPerkCard(perk: Perk, attackModifierDeck: AttackModifierDeck, characterCards: AttackModifier[]) {
    perk.cards = perk.cards || [];

    perk.cards.forEach((card, index) => {
      if (!this.findByAttackModifier(characterCards, card.attackModifier) || perk.type == PerkType.add || perk.type == PerkType.replace && (index > 0 && !this.replaceThreeCheck(perk) || index > 1 && this.replaceThreeCheck(perk))) {
        card.attackModifier.character = true;
      }
    })

    if (perk.type == PerkType.add) {
      this.addCards(attackModifierDeck, perk.cards);
    } else if (perk.type == PerkType.remove) {
      this.removeCards(attackModifierDeck, perk.cards);
    } else if (perk.type == PerkType.replace) {
      if (this.replaceThreeCheck(perk)) {
        this.removeCards(attackModifierDeck, [perk.cards[0], perk.cards[1]]);
        this.addCards(attackModifierDeck, [perk.cards[2]]);
      } else {
        this.removeCards(attackModifierDeck, [perk.cards[0]]);
        this.addCards(attackModifierDeck, perk.cards.slice(1, perk.cards.length));
      }
    }
  }

  replaceThreeCheck(perk: Perk) {
    return perk.type == PerkType.replace && perk.cards.length == 3 && (perk.cards[0].count + perk.cards[1].count) == perk.cards[2].count
  }

  findByAttackModifier(attackModifiers: AttackModifier[], attackModifier: AttackModifier): AttackModifier | undefined {
    return attackModifiers.find((other) => {
      let am = Object.assign(new AttackModifier(attackModifier.type), attackModifier);
      am.id = "";
      am.revealed = false;
      let clone = Object.assign(new AttackModifier(other.type), other);
      clone.id = "";
      clone.revealed = false;

      return JSON.stringify(am) == JSON.stringify(clone);
    });
  }

  addCards(attackModifierDeck: AttackModifierDeck, cards: PerkCard[]) {
    cards.forEach((card) => {
      for (let cardCount = 0; cardCount < card.count; cardCount++) {
        const toAdd = this.findByAttackModifier(attackModifierDeck.attackModifiers, card.attackModifier);
        if (toAdd) {
          let attackModifier = Object.assign(new AttackModifier(toAdd.type), toAdd);
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
        const toReplace = this.findByAttackModifier(attackModifierDeck.cards, card.attackModifier);
        if (toReplace) {
          const replaceIndex = attackModifierDeck.cards.indexOf(toReplace);
          attackModifierDeck.cards.splice(replaceIndex, 1);
        } else {
          console.warn("Did not found AM to replace: ", card.attackModifier, attackModifierDeck);
        }
      }
    })
  }

}
