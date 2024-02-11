import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
    selector: '[ghs-setting-menu]',
    templateUrl: 'setting.html',
    styleUrls: ['../../menu.scss', '../settings.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SettingMenuComponent implements OnInit {

    @Input('ghs-setting-menu') setting!: string;
    @Input('checked') checked: boolean = false;
    @Input('disabled') disabled: boolean = false;
    @Input('type') type: 'checkbox' | 'radio' | 'number' | 'range' | 'condition-list' = 'checkbox';
    @Input('values') values: string[] = [];
    @Input('min') min: number | '' = '';
    @Input('max') max: number | '' = '';
    @Input('step') step: number = 0.1;
    @Input('default') default: number = 1;
    @Input('hint') hint: boolean = true;
    @Input('additionalHint') additionalHint: string = '';

    settingsManager: SettingsManager = settingsManager;

    matchSearch: boolean = true;


    ngOnInit(): void {
        if (this.type === 'checkbox' && this.values.length > 0) {
            this.type = 'radio';
        }
    }
}

@Component({
    selector: '[ghs-setting-title-menu]',
    templateUrl: 'setting-title.html',
    styleUrls: ['../../menu.scss', '../settings.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SettingMenuTitleComponent {

    settingsManager: SettingsManager = settingsManager;

    @Input('ghs-setting-title-menu') setting!: string;
    @Input('sync') sync: boolean = false;
}

