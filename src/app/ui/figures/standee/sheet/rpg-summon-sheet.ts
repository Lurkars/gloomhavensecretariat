import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, inject, input, OnInit } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action } from 'src/app/game/model/data/Action';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { Summon } from 'src/app/game/model/Summon';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

export class RpgSummonSheetRow {
  type: 'primary' | 'secondary' | 'special';
  action: Action | undefined;

  constructor(type: 'primary' | 'secondary' | 'special', action: Action | undefined) {
    this.type = type;
    this.action = action;
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, forwardRef(() => GhsLabelDirective), forwardRef(() => ActionComponent)],
  selector: 'ghs-summon-sheet-rpg',
  templateUrl: './rpg-summon-sheet.html',
  styleUrls: ['./rpg-summon-sheet.scss']
})
export class RpgSummonSheetComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  readonly summon = input<Summon>();
  readonly summonData = input<SummonData>();

  name: string = '';
  title: string = '';
  count: number = 1;
  flying: boolean = false;
  rows: RpgSummonSheetRow[] = [];
  fhStyle: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    const summon = this.summon();
    const summonData = this.summonData();
    this.fhStyle = settingsManager.settings.fhStyle;
    this.name = (summon && summon.name) || (summonData && summonData.name) || '';
    this.title = (summon && summon.title) || '';
    this.count = (!summon && summonData && summonData.count) || 1;
    this.flying = summon ? summon.flying : !!summonData && summonData.flying;
    const source = summon || summonData;
    this.rows = [
      new RpgSummonSheetRow('primary', source && source.action),
      new RpgSummonSheetRow('secondary', source && source.additionalAction),
      new RpgSummonSheetRow('special', source && source.specialAction)
    ];
  }
}
