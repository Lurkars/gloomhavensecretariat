import { TestBed } from '@angular/core/testing';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { LootType } from 'src/app/game/model/data/Loot';
import { DistributionEntry, PartyDistributionComponent } from 'src/app/ui/figures/party/distribution/distribution';

function buildCharacter(name: string): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(
  mode: 'receive' | 'spend',
  entries: DistributionEntry[],
  globalTotal: number | undefined
): PartyDistributionComponent {
  const fixture = TestBed.createComponent(PartyDistributionComponent);
  fixture.componentRef.setInput('mode', mode);
  fixture.componentRef.setInput('entries', entries);
  fixture.componentRef.setInput('globalTotal', globalTotal);
  fixture.componentRef.setInput('showParty', true);
  fixture.componentRef.setInput('characters', [buildCharacter('brute')]);
  const component = fixture.componentInstance;
  component.ngOnInit();
  return component;
}

describe('PartyDistributionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PartyDistributionComponent] }).compileComponents();
  });

  it('limits receiving each entry by its own total within the global total', () => {
    const component = createComponent(
      'receive',
      [
        { type: LootType.lumber, total: 1 },
        { type: LootType.metal, total: 1 },
        { type: LootType.hide, total: 1 }
      ],
      2
    );
    component.increment(LootType.lumber, 0);
    expect(component.canIncrement(LootType.lumber, 0)).toBe(false);
    expect(component.canIncrement(LootType.lumber, 'party')).toBe(false);
    expect(component.canIncrement(LootType.metal, 'party')).toBe(true);
    component.increment(LootType.metal, 'party');
    expect(component.canIncrement(LootType.hide, 0)).toBe(false);
  });

  it('allows receiving one entry up to the global total if its own total permits', () => {
    const component = createComponent(
      'receive',
      [
        { type: LootType.lumber, total: 2 },
        { type: LootType.metal, total: 2 }
      ],
      2
    );
    component.increment(LootType.lumber, 0);
    component.increment(LootType.lumber, 0);
    expect(component.characterValues[0][LootType.lumber]).toEqual(2);
    expect(component.canIncrement(LootType.metal, 0)).toBe(false);
  });
});
