import { Character } from "../model/Character";
import { AttackModifierType } from "../model/data/AttackModifier";
import { Identifier } from "../model/data/Identifier";
import { Game } from "../model/Game";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class TrialsManager {

    game: Game;
    available: boolean = false;
    trialsAvailable: boolean = false;
    favorsAvailable: boolean = false;
    trialsEnabled: boolean = false;
    favorsEnabled: boolean = false;
    apply: boolean = false;

    constructor(game: Game) {
        this.game = game;
    }

    update() {
        const hall = gameManager.fhRules() && this.game.party.buildings.find((buildingModel) => buildingModel.name == 'hall-of-revelry' && buildingModel.level && buildingModel.state != 'wrecked');

        this.available = false;
        this.trialsEnabled = false;
        this.favorsEnabled = false;

        if (gameManager.fhRules() && hall) {
            this.available = true;
            this.trialsAvailable = hall.level == 1;
            this.favorsAvailable = hall.level == 2;
            if (settingsManager.settings.fhTrials) {
                this.trialsEnabled = this.trialsAvailable;
                this.favorsEnabled = this.favorsAvailable;
                this.apply = settingsManager.settings.fhTrialsApply;
            }
        }
    }

    applyTrialCards() {
        if (this.trialsEnabled) {
            const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.currentEdition() && editionData.trials && editionData.trials.length);
            this.game.party.trials = this.game.party.trials || -1;
            if (editionData) {
                this.game.figures.forEach((figure) => {
                    if (figure instanceof Character && !figure.progress.trial) {
                        let retiredCharacter = this.game.party.retirements.find((model) => model.number == figure.number && model.progress && model.progress.trial)
                        if (retiredCharacter && retiredCharacter.progress && retiredCharacter.progress.trial) {
                            figure.progress.trial = retiredCharacter.progress.trial;
                            retiredCharacter.progress.trial = undefined;
                        } else if (this.game.party.trials < editionData.trials.length - 1) {
                            this.game.party.trials++;
                            const trialCard = editionData.trials[this.game.party.trials];
                            figure.progress.trial = new Identifier('' + trialCard.cardId, trialCard.edition);
                        }
                    }
                })
            }
        } else {
            const hall = gameManager.fhRules() && this.game.party.buildings.find((buildingModel) => buildingModel.name == 'hall-of-revelry' && buildingModel.level == 1);
            if (!hall) {
                this.game.party.trials = -1;
                this.game.figures.forEach((figure) => {
                    if (figure instanceof Character && figure.progress.trial) {
                        figure.progress.trial = undefined;
                    }
                })
            }
        }
    }

    activeTrial(edition: string, cardId: number): boolean {
        return this.trialsEnabled && this.game.figures.find((figure) => figure instanceof Character && figure.progress.trial && figure.progress.trial.edition == edition && figure.progress.trial.name == '' + cardId) != undefined;
    }

    applyFavorPoints() {
        this.game.favorPoints.forEach((point) => {
            const attackModifier = this.game.monsterAttackModifierDeck.cards.find((am) => point == 1 ? am.type == AttackModifierType.minus1 : am.type == AttackModifierType.minus2);
            if (attackModifier) {
                this.game.monsterAttackModifierDeck.cards.splice(this.game.monsterAttackModifierDeck.cards.indexOf(attackModifier), 1);
            }
        })
    }

    activeFavor(edition: string, name: string): number {
        return this.game.favors.filter((value) => value.edition == edition && value.name == name).length;
    }

    cardIdSecondPrinting(cardId: number): number {
        return 708 - cardId; // 360 - 12 + (360 - cardId)
    }
}