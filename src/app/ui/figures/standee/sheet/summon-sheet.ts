import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, inject, input, OnInit } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { EnhancementType } from 'src/app/game/model/data/Enhancement';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { Summon } from 'src/app/game/model/Summon';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { ActionEnhancementsComponent } from 'src/app/ui/figures/actions/enhancements/enhancements';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ValueCalcDirective } from 'src/app/ui/helper/valueCalc';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    forwardRef(() => GhsLabelDirective),
    forwardRef(() => ValueCalcDirective),
    forwardRef(() => ActionEnhancementsComponent),
    forwardRef(() => ActionComponent)
  ],
  selector: 'ghs-summon-sheet',
  templateUrl: './summon-sheet.html',
  styleUrls: ['./summon-sheet.scss']
})
export class SummonSheetComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  readonly inputSummon = input.required<Summon>({ alias: 'summon' });
  get summon(): Summon {
    return this.inputSummon();
  }

  readonly inputSummonData = input<SummonData>(undefined, { alias: 'summonData' });
  get summonData(): SummonData | undefined {
    return this.inputSummonData();
  }

  readonly action = input<boolean>(false);
  readonly additional = input<boolean>(false);
  readonly item = input<boolean>(false);
  readonly right = input<boolean>(false);
  readonly style = input<'gh' | 'fh' | false>(false);
  readonly actionIndex = input<string>('', { alias: 'index' });
  readonly cardId = input<number>();
  readonly character = input<Character>();
  fhStyle: boolean = false;

  settingsManager: SettingsManager = settingsManager;
  enhancementActions: Action[] = [];
  hasSummon: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.hasSummon = this.summon !== undefined;
    const style = this.style();
    this.fhStyle = (settingsManager.settings.fhStyle && !style) || style === 'fh';
    this.enhancementActions = [];
    if (this.summonData) {
      this.enhancementActions.push(new Action(ActionType.heal, this.summonData.health));
      this.enhancementActions.push(new Action(ActionType.attack, this.summonData.attack));
      this.enhancementActions.push(new Action(ActionType.move, this.summonData.movement));
      this.enhancementActions.push(new Action(ActionType.range, this.summonData.range));

      this.enhancementActions.forEach((action) => {
        action.enhancementTypes = [EnhancementType.square, EnhancementType.square, EnhancementType.square, EnhancementType.square];
      });
    }
  }
}
