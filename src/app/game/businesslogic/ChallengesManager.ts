import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType } from "../model/data/AttackModifier";
import { ChallengeCard, ChallengeDeck } from "../model/data/Challenges";
import { Identifier } from "../model/data/Identifier";
import { Game, GameState } from "../model/Game";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class ChallengesManager {

    game: Game;
    available: boolean = false;

    constructor(game: Game) {
        this.game = game;
    }

    drawCard(deck: ChallengeDeck) {
        deck.current++;
        if (deck.current >= deck.cards.length) {
            deck.current = deck.cards.length - 1;
        }
    }

    shuffleDeck(deck: ChallengeDeck, onlyUpcoming: boolean = false) {
        const current = deck.current;
        const finished = deck.finished;
        let restoreCards: ChallengeCard[] = onlyUpcoming && current > -1 ? deck.cards.splice(0, current + 1) : [];
        deck.current = -1;
        deck.finished = -1;
        deck.keep = [];
        ghsShuffleArray(deck.cards);
        if (onlyUpcoming) {
            deck.current = current;
            deck.finished = finished;
            deck.cards.unshift(...restoreCards);
        }
    }

    getChallengeCard(identifier: Identifier): ChallengeCard | undefined {
        return gameManager.challengesData(identifier.edition).find((challengeCard) => challengeCard.cardId == +identifier.name);
    }

    clearDrawn(deck: ChallengeDeck, keep: boolean = false) {
        let keepCards: ChallengeCard[] = [];
        if (keep) {
            deck.keep.forEach((index) => {
                keepCards.push(deck.cards[index]);
            })
        }
        if (deck.current >= 0) {
            for (let i = deck.current; i > deck.finished; i--) {
                if (!keep || deck.keep.indexOf(i) == -1) {
                    const cards = deck.cards.splice(i, 1);
                    if (cards.length) {
                        deck.cards.push(cards[0]);
                    }
                }
            }
            if (keep) {
                deck.keep = keepCards.map((card) => deck.cards.indexOf(card));
            } else {
                deck.keep = [];
            }
            deck.current = deck.finished + (keep ? deck.keep.length : 0);
        }
    }

    toggleKeep(deck: ChallengeDeck, index: number, keepAvailable: number) {
        if (deck.keep.indexOf(index) == -1) {
            if (deck.keep.length == keepAvailable) {
                deck.keep.splice(0, 1);
            }
            deck.keep.push(index);
        } else {
            deck.keep.splice(deck.keep.indexOf(index), 1);
        }
    }

    update() {
        this.available = settingsManager.settings.fhChallenges && gameManager.fhRules() && this.game.party.buildings.find((buildingModel) => buildingModel.name == 'town-hall' && buildingModel.level && buildingModel.state != 'wrecked') != undefined

        if (this.available && this.game.edition) {
            // build challenge deck if not present
            const challengeCards = gameManager.challengesData(this.game.edition);
            if (challengeCards.length && (!this.game.challengeDeck || !this.game.challengeDeck.cards.length)) {
                this.game.challengeDeck = new ChallengeDeck();
                this.game.challengeDeck.cards = challengeCards.map((challengeCard) => {
                    const card = new ChallengeCard();
                    card.cardId = challengeCard.cardId;
                    card.edition = challengeCard.edition;
                    return card;
                });
                this.game.challengeDeck.current = -1;
                this.shuffleDeck(this.game.challengeDeck);
            }
        }

        this.activeCards().forEach((card) => {
            this.applyCardAlways(card);
        })
    }

    activeCards(edition: string | undefined = undefined): ChallengeCard[] {
        if (this.available && this.game.challengeDeck.cards.length && this.game.challengeDeck.current > this.game.challengeDeck.finished && !gameManager.roundManager.firstRound || this.game.state == GameState.next) {
            return this.game.challengeDeck.cards.slice(this.game.challengeDeck.finished + 1, this.game.challengeDeck.current + 1).filter((card) => !edition || card.edition == edition || gameManager.editionExtensions(edition).indexOf(card.edition) != -1);
        }
        return [];
    }

    activeCardIds(edition: string | undefined = undefined): number[] {
        return this.activeCards(edition).map((card) => card.cardId);
    }

    isActive(cardId: number, edition: string | undefined = undefined) {
        return this.activeCardIds(edition).indexOf(cardId) != -1;
    }

    applyCardAlways(card: ChallengeCard) {
        if (card.edition == 'fh') {
            switch (card.cardId) {
                case 1484:
                    this.game.monsterAttackModifierDeck.cards.forEach((attackModifier) => {
                        if (!attackModifier.id && (!attackModifier.effects || attackModifier.effects.length == 0) && (attackModifier.type == AttackModifierType.minus1 || attackModifier.type == AttackModifierType.minus2 || attackModifier.type == AttackModifierType.null)) {
                            attackModifier.effects = [];
                            attackModifier.effects.push(new AttackModifierEffect(AttackModifierEffectType.changeType, AttackModifierType.plus0));
                        }
                    });
                    break;
                case 1485:
                    this.game.monsterAttackModifierDeck.cards.forEach((attackModifier) => {
                        if (!attackModifier.id && (!attackModifier.effects || attackModifier.effects.length == 0) && (attackModifier.type == AttackModifierType.minus2)) {
                            attackModifier.effects = [];
                            attackModifier.effects.push(new AttackModifierEffect(AttackModifierEffectType.changeType, AttackModifierType.double));
                        }
                    });
                    break;
            }
        }
    }

    applyCardStart(card: ChallengeCard) {
        if (card.edition == 'fh') {
            switch (card.cardId) {
                case 1486:
                    for (let i = 0; i < 3; i++) {
                        gameManager.attackModifierManager.addModifier(this.game.monsterAttackModifierDeck, new AttackModifier(AttackModifierType.bless));
                    }
                    break;
            }
        }
    }

}