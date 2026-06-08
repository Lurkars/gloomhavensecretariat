import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';

function plainLabel(labelKey: string): string {
  return settingsManager
    .getLabel(labelKey)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function resolveLabelEffect(labelKey: string): EventCardEffect | undefined {
  const label = plainLabel(labelKey);

  let match = label.match(/gain (\d+) collective material resources of any kind/);
  if (match) {
    return new EventCardEffect(EventCardEffectType.collectiveResourceAny, [+match[1]]);
  }

  match = label.match(/gain (\d+) collective gold/);
  if (match) {
    return new EventCardEffect(EventCardEffectType.collectiveGold, [+match[1]]);
  }

  match = label.match(/lose (\d+) collective resources/);
  if (match) {
    return new EventCardEffect(EventCardEffectType.loseCollectiveResourceAny, [+match[1]]);
  }

  return undefined;
}

export function resolveDistributableEffect(effect: EventCardEffect): EventCardEffect {
  if (effect.type === EventCardEffectType.custom && effect.values[0] && typeof effect.values[0] === 'string') {
    return resolveLabelEffect(effect.values[0]) || effect;
  }
  return effect;
}
