import { gameManager } from 'src/app/game/businesslogic/Managers';
import {
  OutpostAttackCommand,
  OutpostCancelCommand,
  OutpostDrawCommand,
  OutpostFinishCommand,
  OutpostManualCommand,
  OutpostOrderCommand,
  OutpostRandomizeCommand,
  OutpostResourceCommand,
  OutpostResultCommand,
  OutpostSoldiersCommand,
  OutpostStartCommand,
  OutpostTargetCommand
} from 'src/app/game/commands/building/OutpostAttack';
import { resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { BuildingModel } from 'src/app/game/model/Building';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { CampaignData } from 'src/app/game/model/data/EditionData';
import { EventCardAttack, EventCardAttackTarget, EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { OutpostAttackModel, OutpostAttackResource } from 'src/app/game/model/data/OutpostAttack';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';

describe('Outpost attack commands', () => {
  const buildingData = (id: string, name: string) => Object.assign(new BuildingData(), { id, name });

  beforeEach(() => {
    resetTestGame();
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(
      Object.assign(new CampaignData(), {
        townGuardPerks: [{}],
        buildings: [buildingData('05', 'mining-camp'), buildingData('12', 'hunting-lodge'), buildingData('98', 'barracks')]
      })
    );
    vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
    vi.spyOn(gameManager.attackModifierBuildManager, 'buildTownGuardAttackModifierDeck').mockImplementation(
      () => new AttackModifierDeck([new AttackModifier(AttackModifierType.wreck), new AttackModifier(AttackModifierType.success)])
    );
    gameManager.game.party.buildings = [
      new BuildingModel('mining-camp', 1),
      new BuildingModel('hunting-lodge', 2),
      new BuildingModel('barracks', 1)
    ];
    gameManager.game.party.soldiers = 2;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function model(): OutpostAttackModel {
    return gameManager.game.party.outpostAttack as OutpostAttackModel;
  }

  it('starts, cancels and finishes an attack', () => {
    expect(new OutpostStartCommand('1').validParameters('1' as never)).toBe(false);
    new OutpostStartCommand(1).execute();
    expect(gameManager.game.seed).toBe(1);
    const running = model();
    expect(running.buildings).toEqual(['mining-camp', 'hunting-lodge', 'barracks']);
    expect(new OutpostStartCommand(2).validParameters(2)).toBe(false);
    new OutpostStartCommand(2, true).execute();
    expect(model()).not.toBe(running);

    new OutpostCancelCommand().execute();
    expect(gameManager.game.party.outpostAttack).toBeUndefined();
    expect(new OutpostCancelCommand().validParameters()).toBe(false);
    expect(new OutpostFinishCommand().validParameters()).toBe(false);

    new OutpostStartCommand(3).execute();
    new OutpostFinishCommand().execute();
    expect(gameManager.game.party.outpostAttack).toBeUndefined();
  });

  it('starts an attack from an event card', () => {
    const attack = new EventCardAttack(20, 2, new EventCardAttackTarget(false), '', '', []);
    const spy = vi
      .spyOn(gameManager.eventCardManager, 'eventOutpostAttack')
      .mockReturnValue({ attack, effects: [new EventCardEffect(EventCardEffectType.outpostAttack, [5])] });
    new OutpostStartCommand(1, false, 'summer-outpost', 'SO-07').execute();
    expect(spy).toHaveBeenCalledWith('summer-outpost', 'SO-07');
    expect(model().attack?.attackValue).toBe(20);
    expect(model().effects.length).toBe(1);
  });

  it('changes soldiers, manual values, resources and order', () => {
    new OutpostStartCommand(1).execute();
    new OutpostSoldiersCommand(2).execute();
    expect(model().soldiers).toBe(2);
    expect(new OutpostSoldiersCommand(3).validParameters(3)).toBe(false);

    new OutpostManualCommand(30, 3).execute();
    expect(model().manualAttackValue).toBe(30);
    expect(model().manualTargetNumber).toBe(3);
    expect(new OutpostManualCommand(-1, 3).validParameters(-1, 3)).toBe(false);

    expect(new OutpostResourceCommand(0).validParameters(0)).toBe(false);
    model().resources = [new OutpostAttackResource(new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide']))];
    new OutpostResourceCommand(0).execute();
    expect(model().resources[0].enabled).toBe(false);

    new OutpostOrderCommand('buildings', 0, 'others', 0).execute();
    expect(model().buildings).toEqual(['hunting-lodge', 'barracks']);
    expect(model().others).toEqual(['mining-camp']);
    expect(new OutpostOrderCommand('others', 1, 'buildings', 0).validParameters('others', 1, 'buildings', 0)).toBe(false);
    expect(new OutpostOrderCommand('unknown', 0, 'buildings', 0).validParameters('unknown', 0, 'buildings', 0)).toBe(false);
  });

  it('sets the target filter and randomizes the order', () => {
    new OutpostStartCommand(1).execute();
    new OutpostTargetCommand(0, 0, '', 'high').execute();
    expect(model().target.level).toBe('high');
    expect(model().buildings).toEqual(['hunting-lodge', 'mining-camp', 'barracks']);
    new OutpostTargetCommand(undefined as never, undefined as never, 'odd').execute();
    expect(model().target.parity).toBe('odd');
    expect(model().target.level).toBe('high');

    const distance = new OutpostTargetCommand(0, 0, 0, 0, '10,20,4,6');
    distance.execute();
    expect(model().target.distance).toEqual(Object.assign(new WorldMapCoordinates(), { x: 10, y: 20, width: 4, height: 6 }));
    new OutpostTargetCommand(0, 0, 0, 0, '', false).execute();
    expect(model().target.distance).toBeUndefined();

    expect(new OutpostTargetCommand(0, 0, 'any').validParameters()).toBe(false);
    expect(new OutpostTargetCommand(0, 0, 0, 0, 'unknown').validParameters()).toBe(false);
    expect(new OutpostTargetCommand(0, 0, 0, 0, 'a,b').validParameters()).toBe(false);
    expect(new OutpostTargetCommand('1').validParameters()).toBe(false);

    vi.spyOn(gameManager.randomManager, 'shuffle').mockImplementation((values) => values.reverse());
    const order = [...model().buildings].reverse();
    new OutpostRandomizeCommand(5).execute();
    expect(gameManager.game.seed).toBe(5);
    expect(model().buildings).toEqual(order);
    expect(new OutpostRandomizeCommand('5').validParameters('5' as never)).toBe(false);
  });

  it('draws town guard cards, toggles the result and attacks the target', () => {
    expect(new OutpostDrawCommand(1).validParameters(1)).toBe(false);
    new OutpostStartCommand(1).execute();
    expect(new OutpostDrawCommand(1, 'twice').validParameters(1, 'twice')).toBe(false);
    new OutpostDrawCommand(2).execute();
    expect(model().attackResult).toBe(0);
    expect(new OutpostResultCommand().validParameters()).toBe(false);
    new OutpostAttackCommand().execute();
    expect(gameManager.game.party.buildings[0].state).toBe('wrecked');
    expect(gameManager.game.party.buildings[0].attacked).toBe(true);
    expect(model().attacks).toBe(1);

    model().manualTargetNumber = 1;
    expect(new OutpostAttackCommand().validParameters()).toBe(false);
  });
});
