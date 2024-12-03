import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ConditionName } from "src/app/game/model/data/Condition";
import { CharacterData } from "src/app/game/model/data/CharacterData";
import { DeckData } from "src/app/game/model/data/DeckData";
import { EditionData } from "src/app/game/model/data/EditionData";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { environment } from "src/environments/environment";

@Component({
	standalone: false,
    selector: 'ghs-edition-editor',
    templateUrl: './edition.html',
    styleUrls: ['./editor.scss', './edition.scss']
})
export class EditionEditorComponent implements OnInit {
    @ViewChild('inputEditionData', { static: true }) inputEditionData!: ElementRef;

    gameManager: GameManager = gameManager;
    encodeURIComponent = encodeURIComponent;
    Conditions: ConditionName[] = Object.values(ConditionName).filter((condition) => condition != ConditionName.bless && condition != ConditionName.curse);

    editionData: EditionData;
    editionError: any;

    constructor() {
        this.editionData = new EditionData("", [], [], [], [], [], []);
    }

    async ngOnInit() {
        await settingsManager.init(!environment.production);
        this.editionDataToJson()
    }

    editionDataToJson() {
        let compactData: any = JSON.parse(JSON.stringify(this.editionData));

        Object.keys(compactData).forEach((key) => {
            if (!compactData[key]) {
                compactData[key] = undefined;
            }
        })

        this.inputEditionData.nativeElement.value = JSON.stringify(compactData, null, 2);
    }

    jsonDownload(): string {
        let compactData: any = JSON.parse(JSON.stringify(this.editionData));

        Object.keys(compactData).forEach((key) => {
            if (!compactData[key]) {
                compactData[key] = undefined;
            }
        })

        return this.encodeURIComponent(JSON.stringify(compactData));
    }

    loadEditionData(event: any) {
        const index = +event.target.value;
        this.editionData = index != -1 ? gameManager.editionData[index] : new EditionData("", [], [], [], [], [], []);
        this.editionDataToJson();
    }

    toggleAllConditions(conditionSelect: HTMLSelectElement) {
        if (this.editionData.conditions.length == this.Conditions.length) {
            this.editionData.conditions = [];
            conditionSelect.blur();
        } else {
            this.editionData.conditions = JSON.parse(JSON.stringify(this.Conditions));
            conditionSelect.focus();
        }
        this.editionDataToJson();
    }

    addCharacterJson(event: any) {
        if (event.target.files) {
            for (let i = 0; i < event.target.files.length; i++) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        let character: CharacterData = JSON.parse(reader.result as string);
                        if (character) {
                            if (!this.editionData.characters.find((characterData) => character.name == characterData.name && character.edition == characterData.edition)) {
                                this.editionData.characters.push(new CharacterData(character));
                                this.editionDataToJson();
                            }
                        }
                        return;
                    } catch (e) {
                        console.error(e);
                    }

                };
                reader.readAsText(event.target.files[i]);
            }
        }
        event.target.value = '';
    }

    removeCharacter(index: number) {
        this.editionData.characters.splice(index, 1);
        this.editionDataToJson();
    }

    addMonsterJson(event: any) {
        if (event.target.files) {
            for (let i = 0; i < event.target.files.length; i++) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const monster: MonsterData = JSON.parse(reader.result as string);
                        if (monster) {
                            if (!this.editionData.monsters.find((monsterData) => monster.name == monsterData.name && monster.edition == monsterData.edition)) {
                                this.editionData.monsters.push(new MonsterData(monster));
                                this.editionDataToJson();
                            }
                        }
                        return;
                    } catch (e) {
                        console.error(e);
                    }

                };
                reader.readAsText(event.target.files[i]);
            }
        }
        event.target.value = '';
    }

    removeMonster(index: number) {
        this.editionData.monsters.splice(index, 1);
        this.editionDataToJson();
    }

    addDeckJson(event: any) {
        if (event.target.files) {
            for (let i = 0; i < event.target.files.length; i++) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const deck: DeckData = JSON.parse(reader.result as string);
                        if (deck) {
                            if (!this.editionData.decks.find((deckData) => deck.name == deckData.name && deck.edition == deckData.edition)) {
                                this.editionData.decks.push(deck);
                                this.editionDataToJson();
                            }
                        }
                        return;
                    } catch (e) {
                        console.error(e);
                    }

                };
                reader.readAsText(event.target.files[i]);
            }
        }
        event.target.value = '';
    }

    removeDeck(index: number) {
        this.editionData.decks.splice(index, 1);
        this.editionDataToJson();
    }
} 