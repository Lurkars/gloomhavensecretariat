import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel } from 'src/app/game/model/Building';
import { AttackModifierDeck, AttackResult } from 'src/app/game/model/data/AttackModifier';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { EventCardAttack, EventCardAttackTarget, EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { OutpostAttackModel, OutpostAttackResource } from 'src/app/game/model/data/OutpostAttack';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';

export class OutpostAttackManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  moraleDefense(): number {
    const morale = this.game.party.morale;
    if (morale < 3) {
      return -10;
    } else if (morale < 5) {
      return -5;
    } else if (morale < 8) {
      return 0;
    } else if (morale < 11) {
      return 5;
    } else if (morale < 14) {
      return 10;
    }
    return 15;
  }

  barracksBonus(): { available: boolean; bonus: number } | undefined {
    const barracks = this.game.party.buildings.find((building) => building.name === 'barracks' && building.level);
    if (!barracks) {
      return undefined;
    }
    if (barracks.state === 'wrecked') {
      return { available: false, bonus: 0 };
    }
    return { available: true, bonus: [0, -5, -15, -25, -35][barracks.level] || 0 };
  }

  hasTownGuardDeck(): boolean {
    const model = this.game.party.townGuardDeck;
    return !!model && !!model.cards && model.cards.length > 0;
  }

  setupTownGuardDeck(): boolean {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign || !campaign.townGuardPerks || this.hasTownGuardDeck()) {
      return false;
    }
    const deck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(this.game.party, campaign);
    gameManager.attackModifierManager.shuffleModifiers(deck);
    deck.active = false;
    this.game.party.townGuardDeck = deck.toModel();
    return true;
  }

  townGuardPerkSectionAvailable(section: string): boolean {
    const sections = this.game.party.townGuardPerkSections || [];
    return sections.includes(section) || sections.length < Math.floor(this.game.party.townGuardPerks / 3);
  }

  setTownGuardPerkSection(section: string, value: boolean) {
    const party = this.game.party;
    party.townGuardPerkSections = party.townGuardPerkSections || [];
    if (party.townGuardPerkSections.includes(section) === value) {
      return;
    }
    if (value) {
      party.townGuardPerkSections.push(section);
    } else {
      party.townGuardPerkSections.splice(party.townGuardPerkSections.indexOf(section), 1);
    }
    const active = !!party.townGuardDeck && party.townGuardDeck.active;
    const deck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(party, gameManager.campaignManager.campaignData());
    deck.active = active;
    gameManager.attackModifierManager.shuffleModifiers(deck);
    party.townGuardDeck = deck.toModel();
  }

  townGuardDeck(): AttackModifierDeck | undefined {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign || !campaign.townGuardPerks) {
      return undefined;
    }
    const deck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(this.game.party, campaign);
    const model = this.game.party.townGuardDeck;
    if (model && this.hasTownGuardDeck()) {
      gameManager.attackModifierManager.fromModel(deck, model);
    } else {
      gameManager.attackModifierManager.shuffleModifiers(deck);
    }
    deck.active = true;
    return deck;
  }

  townGuardResources(deck: AttackModifierDeck, drawnBefore: number): EventCardEffect[] {
    const effects: EventCardEffect[] = [];
    deck.cards
      .slice(drawnBefore + 1, deck.current + 1)
      .filter((card) => !card.rolling || deck.state !== 'disadvantage')
      .forEach((card) =>
        card.effects.forEach((effect) => {
          // '+1%game.resource.hide%' or '%game.custom.materialResource:2%'
          const match =
            effect.value.match(/^\+(\d+)%game\.resource\.(\w+)%$/) || effect.value.match(/^%game\.custom\.materialResource:(\d+)%$/);
          if (match) {
            const type = match[2] ? EventCardEffectType.collectiveResource : EventCardEffectType.collectiveResourceType;
            effects.push(new EventCardEffect(type, [+match[1], match[2] || 'material_resources']));
          }
        })
      );
    return effects;
  }

  isTarget(data: BuildingData, model: BuildingModel, target: EventCardAttackTarget | undefined): boolean {
    if (!data.id || isNaN(+data.id) || model.state === 'wrecked') {
      return false;
    }
    const number = +data.id;
    if (!target) {
      return true;
    }
    if (target.parity && ((target.parity === 'even' && number % 2 === 1) || (target.parity === 'odd' && number % 2 === 0))) {
      return false;
    }
    if (target.lowerBoundary && number < target.lowerBoundary) {
      return false;
    }
    return !target.upperBoundary || number <= target.upperBoundary;
  }

  attackedState(
    model: BuildingModel,
    deck: AttackModifierDeck,
    attackResult: AttackResult | undefined,
    attackValue: number
  ): 'normal' | 'damaged' | 'wrecked' {
    if (attackResult) {
      const card = deck.cards[attackResult.index];
      if (card.type === 'wreck') {
        return 'wrecked';
      } else if (card.type !== 'success' && attackResult.result < attackValue) {
        return 'damaged';
      }
    }
    return model.state;
  }

  attackBuilding(model: BuildingModel, state: 'normal' | 'damaged' | 'wrecked', soldiers: number) {
    this.game.party.soldiers -= soldiers;
    model.attacked = true;
    model.state = state;
  }

  buildings(): { model: BuildingModel; data: BuildingData }[] {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign) {
      return [];
    }
    return this.game.party.buildings
      .map((model) => ({ model, data: campaign.buildings.find((buildingData) => buildingData.name === model.name) }))
      .filter((building) => !!building.data && building.model.level > 0 && !!building.data.id && !isNaN(+building.data.id))
      .map((building) => building as { model: BuildingModel; data: BuildingData });
  }

  defaultAttack(attack: EventCardAttack | undefined, effects: EventCardEffect[] = []): EventCardAttack | undefined {
    if (!attack) {
      return undefined;
    }
    const result = new EventCardAttack(
      attack.attackValue,
      attack.targetNumber,
      attack.target,
      attack.targetDescription,
      attack.narrative,
      attack.effects
    );
    let attackValueChange = 0;
    let targetNumberChange = 0;
    effects.forEach((effect) => {
      if (effect.values.length && typeof effect.values[0] !== 'object') {
        if (effect.type === EventCardEffectType.outpostAttack) {
          attackValueChange = EntityValueFunction(effect.values[0]);
        } else if (effect.type === EventCardEffectType.outpostTarget) {
          targetNumberChange = EntityValueFunction(effect.values[0]);
        }
      }
    });
    const sign = (value: number) => (value > 0 ? '+' : '') + value;
    if (attackValueChange) {
      result.attackValue =
        typeof result.attackValue === 'number'
          ? result.attackValue + attackValueChange
          : result.attackValue + ' ' + sign(attackValueChange);
    }
    if (targetNumberChange) {
      result.targetNumber =
        typeof result.targetNumber === 'number'
          ? result.targetNumber + targetNumberChange
          : result.targetNumber + ' ' + sign(targetNumberChange);
    }
    return result;
  }

  start(attack: EventCardAttack | undefined, effects: EventCardEffect[] = []) {
    const model = new OutpostAttackModel();
    model.attack = attack
      ? new EventCardAttack(
          attack.attackValue,
          attack.targetNumber,
          attack.target,
          attack.targetDescription,
          attack.narrative,
          attack.effects
        )
      : undefined;
    model.effects = effects;
    model.target = Object.assign(new EventCardAttackTarget(!model.attack), (model.attack && model.attack.target) || {});
    this.game.party.buildings.forEach((building) => (building.attacked = undefined));
    this.setupTownGuardDeck();
    this.game.party.outpostAttack = model;
    this.sort();
    if (model.target.randomize) {
      gameManager.randomManager.shuffle(model.buildings);
    }
  }

  finish(): EventCardEffect[] {
    const model = this.game.party.outpostAttack;
    this.game.party.outpostAttack = undefined;
    this.game.party.buildings.forEach((building) => (building.attacked = undefined));
    return model ? model.resources.filter((resource) => resource.enabled).map((resource) => resource.effect) : [];
  }

  attack(): EventCardAttack | undefined {
    const model = this.game.party.outpostAttack;
    if (!model) {
      return undefined;
    }
    const barracks = this.barracksBonus();
    const bonus = barracks && barracks.available ? barracks.bonus : 0;
    const base = this.defaultAttack(model.attack, model.effects || []);
    return new EventCardAttack(
      EntityValueFunction(base ? base.attackValue : model.manualAttackValue) + model.soldiers * bonus,
      EntityValueFunction(base ? base.targetNumber : model.manualTargetNumber) - model.attacks,
      model.target,
      base ? base.targetDescription : '',
      base ? base.narrative : '',
      base ? base.effects : []
    );
  }

  factor(): 'advantage' | 'disadvantage' | false {
    const barracks = this.barracksBonus();
    if (barracks && !barracks.available) {
      return 'disadvantage';
    }
    return this.game.party.outpostAttack && this.game.party.outpostAttack.soldiers ? 'advantage' : false;
  }

  setManual(attackValue: number, targetNumber: number) {
    const model = this.game.party.outpostAttack;
    if (model) {
      model.manualAttackValue = attackValue;
      model.manualTargetNumber = targetNumber;
    }
  }

  setTarget(target: Partial<EventCardAttackTarget>) {
    const model = this.game.party.outpostAttack;
    if (model) {
      Object.assign(model.target, target);
      this.sort();
    }
  }

  toggleSoldier(soldier: number) {
    const model = this.game.party.outpostAttack;
    const barracks = this.barracksBonus();
    if (model && barracks && barracks.available) {
      model.soldiers = model.soldiers === soldier ? soldier - 1 : Math.min(soldier, this.game.party.soldiers);
    }
  }

  moveBuilding(fromList: 'buildings' | 'others', fromIndex: number, toList: 'buildings' | 'others', toIndex: number) {
    const model = this.game.party.outpostAttack;
    if (model) {
      const name = model[fromList].splice(fromIndex, 1)[0];
      if (name) {
        model[toList].splice(toIndex, 0, name);
      }
    }
  }

  randomize() {
    const model = this.game.party.outpostAttack;
    if (model) {
      gameManager.randomManager.shuffle(model.buildings);
    }
  }

  toggleResource(index: number) {
    const model = this.game.party.outpostAttack;
    if (model && model.resources[index]) {
      model.resources[index].enabled = !model.resources[index].enabled;
    }
  }

  defense(): number {
    return (this.game.party.defense || 0) + this.moraleDefense();
  }

  beforeDraw(deck: AttackModifierDeck) {
    const model = this.game.party.outpostAttack;
    if (model) {
      model.drawnBefore = deck.current;
      model.attackResult = -1;
    }
  }

  afterDraw(deck: AttackModifierDeck, draw: boolean) {
    this.game.party.townGuardDeck = deck.toModel();
    const model = this.game.party.outpostAttack;
    if (model) {
      const result = deck.current >= 0 ? gameManager.attackModifierManager.calculateAttackResult(deck, this.defense()) : undefined;
      model.attackResult = result ? result.index : -1;
      if (draw) {
        this.townGuardResources(deck, model.drawnBefore).forEach((effect) => model.resources.push(new OutpostAttackResource(effect)));
      }
    }
  }

  result(deck: AttackModifierDeck): AttackResult | undefined {
    const model = this.game.party.outpostAttack;
    if (!model || model.attackResult < 0 || deck.current < 0) {
      return undefined;
    }
    return gameManager.attackModifierManager.calculateAttackResult(deck, this.defense(), model.attackResult);
  }

  toggleResult(deck: AttackModifierDeck) {
    const model = this.game.party.outpostAttack;
    const result = this.result(deck);
    if (model && result && result.chooseOffset) {
      model.attackResult = result.index + result.chooseOffset;
    }
  }

  target(): { model: BuildingModel; data: BuildingData } | undefined {
    const model = this.game.party.outpostAttack;
    const attack = this.attack();
    if (!model || !attack || !EntityValueFunction(attack.targetNumber)) {
      return undefined;
    }
    const name = model.buildings[model.attacks];
    return this.buildings().find((building) => building.model.name === name);
  }

  targetState(deck: AttackModifierDeck): 'normal' | 'damaged' | 'wrecked' | undefined {
    const target = this.target();
    const attack = this.attack();
    return target && attack
      ? this.attackedState(target.model, deck, this.result(deck), EntityValueFunction(attack.attackValue))
      : undefined;
  }

  attackTarget(deck: AttackModifierDeck) {
    const model = this.game.party.outpostAttack;
    const target = this.target();
    const state = this.targetState(deck);
    if (!model || !target || !state) {
      return;
    }
    this.attackBuilding(target.model, state, model.soldiers);
    model.soldiers = 0;
    model.attacks++;
    model.attackResult = -1;

    if (model.target.distance === 'previousTarget') {
      const buildings = this.buildings();
      const attacked = model.buildings.slice(0, model.attacks);
      const remaining = model.buildings
        .slice(model.attacks)
        .map((name) => buildings.find((building) => building.model.name === name))
        .filter((building) => !!building)
        .map((building) => building as { model: BuildingModel; data: BuildingData });
      remaining.sort((a, b) => {
        const distanceA = this.distance(a);
        const distanceB = this.distance(b);
        return distanceA > 0 && distanceB > 0 ? distanceA - distanceB : 0;
      });
      model.buildings = [...attacked, ...remaining.map((building) => building.model.name)];
    }
  }

  distance(building: { model: BuildingModel; data: BuildingData }): number {
    const model = this.game.party.outpostAttack;
    if (!model) {
      return -1;
    }
    let distance: number | undefined;
    const target = model.target;
    if (target.distance === 'previousTarget') {
      const index = model.buildings.indexOf(building.model.name);
      const previous = this.game.party.buildings.find((other) => other.name === model.buildings[model.attacks]);
      if (index <= model.attacks || !previous) {
        return 0;
      }
      distance = gameManager.buildingsManager.distanceBetween(building.model, previous);
    } else if (typeof target.distance === 'string') {
      const targetBuilding = this.game.party.buildings.find((other) => other.name === target.distance);
      if (targetBuilding) {
        distance = gameManager.buildingsManager.distanceBetween(building.model, targetBuilding);
      }
    } else if (target.distance) {
      distance = gameManager.buildingsManager.distanceFrom(building.model, target.distance as WorldMapCoordinates);
    }
    return distance !== undefined ? distance : -1;
  }

  private sort() {
    const model = this.game.party.outpostAttack;
    if (!model) {
      return;
    }
    const target = model.target;
    const buildings = this.buildings();
    const sort = (a: { model: BuildingModel; data: BuildingData }, b: { model: BuildingModel; data: BuildingData }) => {
      const filterA = this.isTarget(a.data, a.model, target);
      const filterB = this.isTarget(b.data, b.model, target);
      if (filterA !== filterB) {
        return filterA ? -1 : 1;
      }
      if (target.level && a.model.level !== b.model.level) {
        return target.level === 'low' ? a.model.level - b.model.level : b.model.level - a.model.level;
      }
      if (target.distance) {
        const distanceA = this.distance(a);
        const distanceB = this.distance(b);
        if (distanceA !== -1 && distanceB !== -1) {
          return distanceA - distanceB;
        }
      }
      return +a.data.id - +b.data.id;
    };
    const targets = buildings.filter((building) => this.isTarget(building.data, building.model, target)).sort(sort);
    const others = buildings.filter((building) => !targets.includes(building)).sort(sort);
    if (target.desc) {
      targets.reverse();
      others.reverse();
    }
    model.buildings = targets.map((building) => building.model.name);
    model.others = others.map((building) => building.model.name);
  }
}
