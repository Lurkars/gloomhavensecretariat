import { gameManager } from "../../businesslogic/GameManager";
import { Editional } from "./Editional";
import { Identifier } from "./Identifier";

export class ChallengeCard implements Editional {

    cardId: number = 0;
    edition: string = "";
    automation: "fully" | "partial" | undefined;

}

export class ChallengeDeck {

    current: number = -1;
    finished: number = -1;
    keep: number[] = [];
    cards: ChallengeCard[] = [];
    active: boolean = false;

    fromModel(model: GameChallengeDeckModel) {
        this.current = model.current;
        this.finished = model.finished;
        this.keep = model.keep || [];
        this.cards = model.cards ? model.cards.map((identifier) => gameManager.challengesManager.getChallengeCard(identifier)).filter((value) => value).map((value) => value as ChallengeCard) : [];
        this.active = model.active;
    }

    toModel(): GameChallengeDeckModel {
        let model = new GameChallengeDeckModel();
        model.current = this.current;
        model.finished = this.finished;
        model.keep = this.keep && JSON.parse(JSON.stringify(this.keep)) || [];
        model.cards = this.cards.map((challengeCard) => new Identifier('' + challengeCard.cardId, challengeCard.edition));
        model.active = this.active;
        return model;
    }
}


export class GameChallengeDeckModel {

    current: number = -1;
    finished: number = -1;
    keep: number[] = [];
    cards: Identifier[] = [];
    active: boolean = false;
}