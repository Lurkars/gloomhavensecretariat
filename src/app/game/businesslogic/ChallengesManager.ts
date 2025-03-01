import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Character } from "../model/Character";
import { Action, ActionType, ActionValueType } from "../model/data/Action";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType } from "../model/data/AttackModifier";
import { ChallengeCard, ChallengeDeck } from "../model/data/Challenges";
import { CharacterData } from "../model/data/CharacterData";
import { Condition, ConditionName, ConditionType, EntityConditionState } from "../model/data/Condition";
import { Identifier } from "../model/data/Identifier";
import { MonsterType } from "../model/data/MonsterType";
import { EntityValueFunction } from "../model/Entity";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class ChallengesManager {

    game: Game;
    available: boolean = false;
    enabled: boolean = false;
    apply: boolean = false;

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
        this.available = gameManager.fhRules() && this.game.party.buildings.find((buildingModel) => buildingModel.name == 'town-hall' && buildingModel.level) != undefined;
        this.enabled = settingsManager.settings.fhChallenges && gameManager.fhRules() && this.game.party.buildings.find((buildingModel) => buildingModel.name == 'town-hall' && buildingModel.level && buildingModel.state != 'wrecked') != undefined;
        this.apply = settingsManager.settings.fhChallengesApply && this.enabled;

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

        if (this.apply) {
            this.applyCardsAlways();
        }
    }

    activeCards(edition: string | undefined = undefined, start: boolean = false): ChallengeCard[] {
        if (this.available && this.game.challengeDeck.cards.length && this.game.challengeDeck.current > this.game.challengeDeck.finished && (start || !gameManager.roundManager.firstRound) || this.game.state == GameState.next) {
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

    applyCardsStart() {
        this.activeCards(undefined, true).forEach((card) => {
            this.applyCardStart(card);
        })
    }

    applyCardStart(card: ChallengeCard) {
        if (card.edition == 'fh') {
            switch (card.cardId) {
                case 1486:
                    for (let i = 0; i < 3; i++) {
                        gameManager.attackModifierManager.addModifier(this.game.monsterAttackModifierDeck, new AttackModifier(AttackModifierType.bless));
                    }
                    break;
                case 1496:
                    this.game.monsterAttackModifierDeck.cards = this.game.monsterAttackModifierDeck.cards.filter((attackModifier) => attackModifier.type != AttackModifierType.plus0);
                    break;
                case 1503:
                    const characters: CharacterData[] = gameManager.charactersData('fh').filter((characterData) => (!characterData.spoiler || this.game.unlockedCharacters.indexOf(characterData.name) != -1) && !this.game.figures.find((figure) => figure instanceof Character && figure.edition == characterData.edition && figure.name == characterData.name));
                    if (characters.length) {
                        const characterData = characters[Math.floor(Math.random() * characters.length)];
                        let attackModifiers = gameManager.attackModifierManager.perkCards(characterData);
                        attackModifiers.forEach((am, index) => {
                            am.id = 'challenge-fh-1503-' + characterData.name + '-' + index;
                            am.character = true;
                        })
                        for (let i = 0; i < 5; i++) {
                            let am = attackModifiers.splice(Math.floor(Math.random() * attackModifiers.length), 1)[0];
                            this.game.monsterAttackModifierDeck.cards.push(am);
                        }
                        gameManager.attackModifierManager.shuffleModifiers(this.game.monsterAttackModifierDeck);
                    }
                    break;
            }
        }
    }

    applyCardsAlways() {
        this.activeCards().forEach((card) => {
            this.applyCardAlways(card);
            this.game.figures.forEach((figure) => {
                if (figure instanceof Monster) {
                    this.applyCardStatEffect(figure, card);
                }
            })
        })
    }

    applyCardAlways(card: ChallengeCard) {
        if (card.edition == 'fh') {
            switch (card.cardId) {
                case 1484:
                    this.game.monsterAttackModifierDeck.cards.forEach((attackModifier) => {
                        if ((!attackModifier.effects || attackModifier.effects.length == 0) && (attackModifier.type == AttackModifierType.minus1 || attackModifier.type == AttackModifierType.minus2 || attackModifier.type == AttackModifierType.null)) {
                            attackModifier.effects = [];
                            attackModifier.effects.push(new AttackModifierEffect(AttackModifierEffectType.changeType, AttackModifierType.plus0));
                        }
                    });
                    break;
                case 1485:
                    this.game.monsterAttackModifierDeck.cards.forEach((attackModifier) => {
                        if ((!attackModifier.effects || attackModifier.effects.length == 0) && attackModifier.type == AttackModifierType.minus2) {
                            attackModifier.effects = [];
                            attackModifier.effects.push(new AttackModifierEffect(AttackModifierEffectType.changeType, AttackModifierType.double));
                        }
                    });
                    break;
                case 1523:
                    if (this.game.round == 2 && this.game.state == GameState.draw) {
                        let hound = this.game.figures.find((figure) => figure instanceof Monster && figure.edition == 'fh' && figure.name == 'hound') as Monster;
                        if (!hound || hound.tags.indexOf('challenge-fh-1523') == -1) {
                            if (!hound) {
                                const houndData = gameManager.monstersData('fh').find((monsterData) => monsterData.name == 'hound');
                                if (houndData) {
                                    hound = gameManager.monsterManager.addMonster(houndData, this.game.level);
                                } else {
                                    console.error("Unknown state: Monster Data for hound missing apply FH Challenge 1523!");
                                }
                            }
                            if (hound) {
                                hound.tags.push('challenge-fh-1523');
                                for (let i = 0; i < gameManager.characterManager.characterCount(); i++) {
                                    gameManager.monsterManager.spawnMonsterEntity(hound, MonsterType.normal);
                                }
                            }
                        }
                    }
                    break;
            }
        }
    }


    applyCardsTrigger(cardId: number) {
        this.activeCards().forEach((card) => {
            if (card.cardId == cardId) {
                this.applyCardTrigger(card);
            }
        })
    }

    applyCardTrigger(card: ChallengeCard) {
        if (card.edition == 'fh') {
            switch (card.cardId) {
                case 1526:
                    const entities = this.game.figures.filter((figure) => figure instanceof Monster).map((monster) => monster.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length);
                    if (entities.length && entities.reduce((a, b) => a + b) < gameManager.characterManager.characterCount()) {
                        this.game.figures.forEach((figure) => {
                            if (figure instanceof Monster) {
                                figure.entities.forEach((entity) => {
                                    if (gameManager.entityManager.isAlive(entity)) {
                                        gameManager.entityManager.addCondition(entity, figure, new Condition(ConditionName.ward));
                                    }
                                })
                            }
                        });
                    }
                    break;
            }
        }
    }

    applyCardStatEffect(monster: Monster, card: ChallengeCard) {
        if (card.edition == 'fh') {
            monster.entities.forEach((entity) => {
                if (gameManager.entityManager.isAlive(entity)) {
                    switch (card.cardId) {
                        case 1492:
                            if (entity.health == entity.maxHealth && (!entity.tags || entity.tags.indexOf('challenge-fh-1492') == -1)) {
                                entity.tags = entity.tags || [];
                                entity.tags.push('challenge-fh-1492');
                                entity.retaliatePersistent.push(new Action(ActionType.retaliate, 2));
                            } else if (entity.health < entity.maxHealth && entity.tags && entity.tags.indexOf('challenge-fh-1492') != -1) {
                                const retaliateAction = entity.retaliatePersistent.find((action) => action.type == ActionType.retaliate && action.value == 2 && action.valueType == ActionValueType.fixed && (!action.subActions || !action.subActions.length));
                                if (retaliateAction) {
                                    entity.retaliatePersistent.splice(entity.retaliatePersistent.indexOf(retaliateAction), 1);
                                }
                                entity.tags.splice(entity.tags.indexOf('challenge-fh-1492'));
                            }
                            break
                        case 1493:
                            if (!entity.tags || entity.tags.indexOf('challenge-fh-1493') == -1) {
                                entity.tags = entity.tags || [];
                                entity.tags.push('challenge-fh-1493');
                                entity.maxHealth += Math.ceil(this.game.level / 2);
                                entity.health += Math.ceil(this.game.level / 2);
                            }

                            break;
                        case 1496:
                            if ((!entity.immunities || entity.immunities.indexOf(ConditionName.curse) == -1) && (!entity.tags || entity.tags.indexOf('challenge-fh-1496') == -1)) {
                                entity.tags = entity.tags || [];
                                entity.tags.push('challenge-fh-1496');
                                entity.immunities.push(ConditionName.curse);
                            }
                            break;
                        case 1515:
                            const elitePresent = monster.entities.find((entity) => entity.type == MonsterType.elite && gameManager.entityManager.isAlive(entity));
                            if (elitePresent && entity.type == MonsterType.normal && (!entity.tags || entity.tags.indexOf('challenge-fh-1515') == -1)) {
                                entity.tags = entity.tags || [];
                                entity.tags.push('challenge-fh-1515');
                                if (!entity.shieldPersistent) {
                                    entity.shieldPersistent = new Action(ActionType.shield, 1);
                                } else {
                                    entity.shieldPersistent.value = EntityValueFunction(entity.shieldPersistent.value) + 1;
                                }
                            } else if (!elitePresent && entity.tags && entity.tags.indexOf('challenge-fh-1515') != -1) {
                                if (entity.shieldPersistent) {
                                    if (entity.shieldPersistent.value == 1) {
                                        entity.shieldPersistent = undefined;
                                    } else {
                                        entity.shieldPersistent.value = EntityValueFunction(entity.shieldPersistent.value) - 1;
                                    }
                                }
                                entity.tags.splice(entity.tags.indexOf('challenge-fh-1515'));
                            }
                            break
                        case 1524:
                            const negativeConditions = entity.entityConditions.filter((condition) => condition.types.indexOf(ConditionType.negative) != -1 && condition.state != EntityConditionState.removed && !condition.expired);
                            if (!negativeConditions.length && (!entity.tags || entity.tags.indexOf('challenge-fh-1524') == -1)) {
                                entity.tags = entity.tags || [];
                                entity.tags.push('challenge-fh-1524');
                                if (!entity.shieldPersistent) {
                                    entity.shieldPersistent = new Action(ActionType.shield, 1);
                                } else {
                                    entity.shieldPersistent.value = EntityValueFunction(entity.shieldPersistent.value) + 1;
                                }
                            } else if (negativeConditions.length && entity.tags && entity.tags.indexOf('challenge-fh-1524') != -1) {
                                if (entity.shieldPersistent) {
                                    if (entity.shieldPersistent.value == 1) {
                                        entity.shieldPersistent = undefined;
                                    } else {
                                        entity.shieldPersistent.value = EntityValueFunction(entity.shieldPersistent.value) - 1;
                                    }
                                }
                                entity.tags.splice(entity.tags.indexOf('challenge-fh-1524'));
                            }
                            break
                    }
                }
            })
        }
    }

}