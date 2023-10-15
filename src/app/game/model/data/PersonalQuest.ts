import { Editional } from "./Editional";

export class PersonalQuest implements Editional {
    cardId: number = -1;
    requirements: PersonalQuestRequirement[] = [];
    unlockCharacter: string = "";
    openEnvelope: string = "";

    // from Editional
    edition: string = "";
}


export class PersonalQuestRequirement {

    name: string = "";
    counter: number = 1;
    requires: number = -1;

}