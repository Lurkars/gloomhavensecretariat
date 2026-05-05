import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { ItemSlot } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { HeaderComponent } from 'src/app/ui/header/header';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { environment } from 'src/environments/environment';

@Component({
  imports: [FormsModule, HeaderComponent, GhsLabelDirective],
  selector: 'ghs-label-tool',
  templateUrl: './label-tool.html',
  styleUrls: ['./label-tool.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelToolComponent implements OnInit {
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  labels: { key: string; raw: string; args: string[] }[] = [];
  filter: string = '';
  locale: string = 'en';
  translationFilter: 'all' | 'same' | 'untranslated' = 'all';
  private enLabel: any = {};
  private localeOnlyLabel: any = {};
  private enEditionLabel: any = {};
  private localeEditionLabel: any = {};

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    gameManager.stateManager.init(true);
    this.locale = settingsManager.settings.locale || 'en';
    this.enLabel = await this.loadLocaleJson('en');
    this.localeOnlyLabel = this.locale !== 'en' ? await this.loadLocaleJson(this.locale) : {};
    this.enEditionLabel = this.buildEditionLabel('en');
    this.localeEditionLabel = this.locale !== 'en' ? this.buildEditionLabel(this.locale) : {};
    this.update();
  }

  async changeLocale(locale: string) {
    this.locale = locale;
    settingsManager.settings.locale = locale;
    await settingsManager.updateLocale(locale);
    gameManager.stateManager.init(true);
    this.localeOnlyLabel = locale !== 'en' ? await this.loadLocaleJson(locale) : {};
    this.enEditionLabel = this.buildEditionLabel('en');
    this.localeEditionLabel = locale !== 'en' ? this.buildEditionLabel(locale) : {};
    this.translationFilter = 'all';
    this.update();
  }

  private loadLocaleJson(locale: string): Promise<any> {
    return fetch('./assets/locales/' + locale + '.json')
      .then((r) => r.json())
      .catch(() => ({}));
  }

  private buildEditionLabel(locale: string): any {
    let result: any = {};
    for (const ed of gameManager.editionData) {
      if (ed.label && (ed.label as any)[locale]) {
        result = this.deepMerge(result, (ed.label as any)[locale]);
      }
    }
    return result;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  update() {
    const allKeys = this.flattenLabelKeys(settingsManager.label, '');
    this.labels = allKeys
      .filter((key) => !this.filter || key.toLowerCase().includes(this.filter.toLowerCase()))
      .filter((key) => {
        if (this.translationFilter === 'all' || this.locale === 'en') return true;
        const currentRaw = this.getRawLabel(settingsManager.label, key) || '';
        const enRaw = this.getRawLabel(this.enLabel, key) || '';
        if (this.translationFilter === 'same') {
          return enRaw !== '' && currentRaw === enRaw;
        }
        // untranslated: check locale JSON keys and edition data keys separately
        if (key.startsWith('data.')) {
          const dataKey = key.slice(5);
          const enEditionRaw = this.getRawLabel(this.enEditionLabel, dataKey);
          const localeEditionRaw = this.getRawLabel(this.localeEditionLabel, dataKey);
          return enEditionRaw !== null && enEditionRaw !== '' && (localeEditionRaw === null || localeEditionRaw === '');
        }
        const localeRaw = this.getRawLabel(this.localeOnlyLabel, key);
        return enRaw !== '' && (localeRaw === null || localeRaw === '');
      })
      .map((key) => {
        const raw = this.getRawLabel(settingsManager.label, key) || '';
        return { key, raw, args: this.defaultArgs(raw) };
      });
  }

  private flattenLabelKeys(obj: any, prefix: string): string[] {
    if (!obj || typeof obj !== 'object') {
      return [];
    }
    const keys: string[] = [];
    for (const k of Object.keys(obj)) {
      const fullKey = prefix ? prefix + '.' + k : k;
      const value = obj[k];
      if (typeof value === 'string') {
        keys.push(fullKey);
      } else if (typeof value === 'object') {
        if (value['']) {
          keys.push(fullKey);
        }
        keys.push(...this.flattenLabelKeys(value, fullKey));
      }
    }
    return keys;
  }

  private defaultArgs(raw: string): string[] {
    if (!raw) {
      return [];
    }
    let max = -1;
    const matches = raw.matchAll(/\{(\d+)\}/g);
    for (const match of matches) {
      const index = parseInt(match[1], 10);
      if (index > max) {
        max = index;
      }
    }
    if (max < 0) {
      return [];
    }
    const args = Array.from({ length: max + 1 }, (_, i) => this.inferArg(raw, i));
    // Post-process: for %data.characterToken.{X}.{Y}% patterns, ensure {Y} is a token of {X}'s character
    const tokenPairRegex = /%[^%]*data\.characterToken\.\{(\d+)\}\.\{(\d+)\}[^%]*%/g;
    let m: RegExpExecArray | null;
    while ((m = tokenPairRegex.exec(raw)) !== null) {
      const charIdx = parseInt(m[1], 10);
      const tokenIdx = parseInt(m[2], 10);
      const charData = gameManager.charactersData().find((c) => c.name === args[charIdx]);
      if (charData && charData.tokens && charData.tokens.length > 0) {
        args[tokenIdx] = this.rand(charData.tokens);
      }
    }
    return args;
  }

  private inferArg(raw: string, index: number): string {
    // Check each occurrence of {N} in a %...% placeholder
    const placeholderRegex = new RegExp(`%([^%]*)\\{${index}\\}([^%]*)%`, 'g');
    let m: RegExpExecArray | null;
    while ((m = placeholderRegex.exec(raw)) !== null) {
      const before = m[1]; // text before {N} inside placeholder
      const p = before.replace(/\.+$/, '');

      // {N} is in value position (after colon) — infer type from the key before the colon
      if (p.includes(':')) {
        const key = p.split(':')[0].replace(/\.+$/, '');
        if (/(game|data)\.gh2eFaction$/.test(key)) return this.rand(['demons', 'merchant-guild', 'military']);
        if (/game\.itemSlot$/.test(key)) return this.rand(Object.values(ItemSlot));
        if (/game\.trait$/.test(key)) return this.sampleTrait();
        return '' + (Math.floor(Math.random() * 5) + 1); // default numeric value
      }

      if (/game\.(condition|immunity)(\.heal)?$/.test(p))
        return this.rand(Object.values(ConditionName).filter((c) => c !== ConditionName.invalid));
      if (/data\.characterToken$/.test(p) || /game\.characterToken$/.test(p)) return this.sampleTokenCharacter();
      if (/data\.characterToken\./.test(p) || /game\.characterToken\./.test(p)) return this.sampleToken();
      if (/data\.character(Icon(Colored(Bg)?)?)?$/.test(p)) return this.sampleCharacter();
      if (/game\.character(Icon(Colored(Bg)?|IdentityColored?)?|Colored)?$/.test(p)) return this.sampleCharacter();
      if (/game\.amDeck$/.test(p)) return this.sampleCharacter();
      if (/game\.townGuardAm$/.test(p)) return this.rand(['plus', 'minus', 'null', 'bless', 'curse', 'double']);
      if (/game\.attackmodifier$/.test(p))
        return this.rand(['plus', 'minus', 'null', 'bless', 'curse', 'double', 'plus2', 'minus1', 'minus2']);
      if (/data\.edition$/.test(p)) return this.sampleEdition();
      if (/data\.monster$/.test(p)) return this.sampleMonster();
      if (/game\.monsterType$/.test(p)) return this.rand(Object.values(MonsterType));
      if (/game\.(loot|resource)$/.test(p) || /game\.resource$/.test(p.replace(/\d+$/, '')))
        return this.rand(Object.values(LootType).filter((t) => !t.startsWith('special')));
      if (/game\.(mapMarker|objectiveMarker)$/.test(p)) return this.rand(['A', 'B', 'C', 'D', 'E']);
      if (/game\.(number|numbered)$/.test(p) || /^(number|numbered)$/.test(p)) return '' + (Math.floor(Math.random() * 9) + 1);
      if (/data\.items$/.test(p)) return '' + (Math.floor(Math.random() * 50) + 1);
      if (/data\.(scenario|section|scenarioNumber)$/.test(p)) return '' + (Math.floor(Math.random() * 20) + 1);
      if (/data\.buildings$/.test(p)) return '' + (Math.floor(Math.random() * 10) + 1);
      if (/data\.treasures$/.test(p)) return '' + (Math.floor(Math.random() * 20) + 1);
      if (/game\.damage$/.test(p)) return '' + (Math.floor(Math.random() * 5) + 1);
      if (/game\.itemFh$/.test(p)) return 'random';
      if (/game\.(events\.option|events\.type|events\.effects\..*)$/.test(p)) return this.rand(['A', 'B', 'C']);
      if (/data\.(campaignSticker|partyAchievements|globalAchievements)$/.test(p)) return this.rand(['A', 'B', 'C']);
      if (/data\.summon$/.test(p)) return this.sampleSummon();
      if (/game\.gh2eFaction$/.test(p)) return this.rand(['demons', 'merchant-guild', 'military']);
      if (/data\.gh2eFaction$/.test(p)) return this.rand(['demons', 'merchant-guild', 'military']);
      if (/game\.trait$/.test(p)) return this.sampleTrait();
    }
    // No %placeholder% matched — infer from raw string context around {N}
    const rawIdx = raw.indexOf(`{${index}}`);
    if (rawIdx >= 0) {
      const ctx = raw.slice(Math.max(0, rawIdx - 100), rawIdx);
      if (/i18n\.[^'"]*\/-\/$/i.test(ctx)) return this.rand(settingsManager.locales);
      if (/attackmodifier\/icons\/$/i.test(ctx)) return this.rand(['plus', 'minus', 'null', 'bless', 'curse']);
      if (/\/condition\/$/.test(ctx)) return this.rand(Object.values(ConditionName).filter((c) => c !== ConditionName.invalid));
      if (/\/loot\/$/.test(ctx)) return this.rand(Object.values(LootType).filter((t) => !t.startsWith('special')));
    }
    return 'X';
  }

  private rand<T>(arr: T[]): string {
    return '' + arr[Math.floor(Math.random() * arr.length)];
  }

  private sampleCharacter(): string {
    return this.rand(gameManager.charactersData().map((c) => c.name)) || 'brute';
  }

  private sampleEdition(): string {
    return this.rand(gameManager.editions()) || 'gh';
  }

  private sampleMonster(): string {
    return this.rand(gameManager.monstersData().map((m) => m.name)) || 'bandit-guard';
  }

  private sampleSummon(): string {
    const summons = gameManager
      .charactersData()
      .flatMap((c) => c.availableSummons)
      .map((s) => s.name)
      .filter((n) => !!n);
    return this.rand(summons) || 'summon';
  }

  private sampleTrait(): string {
    const traits = gameManager
      .charactersData()
      .flatMap((c) => c.traits)
      .filter((t) => !!t);
    return this.rand(traits) || 'trait';
  }

  private sampleTokenCharacter(): string {
    const withTokens = gameManager
      .charactersData()
      .filter((c) => c.tokens && c.tokens.length > 0)
      .map((c) => c.name);
    return this.rand(withTokens.length ? withTokens : gameManager.charactersData().map((c) => c.name)) || 'brute';
  }

  private sampleToken(): string {
    const tokens = gameManager
      .charactersData()
      .flatMap((c) => c.tokens || [])
      .filter((t) => !!t);
    return this.rand(tokens.length ? tokens : ['shadow']) || 'shadow';
  }

  private getRawLabel(obj: any, key: string): string | null {
    if (!obj || typeof obj !== 'object') {
      return null;
    }
    if (typeof obj[key] === 'string') {
      return obj[key];
    }
    if (typeof obj[key] === 'object' && obj[key]['']) {
      return obj[key][''];
    }
    const keys = key.split('.');
    if (keys.length > 1 && obj[keys[0]]) {
      return this.getRawLabel(obj[keys[0]], keys.slice(1).join('.'));
    }
    return null;
  }
}
