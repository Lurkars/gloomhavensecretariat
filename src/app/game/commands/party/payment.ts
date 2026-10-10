import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { BuildingCosts, SelectResourceResult } from 'src/app/game/model/data/BuildingData';

const PAYMENT_RESOURCES = ['gold', 'hide', 'lumber', 'metal', 'manual', 'morale'];

export function paymentValid(values: (BASE_TYPE | undefined)[]): boolean {
  if (values.length % 3 !== 0) {
    return false;
  }
  for (let i = 0; i < values.length; i += 3) {
    const payer = values[i];
    const resource = values[i + 1];
    const amount = values[i + 2];
    if (
      typeof payer !== 'number' ||
      (payer !== -1 && !findCharacter(payer)) ||
      !PAYMENT_RESOURCES.includes(resource as string) ||
      typeof amount !== 'number' ||
      amount < 0 ||
      (payer !== -1 && (resource === 'manual' || resource === 'morale')) ||
      (payer === -1 && resource === 'gold')
    ) {
      return false;
    }
  }
  return true;
}

function emptyCosts(): BuildingCosts {
  return { prosperity: 0, lumber: 0, metal: 0, hide: 0, gold: 0, manual: 0 };
}

export function payment(values: (BASE_TYPE | undefined)[]): SelectResourceResult | undefined {
  if (!values.length) {
    return undefined;
  }
  const characters: Character[] = [];
  const characterSpent: BuildingCosts[] = [];
  const fhSupportSpent: BuildingCosts = emptyCosts();
  let morale = 0;
  for (let i = 0; i < values.length; i += 3) {
    const payer = values[i] as number;
    const resource = values[i + 1] as string;
    const amount = values[i + 2] as number;
    if (payer === -1) {
      if (resource === 'morale') {
        morale += amount;
      } else {
        fhSupportSpent[resource as keyof BuildingCosts] += amount;
      }
    } else {
      const character = findCharacter(payer) as Character;
      let index = characters.indexOf(character);
      if (index === -1) {
        characters.push(character);
        characterSpent.push(emptyCosts());
        index = characters.length - 1;
      }
      characterSpent[index][resource as keyof BuildingCosts] += amount;
    }
  }
  return new SelectResourceResult(characters, characterSpent, fhSupportSpent, morale);
}

export function applyPayment(values: (BASE_TYPE | undefined)[]) {
  const result = payment(values);
  if (result) {
    if (result.morale) {
      gameManager.campaignManager.changeMorale(-result.morale);
    }
    gameManager.lootManager.applySelectResources(result);
  }
}
