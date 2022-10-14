import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EditionData } from "src/app/game/model/data/EditionData";

@Component({
    selector: 'ghs-edition-editor',
    templateUrl: './edition.html',
    styleUrls: ['./editor.scss', './edition.scss']
})
export class EditionEditorComponent implements OnInit {
    @ViewChild('inputEditionData', { static: true }) inputEditionData!: ElementRef;

    gameManager: GameManager = gameManager;
    encodeURIComponent = encodeURIComponent;

    editionData: EditionData;
    editionError: any;

    constructor() {
        this.editionData = new EditionData("", [], [], [], [], [], []);
    }

    async ngOnInit() {
        await settingsManager.init();
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

    loadEditionData(event: any) {
        const index = +event.target.value;
        this.editionData = index != -1 ? gameManager.editionData[index] : new EditionData("", [], [], [], [], [], []);
        this.editionDataToJson();
    }
} 