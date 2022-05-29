import { CharacterStat } from "src/app/game/model/CharacterStat";
import { CharacterData } from "src/app/game/model/data/CharacterData";
import { Edition } from "src/app/game/model/Edition";

export const Demolitionist: CharacterData = new CharacterData("Demolitionist",
  [ new CharacterStat(1, 8),
  new CharacterStat(2, 9),
  new CharacterStat(3, 11),
  new CharacterStat(4, 12),
  new CharacterStat(5, 14),
  new CharacterStat(6, 15),
  new CharacterStat(7, 17),
  new CharacterStat(8, 18),
  new CharacterStat(9, 20) ], Edition.jotl );

export const RedGuard: CharacterData = new CharacterData("RedGuard",
  [ new CharacterStat(1, 10),
  new CharacterStat(2, 12),
  new CharacterStat(3, 14),
  new CharacterStat(4, 16),
  new CharacterStat(5, 18),
  new CharacterStat(6, 20),
  new CharacterStat(7, 22),
  new CharacterStat(8, 24),
  new CharacterStat(9, 26) ], Edition.jotl);

export const Voidwarden: CharacterData = new CharacterData("Voidwarden",
  [ new CharacterStat(1, 6),
  new CharacterStat(2, 7),
  new CharacterStat(3, 8),
  new CharacterStat(4, 9),
  new CharacterStat(5, 10),
  new CharacterStat(6, 11),
  new CharacterStat(7, 12),
  new CharacterStat(8, 13),
  new CharacterStat(9, 14) ], Edition.jotl);

export const Hatchet: CharacterData = new CharacterData("Hatchet",
  [ new CharacterStat(1, 8),
  new CharacterStat(2, 9),
  new CharacterStat(3, 11),
  new CharacterStat(4, 12),
  new CharacterStat(5, 14),
  new CharacterStat(6, 15),
  new CharacterStat(7, 17),
  new CharacterStat(8, 18),
  new CharacterStat(9, 20) ], Edition.jotl);