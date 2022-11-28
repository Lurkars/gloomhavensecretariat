import { AttackModifier, AttackModifierDeck, AttackModifierType, defaultAttackModifier } from "../model/AttackModifier";
import { Character } from "../model/Character";
import { Game } from "../model/Game";
import { PerkCard, PerkType } from "../model/Perks";

export class AttackModifierManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
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
    attackModifierDeck.cards = attackModifierDeck.cards
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
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
        for (let check = 0; check < checked; check++) {
          const perk = character.perks[ index ];
          if (!perk) {
            // error
          }

          perk.cards = perk.cards || [];

          perk.cards.forEach((card, index) => {
            if (!this.findByAttackModifier(defaultAttackModifier, card.attackModifier) || perk.type == PerkType.add || perk.type == PerkType.replace && index > 0) {
              card.attackModifier.character = true;
            }
          })

          if (perk.type == PerkType.add) {
            this.addCards(attackModifierDeck, perk.cards);
          } else if (perk.type == PerkType.remove) {
            this.removeCards(attackModifierDeck, perk.cards);
          } else if (perk.type == PerkType.replace) {
            this.removeCards(attackModifierDeck, [ perk.cards[ 0 ] ]);
            this.addCards(attackModifierDeck, perk.cards.slice(1, perk.cards.length));
          }
        }
      })
    }

    return attackModifierDeck;
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
