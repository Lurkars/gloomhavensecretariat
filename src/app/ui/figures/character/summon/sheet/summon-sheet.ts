import { Component, Input, OnInit } from "@angular/core";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Summon } from "src/app/game/model/Summon";

@Component({
    selector: 'ghs-summon-sheet',
    templateUrl: './summon-sheet.html',
    styleUrls: ['./summon-sheet.scss']
})
export class SummonSheetComponent implements OnInit {

    @Input() summon!: Summon;
    @Input() action: boolean = false;
    @Input() additional: boolean = false;
    @Input() right: boolean = false;

    settingsManager: SettingsManager = settingsManager;

    ngOnInit(): void {

    }
}