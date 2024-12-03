import { Component, ElementRef, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
	standalone: false,
    selector: '[ghs-setting-menu]',
    templateUrl: 'setting.html',
    styleUrls: ['../../menu.scss', '../settings.scss', 'setting.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SettingMenuComponent implements OnInit {

    @Input('ghs-setting-menu') setting!: string;
    @Input('checked') checked: boolean = false;
    @Input('disabled') disabled: boolean = false;
    @Input('requires') requires: string[] = [];
    @Input('requiresOne') requiresOne: string[] = [];
    @Input('type') type: 'checkbox' | 'radio' | 'number' | 'range' | 'condition-list' = 'checkbox';
    @Input('values') values: string[] = [];
    @Input('min') min: number | '' = '';
    @Input('max') max: number | '' = '';
    @Input('step') step: number = 0.1;
    @Input('default') default: number = 1;
    @Input('hint') hint: boolean = true;
    @Input('additionalHint') additionalHint: string = '';
    @Input('labelSuffix') suffix : string = '';
    isDisabled: boolean = false;

    settingsManager: SettingsManager = settingsManager;

    constructor(public elementRef: ElementRef) { }

    ngOnInit(): void {
        if (this.type === 'checkbox' && this.values.length > 0) {
            this.type = 'radio';
        }

        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.isDisabled = this.requires.length > 0 && this.requires.some((require) => require.startsWith('!') ? settingsManager.get(require.replace('!', '')) : !settingsManager.get(require)) || this.requiresOne.length > 0 && this.requiresOne.every((require) => require.startsWith('!') ? settingsManager.get(require.replace('!', '')) : !settingsManager.get(require));
    }
}

@Component({
	standalone: false,
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

