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

export const TRADE_RECEIVE = 'receive';

function tradeParts(values: (BASE_TYPE | undefined)[]): { spent: (BASE_TYPE | undefined)[]; received: (BASE_TYPE | undefined)[] } {
  const index = values.indexOf(TRADE_RECEIVE);
  return index === -1 ? { spent: values, received: [] } : { spent: values.slice(0, index), received: values.slice(index + 1) };
}

export function tradeValid(values: (BASE_TYPE | undefined)[]): boolean {
  const { spent, received } = tradeParts(values);
  return paymentValid(spent) && paymentValid(received) && values.filter((value) => value === TRADE_RECEIVE).length === 1;
}

export function tradeResult(values: (BASE_TYPE | undefined)[]): SelectResourceResult {
  const { spent, received } = tradeParts(values);
  const spentResult = payment(spent) || new SelectResourceResult([], [], emptyCosts());
  const receivedResult = payment(received) || new SelectResourceResult([], [], emptyCosts());
  const characters = [...spentResult.characters];
  receivedResult.characters.forEach((character) => {
    if (!characters.includes(character)) {
      characters.push(character);
    }
  });
  const characterSpent = characters.map((character) => {
    const index = spentResult.characters.indexOf(character);
    return index === -1 ? emptyCosts() : spentResult.characterSpent[index];
  });
  const characterReceived = characters.map((character) => {
    const index = receivedResult.characters.indexOf(character);
    return index === -1 ? emptyCosts() : receivedResult.characterSpent[index];
  });
  return new SelectResourceResult(
    characters,
    characterSpent,
    spentResult.fhSupportSpent,
    0,
    characterReceived,
    receivedResult.fhSupportSpent
  );
}
