import { Directive, inject, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import {
  RPG_ANCESTRY_SKILL_ROWS,
  RPG_CLASS_SKILL_ROWS,
  RPG_FACTIONS,
  RPG_ITEM_ROWS,
  RPG_TALENT_ROWS,
  RpgFaction,
  RpgItem,
  RpgPower,
  RpgProgress
} from 'src/app/game/model/CharacterProgress';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';

function rows<T>(values: T[] | undefined, count: number, create: () => T): T[] {
  const list = values || [];
  return Array.from({ length: Math.max(count, list.length) }, (v, index) => Object.assign(create() as object, list[index] || {}) as T);
}

export function rpgProgress(source: RpgProgress | undefined): RpgProgress {
  const rpg: RpgProgress = Object.assign(new RpgProgress(), JSON.parse(JSON.stringify(source || {})));
  rpg.attributes = rpg.attributes || {};
  rpg.items = rows(rpg.items, RPG_ITEM_ROWS, () => new RpgItem());
  rpg.factions = rows(rpg.factions, RPG_FACTIONS, () => new RpgFaction());
  rpg.talents = rows(rpg.talents, RPG_TALENT_ROWS, () => new RpgPower());
  rpg.ancestrySkills = rows(rpg.ancestrySkills, RPG_ANCESTRY_SKILL_ROWS, () => new RpgPower());
  rpg.classSkills = rows(rpg.classSkills, RPG_CLASS_SKILL_ROWS, () => new RpgPower());
  return rpg;
}

@Directive()
export abstract class RpgSheetSection extends CharacterSheetSection implements OnInit {
  private ghsManager = inject(GhsManager);

  rpg: RpgProgress = new RpgProgress();

  constructor() {
    super();
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.rpg = rpgProgress(this.character.progress.rpg);
  }

  change(label: string, value: string | number | boolean, apply: (rpg: RpgProgress) => void) {
    if (this.locked) {
      return;
    }
    gameManager.stateManager.before('setRpgSheet', this.characterName, 'character.progress.rpg.' + label, '' + value);
    const rpg = rpgProgress(this.character.progress.rpg);
    apply(rpg);
    this.character.progress.rpg = rpg;
    gameManager.stateManager.after();
  }
}
