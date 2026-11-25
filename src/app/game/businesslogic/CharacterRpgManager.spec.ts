import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { RPG_ACTIVE_TALENT_ROWS, RPG_ITEM_ROWS, RPG_TALENT_ROWS, RpgPower, RpgProgress } from 'src/app/game/model/CharacterProgress';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';

describe('CharacterRpgManager', () => {
  const characterRpgManager = gameManager.characterRpgManager;
  const talent = (name: string) => Object.assign(new RpgPower(), { name });

  function rpgCharacter(): Character {
    return new Character(Object.assign(new CharacterData(), { name: 'rpgchar', edition: 'rpg', stats: [new CharacterStat(1, 10)] }), 1);
  }

  it('fills all rows for a new sheet', () => {
    const rpg = characterRpgManager.rpgProgress(undefined);
    expect(rpg.talents.length).toBe(RPG_TALENT_ROWS);
    expect(rpg.items.length).toBe(RPG_ITEM_ROWS);
  });

  it('migrates the legacy 2 active + 2 passive talent layout', () => {
    const source = Object.assign(new RpgProgress(), {
      talents: [talent('active1'), talent('active2'), talent('passive1'), talent('passive2')]
    });
    const rpg = characterRpgManager.rpgProgress(source);
    expect(rpg.talents.map((power) => power.name)).toEqual(['active1', 'active2', '', 'passive1', 'passive2', '', '']);
    expect(rpg.talents.findIndex((power) => power.name === 'passive1')).toBe(RPG_ACTIVE_TALENT_ROWS);
    expect(source.talents.length).toBe(4);
  });

  it('keeps the current talent layout unchanged', () => {
    const names = ['a1', 'a2', 'a3', 'p1', 'p2', 'p3', 'p4'];
    const rpg = characterRpgManager.rpgProgress(Object.assign(new RpgProgress(), { talents: names.map(talent) }));
    expect(characterRpgManager.rpgProgress(rpg).talents.map((power) => power.name)).toEqual(names);
  });

  it('sets text, attribute, item, faction and power values by path', () => {
    const character = rpgCharacter();
    expect(characterRpgManager.setRpgValue(character, 'pronouns', 'they/them')).toBe(true);
    expect(characterRpgManager.setRpgValue(character, 'attributes.grit', 2)).toBe(true);
    expect(characterRpgManager.setRpgValue(character, 'items.3.name', 'Sword')).toBe(true);
    expect(characterRpgManager.setRpgValue(character, 'items.3.equipped', true)).toBe(true);
    expect(characterRpgManager.setRpgValue(character, 'factions.1.tier', 3)).toBe(true);
    expect(characterRpgManager.setRpgValue(character, 'factions.1.benefits.2', 'Discount')).toBe(true);
    expect(characterRpgManager.setRpgValue(character, 'talents.0.state', 'lost')).toBe(true);
    const rpg = character.progress.rpg as RpgProgress;
    expect(rpg.pronouns).toBe('they/them');
    expect(rpg.attributes.grit).toBe(2);
    expect(rpg.items[3].name).toBe('Sword');
    expect(rpg.items[3].equipped).toBe(true);
    expect(rpg.factions[1].tier).toBe(3);
    expect(rpg.factions[1].benefits[2]).toBe('Discount');
    expect(rpg.talents[0].state).toBe('lost');
    expect(characterRpgManager.setRpgValue(character, 'talents.0.state', '')).toBe(true);
    expect((character.progress.rpg as RpgProgress).talents[0].state).toBeUndefined();
  });

  it('rejects unknown paths, out of range rows and wrong value types', () => {
    const character = rpgCharacter();
    expect(characterRpgManager.canSetRpgValue(character, 'unknown', 'x')).toBe(false);
    expect(characterRpgManager.canSetRpgValue(character, 'attributes.strength', 1)).toBe(false);
    expect(characterRpgManager.canSetRpgValue(character, 'attributes.grit', '1')).toBe(false);
    expect(characterRpgManager.canSetRpgValue(character, 'items.' + RPG_ITEM_ROWS + '.name', 'x')).toBe(false);
    expect(characterRpgManager.canSetRpgValue(character, 'items.0.equipped', 'yes')).toBe(false);
    expect(characterRpgManager.canSetRpgValue(character, 'items.0.unknown', 'x')).toBe(false);
    expect(characterRpgManager.canSetRpgValue(character, 'factions.0.tier', 6)).toBe(false);
    expect(characterRpgManager.canSetRpgValue(character, 'factions.0.benefits.4', 'x')).toBe(false);
    expect(characterRpgManager.canSetRpgValue(character, 'talents.0.state', 'gone')).toBe(false);
    expect(characterRpgManager.setRpgValue(character, 'items.0.equipped', 'yes')).toBe(false);
    expect(character.progress.rpg).toBeUndefined();
  });
});
