import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, TabClickDirective, GhsTooltipDirective],
  selector: '[ghs-setting-menu]',
  templateUrl: 'setting.html',
  styleUrls: ['../../menu.scss', '../settings.scss', 'setting.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingMenuComponent implements OnInit {
  @Input('ghs-setting-menu') setting!: string;
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Input() requires: string[] = [];
  @Input() requiresOne: string[] = [];
  @Input() type: 'checkbox' | 'radio' | 'number' | 'range' | 'condition-list' = 'checkbox';
  @Input() values: string[] = [];
  @Input() min: number | '' = '';
  @Input() max: number | '' = '';
  @Input() step: number = 0.1;
  @Input() default: number = 1;
  @Input() hint: boolean = true;
  @Input() additionalHint: string = '';
  @Input('labelSuffix') suffix: string = '';
  @Input() column: boolean = false;
  isDisabled: boolean = false;

  settingsManager: SettingsManager = settingsManager;

  constructor(
    public elementRef: ElementRef,
    private ghsManager: GhsManager
  ) {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    if (this.type === 'checkbox' && this.values.length > 0) {
      this.type = 'radio';
    }

    this.update();
  }

  update() {
    this.isDisabled =
      (this.requires.length > 0 &&
        this.requires.some((require) =>
          require.startsWith('!') ? settingsManager.get(require.replace('!', '')) : !settingsManager.get(require)
        )) ||
      (this.requiresOne.length > 0 &&
        this.requiresOne.every((require) =>
          require.startsWith('!') ? settingsManager.get(require.replace('!', '')) : !settingsManager.get(require)
        ));
  }
}

@Component({
  imports: [GhsLabelDirective],
  selector: '[ghs-setting-title-menu]',
  templateUrl: 'setting-title.html',
  styleUrls: ['../../menu.scss', '../settings.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingMenuTitleComponent {
  settingsManager: SettingsManager = settingsManager;

  @Input('ghs-setting-title-menu') setting!: string;
  @Input() sync: boolean = false;
}
