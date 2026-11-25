import { gameManager } from 'src/app/game/businesslogic/Managers';
import { EventCardAttack, EventCardAttackTarget, EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { OutpostAttackModel } from 'src/app/game/model/data/OutpostAttack';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { EventHelper } from 'src/app/ui/figures/entities-menu/helpers/event';

describe('EventHelper outpost attack', () => {
  const component = { dialog: { open: vi.fn() } } as unknown as EntitiesMenuDialogComponent;
  const attack = new EventCardAttack(30, 2, new EventCardAttackTarget(false), '', '', []);

  beforeEach(() => {
    gameManager.game.party.outpostAttack = undefined;
    vi.spyOn(gameManager.outpostAttackManager, 'canStart').mockReturnValue(true);
    vi.spyOn(gameManager.outpostAttackManager, 'start').mockImplementation(() => {
      gameManager.game.party.outpostAttack = new OutpostAttackModel();
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    gameManager.game.party.outpostAttack = undefined;
  });

  it('starts the attack of event results', () => {
    const helper = new EventHelper(component);
    const effect = new EventCardEffect(EventCardEffectType.outpostAttack, [5]);
    helper.createEventResults([attack, effect]);
    expect(gameManager.outpostAttackManager.start).toHaveBeenCalledWith(attack, [effect], true);
    expect(helper.outpostAttack).toBeDefined();
  });

  it('removes an attack it started on close', () => {
    const helper = new EventHelper(component);
    helper.createEventResults([attack]);
    helper.close();
    expect(gameManager.game.party.outpostAttack).toBeUndefined();
  });

  it('replaces a running attack with the attack of new event results', () => {
    const running = new OutpostAttackModel();
    gameManager.game.party.outpostAttack = running;
    const helper = new EventHelper(component);
    helper.createEventResults([attack]);
    expect(gameManager.outpostAttackManager.start).toHaveBeenCalledWith(attack, [], true);
    expect(gameManager.game.party.outpostAttack).not.toBe(running);
  });

  it('keeps an attack started elsewhere on close', () => {
    gameManager.game.party.outpostAttack = new OutpostAttackModel();
    const helper = new EventHelper(component);
    helper.close();
    expect(gameManager.game.party.outpostAttack).toBeDefined();
  });

  it('cancels the running attack from the menu', () => {
    gameManager.game.party.outpostAttack = new OutpostAttackModel();
    const helper = new EventHelper(component);
    helper.cancelOutpostAttack();
    expect(gameManager.game.party.outpostAttack).toBeUndefined();
  });

  it('does not start an attack without town guard', () => {
    vi.mocked(gameManager.outpostAttackManager.canStart).mockReturnValue(false);
    const helper = new EventHelper(component);
    helper.createEventResults([attack]);
    expect(gameManager.outpostAttackManager.start).not.toHaveBeenCalled();
  });

  it('shows the event attack or the manual attack values', () => {
    const helper = new EventHelper(component);
    const model = new OutpostAttackModel();
    model.attack = attack;
    gameManager.game.party.outpostAttack = model;
    expect(helper.outpostAttackCard).toBe(attack);

    model.attack = undefined;
    model.manualAttackValue = 40;
    model.manualTargetNumber = 3;
    vi.spyOn(gameManager.outpostAttackManager, 'barracksBonus').mockReturnValue(undefined);
    expect(helper.outpostAttackCard?.attackValue).toBe(40);
    expect(helper.outpostAttackCard?.targetNumber).toBe(3);
    expect(helper.outpostAttackCard).toBe(helper.outpostAttackCard);
  });
});
