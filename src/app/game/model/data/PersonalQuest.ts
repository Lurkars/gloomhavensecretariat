import { Editional } from "./Editional";

export class PersonalQuest implements Editional {
    cardId: string = "";
    altId: string = "";
    spoiler: boolean = false;
    requirements: PersonalQuestRequirement[] = [];
    unlockCharacter: string = "";
    openEnvelope: string = "";

    // from Editional
    edition: string = "";
}


export class PersonalQuestRequirement {

    name: string = "";
    counter: number | string = 1;
    requires: number[] = [];

}