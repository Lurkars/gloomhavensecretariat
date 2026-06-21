import { NgClass } from '@angular/common';
import { Component, input, OnInit, output } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { LootType } from 'src/app/game/model/data/Loot';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

export interface DistributionEntry {
  type: LootType | 'gold' | 'experience';
  total: number;
}

export interface DistributionChange {
  type: LootType | 'gold' | 'experience';
  source: number | 'party';
  value: number;
}

@Component({
  imports: [NgClass, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-party-distribution',
  templateUrl: './distribution.html',
  styleUrls: ['./distribution.scss'],
  host: { '[class.embedded]': 'embedded()' }
})
export class PartyDistributionComponent implements OnInit {
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  readonly mode = input.required<'receive' | 'spend'>();
  readonly entries = input<DistributionEntry[]>([]);
  readonly inputCharacters = input<Character[] | undefined>(undefined, { alias: 'characters' });
  readonly showParty = input<boolean>(false);
  readonly showHeader = input<boolean>(true);
  readonly ignoreAbsent = input<boolean>(false);
  readonly dark = input<boolean>(true);
  readonly embedded = input<boolean>(false);
  readonly initialCharacterValues = input<Partial<Record<string, number>>[]>([]);
  readonly initialPartyValues = input<Partial<Record<string, number>>>({});
  readonly globalTotal = input<number | undefined>(undefined);
  readonly externalPaid = input<number>(0);

  readonly distributionChange = output<DistributionChange>();

  characters: Character[] = [];
  characterValues: Partial<Record<string, number>>[] = [];
  partyValues: Partial<Record<string, number>> = {};

  ngOnInit(): void {
    this.characters =
      this.inputCharacters() ??
      gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
    this.characterValues = this.characters.map((_, i) => ({ ...(this.initialCharacterValues()[i] || {}) }));
    this.partyValues = { ...(this.initialPartyValues() || {}) };
  }

  get showCharacterColumns(): boolean {
    return this.mode() === 'receive' || this.entries().some((e) => e.type === 'gold') || !settingsManager.settings.fhShareResources;
  }

  get columnCount(): number {
    return 1 + (this.showParty() ? 1 : 0) + (this.showCharacterColumns ? this.characters.length : 0);
  }

  remaining(entry: DistributionEntry): number {
    const used = this.characterValues.reduce((sum, cv) => sum + (cv[entry.type] || 0), 0);
    return entry.total - used;
  }

  paid(entry: DistributionEntry): number {
    return (
      this.characterValues.reduce((sum, cv) => sum + (cv[entry.type] || 0), 0) + (this.showParty() ? this.partyValues[entry.type] || 0 : 0)
    );
  }

  private totalPaidNonGold(): number {
    let total = 0;
    for (const entry of this.entries()) {
      if (entry.type === 'gold' || entry.type === 'experience') continue;
      total += this.characterValues.reduce((sum, cv) => sum + (cv[entry.type] || 0), 0);
      if (this.showParty()) total += this.partyValues[entry.type] || 0;
    }
    return total;
  }

  characterAvailable(type: LootType | 'gold' | 'experience', index: number): number {
    const character = this.characters[index];
    if (!character) return 0;
    if (type === 'gold') return character.progress.gold;
    if (type === 'experience') return character.progress.experience;
    return character.progress.loot[type as LootType] || 0;
  }

  partyAvailable(type: LootType | 'gold' | 'experience'): number {
    if (type === 'gold' || type === 'experience') return 0;
    return gameManager.game.party.loot[type as LootType] || 0;
  }

  canIncrement(type: LootType | 'gold' | 'experience', source: number | 'party'): boolean {
    const entry = this.entries().find((e) => e.type === type);
    if (!entry) return false;
    if (this.globalTotal() !== undefined && type !== 'gold' && type !== 'experience') {
      if (this.totalPaidNonGold() + this.externalPaid() >= this.globalTotal()!) return false;
    } else {
      if (this.paid(entry) >= entry.total) return false;
    }
    if (source === 'party') {
      return (this.partyValues[type] || 0) < this.partyAvailable(type);
    }
    const i = source as number;
    return (this.characterValues[i]?.[type] || 0) < this.characterAvailable(type, i);
  }

  canDecrement(type: LootType | 'gold' | 'experience', source: number | 'party'): boolean {
    if (source === 'party') return (this.partyValues[type] || 0) > 0;
    const i = source as number;
    return (this.characterValues[i]?.[type] || 0) > 0;
  }

  increment(type: LootType | 'gold' | 'experience', source: number | 'party'): void {
    if (!this.canIncrement(type, source)) return;
    if (source === 'party') {
      this.partyValues[type] = (this.partyValues[type] || 0) + 1;
    } else {
      const i = source as number;
      this.characterValues[i][type] = (this.characterValues[i][type] || 0) + 1;
    }
    this.emitChange(type, source);
  }

  decrement(type: LootType | 'gold' | 'experience', source: number | 'party'): void {
    if (!this.canDecrement(type, source)) return;
    if (source === 'party') {
      this.partyValues[type] = (this.partyValues[type] || 0) - 1;
    } else {
      const i = source as number;
      this.characterValues[i][type] = (this.characterValues[i][type] || 0) - 1;
    }
    this.emitChange(type, source);
  }

  maxReceive(type: LootType | 'gold' | 'experience', index: number): number {
    const entry = this.entries().find((e) => e.type === type);
    if (!entry) return 0;
    const old = this.characterValues[index]?.[type] || 0;
    const maxPerEntry = old + this.remaining(entry);
    if (this.globalTotal() !== undefined && type !== 'gold' && type !== 'experience') {
      const maxFromGlobal = this.globalTotal()! - this.totalPaidNonGold() + old;
      return Math.min(maxPerEntry, Math.max(0, maxFromGlobal));
    }
    return maxPerEntry;
  }

  onInputChange(type: LootType | 'gold' | 'experience', index: number, event: any): void {
    const entry = this.entries().find((e) => e.type === type);
    if (!entry) return;
    let value = +event.target.value;
    if (isNaN(value)) return;

    const old = this.characterValues[index]?.[type] || 0;
    const maxAvailable = this.maxReceive(type, index);

    if (value < 0) value = 0;
    else if (value > maxAvailable) value = maxAvailable;

    event.target.value = value;
    if (value !== old) {
      this.characterValues[index][type] = value;
      this.distributionChange.emit({ type, source: index, value });
    }
  }

  private emitChange(type: LootType | 'gold' | 'experience', source: number | 'party'): void {
    const value = source === 'party' ? this.partyValues[type] || 0 : this.characterValues[source as number]?.[type] || 0;
    this.distributionChange.emit({ type, source, value });
  }
}
