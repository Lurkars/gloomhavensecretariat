import { Editional } from "./Editional";
import { Identifier } from "./Identifier";

export class BattleGoal implements Editional {
    cardId: string = "";
    name: string = "";
    text: string = "";
    checks: number = 1;
    alias: Identifier | undefined;

    // from Editional
    edition: string = "";
}