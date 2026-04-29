import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewEncapsulation, inject, input } from '@angular/core';
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
  elementRef = inject(ElementRef);
  private ghsManager = inject(GhsManager);

  readonly setting = input.required<string>({ alias: 'ghs-setting-menu' });
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly requires = input<string[]>([]);
  readonly requiresOne = input<string[]>([]);
  readonly inputType = input<'checkbox' | 'radio' | 'number' | 'range' | 'condition-list'>('checkbox', { alias: 'type' });
  readonly values = input<string[]>([]);
  readonly min = input<number | ''>('');
  readonly max = input<number | ''>('');
  readonly step = input<number>(0.1);
  readonly default = input<number>(1);
  readonly hint = input<boolean>(true);
  readonly hintAbove = input<boolean>(true);
  readonly additionalHint = input<string>('');
  readonly suffix = input<string>('', { alias: 'labelSuffix' });
  readonly column = input<boolean>(false);

  type: 'checkbox' | 'radio' | 'number' | 'range' | 'condition-list' = 'checkbox';
  isDisabled: boolean = false;

  settingsManager: SettingsManager = settingsManager;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.type = this.inputType();
    if (this.type === 'checkbox' && this.values().length > 0) {
      this.type = 'radio';
    }

    this.update();
  }

  update() {
    this.isDisabled =
      (this.requires().length > 0 &&
        this.requires().some((require) =>
          require.startsWith('!') ? settingsManager.get(require.replace('!', '')) : !settingsManager.get(require)
        )) ||
      (this.requiresOne().length > 0 &&
        this.requiresOne().every((require) =>
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

  readonly setting = input.required<string>({ alias: 'ghs-setting-title-menu' });
  readonly sync = input<boolean>(false);
}
