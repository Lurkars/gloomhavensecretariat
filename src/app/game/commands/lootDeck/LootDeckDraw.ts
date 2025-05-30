import { gameManager } from "../../businesslogic/GameManager";
import { Character } from "../../model/Character";
import { GameState } from "../../model/Game";
import { CommandImpl } from "../Command";

export class LootDeckDrawCommand extends CommandImpl {
    id: string = 'lootDeck.draw';
    requiredParameters: number = 0;

    validParameters(): boolean {
        return true;
    }

    executeWithParameters() {
        if (gameManager.game.state != GameState.next) {
            this.executionError("invalid game state");
        }
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.active) as Character;
        gameManager.lootManager.drawCard(gameManager.game.lootDeck, character);
    }
}