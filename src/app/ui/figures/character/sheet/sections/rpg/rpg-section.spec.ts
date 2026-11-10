import { RPG_ACTIVE_TALENT_ROWS, RPG_TALENT_ROWS, RpgPower, RpgProgress } from 'src/app/game/model/CharacterProgress';
import { rpgProgress } from 'src/app/ui/figures/character/sheet/sections/rpg/rpg-section';

function talent(name: string): RpgPower {
  return Object.assign(new RpgPower(), { name });
}

describe('rpgProgress', () => {
  it('fills all talent rows for a new sheet', () => {
    const rpg = rpgProgress(undefined);
    expect(rpg.talents.length).toBe(RPG_TALENT_ROWS);
  });

  it('migrates the legacy 2 active + 2 passive talent layout', () => {
    const source = Object.assign(new RpgProgress(), {
      talents: [talent('active1'), talent('active2'), talent('passive1'), talent('passive2')]
    });
    const rpg = rpgProgress(source);
    expect(rpg.talents.length).toBe(RPG_TALENT_ROWS);
    expect(rpg.talents.map((power) => power.name)).toEqual(['active1', 'active2', '', 'passive1', 'passive2', '', '']);
    expect(rpg.talents.findIndex((power) => power.name === 'passive1')).toBe(RPG_ACTIVE_TALENT_ROWS);
    expect(source.talents.length).toBe(4);
  });

  it('keeps the current talent layout unchanged', () => {
    const names = ['a1', 'a2', 'a3', 'p1', 'p2', 'p3', 'p4'];
    const rpg = rpgProgress(Object.assign(new RpgProgress(), { talents: names.map(talent) }));
    expect(rpg.talents.map((power) => power.name)).toEqual(names);
    expect(rpgProgress(rpg).talents.map((power) => power.name)).toEqual(names);
  });
});
