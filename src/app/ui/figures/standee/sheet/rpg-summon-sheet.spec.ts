import { TestBed } from '@angular/core/testing';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { Summon, SummonColor } from 'src/app/game/model/Summon';
import { RpgSummonSheetComponent } from 'src/app/ui/figures/standee/sheet/rpg-summon-sheet';

function buildSummonData(): SummonData {
  return Object.assign(new SummonData(), {
    name: 'companion',
    health: '8+Lx2',
    count: 2,
    flying: true,
    action: new Action(ActionType.attack, 2),
    specialAction: new Action(ActionType.custom, 'special')
  });
}

describe('RpgSummonSheetComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RpgSummonSheetComponent] }).compileComponents();
  });

  it('renders summon data with primary/secondary/special rows', () => {
    const fixture = TestBed.createComponent(RpgSummonSheetComponent);
    fixture.componentRef.setInput('summonData', buildSummonData());
    fixture.componentInstance.update();
    const component = fixture.componentInstance;
    expect(component.count).toBe(2);
    expect(component.flying).toBe(true);
    expect(component.rows.map((row) => row.type)).toEqual(['primary', 'secondary', 'special']);
    expect(component.rows.map((row) => !!row.action)).toEqual([true, false, true]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('prefers the active summon values', () => {
    const summon = new Summon('u1', 'companion', '', 1, 1, SummonColor.blue, buildSummonData());
    summon.title = 'Rex';
    const fixture = TestBed.createComponent(RpgSummonSheetComponent);
    fixture.componentRef.setInput('summon', summon);
    fixture.componentInstance.update();
    expect(fixture.componentInstance.title).toBe('Rex');
    expect(fixture.componentInstance.count).toBe(1);
  });
});
