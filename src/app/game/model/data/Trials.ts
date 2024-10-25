import { Editional } from "./Editional";

export class TrialCard implements Editional {

    cardId: number = 0;
    automation: "fully" | "manual" | undefined;

    // from Editional
    edition: string = "";

}

export class Favor implements Editional {

    name: string = "";
    points: number = 1;
    automation: "fully" | "manual" | undefined;

    // from Editional
    edition: string = "";

}