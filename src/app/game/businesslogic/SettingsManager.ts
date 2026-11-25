import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import localeKo from '@angular/common/locales/ko';
import { Capacitor } from '@capacitor/core';
import { DebugManager } from 'src/app/game/businesslogic/DebugManager';
import { debugManager, gameManager, labelManager, settingsManager, storageManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Spoilable } from 'src/app/game/model/data/Spoilable';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Settings } from 'src/app/game/model/Settings';

declare global {
  interface Window {
    settingsManager: SettingsManager;
  }
}

export class SettingsManager {
  EntityValueFunction = EntityValueFunction;
  defaultLocale: string = 'en';
  defaultEditions: string[] = ['gh', 'fh', 'jotl', 'fc', 'cs', 'toa', 'bb', 'gh2e', 'mp', 'rpg'];

  settings: Settings = new Settings();
  locales: string[] = ['en', 'de', 'fr', 'ko', 'es', 'it', 'zh_Hans', 'zh_Hant', 'ru', 'pt', 'pl', 'th'];
  development: boolean = false;
  debugManager: DebugManager = debugManager;

  async init(development: boolean) {
    // storage must be ready to read the stored settings, editors and tools are entry points as well (e.g. on reload)
    try {
      await storageManager.init();
    } catch {
      // fallback to local storage
    }
    await this.loadSettings();
    this.development = development;
    for (const defaultEditionDataUrl of gameManager.editionManager.defaultEditionDataUrls) {
      if (
        !settingsManager.settings.editionDataUrls.includes(defaultEditionDataUrl) &&
        !settingsManager.settings.excludeEditionDataUrls.includes(defaultEditionDataUrl)
      ) {
        settingsManager.settings.editionDataUrls.push(defaultEditionDataUrl);
      }
    }

    await Promise.all(
      settingsManager.settings.editionDataUrls.map((editionDataUrl) => gameManager.editionManager.loadEditionData(editionDataUrl))
    );
    // retry once, e.g. on a flaky connection
    await Promise.all(
      [...gameManager.editionManager.failedEditionDataUrls].map((editionDataUrl) =>
        gameManager.editionManager.loadEditionData(editionDataUrl)
      )
    );

    await this.applyInitial();
    // apply loaded settings (theme, style, ...) to the UI
    gameManager.triggerUiChange();
  }

  async loadSettings() {
    let loadDefault = false;
    try {
      const settings = await storageManager.read<Settings>('settings', 'default');
      if (settings) {
        this.setSettings(Object.assign(new Settings(), settings));
      } else {
        loadDefault = true;
      }
    } catch {
      loadDefault = true;
    }

    if (loadDefault) {
      try {
        await fetch('./ghs-settings-default.json')
          .then((response) => {
            if (!response.ok) {
              throw Error();
            }
            return response.json();
          })
          .then((value: Settings) => {
            this.setSettings(Object.assign(new Settings(), value));
          });
      } catch {
        this.setSettings(new Settings());
      }
    }

    this.updateLocale(this.settings.locale);

    await this.applyInitial();
  }

  async applyInitial() {
    await this.apply('animationSpeed', this.settings.animationSpeed);
    await this.apply('barsize', this.settings.barsize);
    await this.apply('fontsize', this.settings.fontsize);
    await this.apply('globalFontsize', this.settings.globalFontsize);
    await this.apply('portraitMode', this.settings.portraitMode);
    await this.apply('zoom', this.settings.zoom);
    await this.apply('customCss', this.settings.customCss);
    await this.apply('maxLog', this.settings.maxLog);
  }

  setSettings(settings: Settings) {
    if (settings.locale !== this.settings.locale) {
      this.updateLocale(settings.locale);
    }
    this.settings = settings;
    if (!this.settings.editions || this.settings.editions.length === 0) {
      this.settings.editions.push(...this.defaultEditions);
    }

    if (!this.settings.editionDataUrls || this.settings.editionDataUrls.length === 0) {
      for (const defaultEditionDataUrl of gameManager.editionManager.defaultEditionDataUrls) {
        if (
          !this.settings.editionDataUrls.includes(defaultEditionDataUrl) &&
          !this.settings.excludeEditionDataUrls.includes(defaultEditionDataUrl)
        ) {
          this.settings.editionDataUrls.push(defaultEditionDataUrl);
        }
      }
    }

    if (!settings.theme) {
      if (settings.fhStyle) {
        settings.theme = 'fh';
      } else {
        settings.theme = 'default';
      }
    }

    // migration
    if (settings.disableAnimations) {
      settings.animations = false;
      settings.disableAnimations = false;
    }
    if (settings.disableArtwork) {
      settings.artwork = false;
      settings.disableArtwork = false;
    }
    if (settings.disableColumns) {
      settings.columns = false;
      settings.disableColumns = false;
    }
    if (settings.disableDragFigures) {
      settings.dragFigures = false;
      settings.disableDragFigures = false;
    }
    if (settings.disablePinchZoom) {
      settings.pinchZoom = false;
      settings.disablePinchZoom = false;
    }
    if (settings.disabledTurnConfirmation) {
      settings.turnConfirmation = false;
      settings.disabledTurnConfirmation = false;
    }
    if (settings.disableSortFigures) {
      settings.sortFigures = false;
      settings.disableSortFigures = false;
    }
    if (settings.disableStandees) {
      settings.standees = false;
      settings.disableStandees = false;
    }
    if (settings.disableWakeLock) {
      settings.wakeLock = false;
      settings.disableWakeLock = false;
    }

    if (settings.serverPassword) {
      settings.serverCode = settings.serverPassword;
      settings.serverPassword = undefined;
    }

    if (!settings.combineSummonAction) {
      settings.combineInteractiveAbilities = false;
      settings.combineSummonAction = true;
    }

    if (!settings.treasuresLootItem) {
      settings.drawRandomItem = false;
    }

    if (!settings.treasuresLootScenario) {
      settings.drawRandomScenario = false;
    }

    this.sortSpoilers();
  }

  storeSettings(): void {
    storageManager.write('settings', 'default', this.settings);
    if (this.settings.serverSettings) {
      gameManager.stateManager.saveSettings();
    }
    gameManager.triggerUiChange(false);
  }

  reset() {
    storageManager.remove('settings');
    this.loadSettings();
  }

  async set(setting: string, value: any, apply: boolean = true) {
    this.settings[setting] = value;
    if (apply) {
      await this.apply(setting, value);
    }
    this.storeSettings();
  }

  async toggle(setting: string) {
    await this.set(setting, !this.settings[setting]);
  }

  async apply(setting: string, value: any) {
    if (setting === 'fullscreen') {
      if (value) {
        if (Capacitor.isNativePlatform()) {
          const { AndroidFullscreen } = await import('src/app/ui/helper/android-fullscreen');
          AndroidFullscreen.enable();
        } else {
          if (!!document.body.requestFullscreen) {
            document.body.requestFullscreen();
          }
          if ((navigator as any).keyboard?.lock) {
            (navigator as any).keyboard.lock(['Escape']).catch(() => {});
          }
        }
      } else {
        if (Capacitor.isNativePlatform()) {
          const { AndroidFullscreen } = await import('src/app/ui/helper/android-fullscreen');
          AndroidFullscreen.disable();
        } else {
          if ((navigator as any).keyboard?.unlock) {
            (navigator as any).keyboard.unlock();
          }
          if (!!document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      }
    } else if (setting === 'locale') {
      await this.updateLocale(value as string);
    } else if (setting === 'animationSpeed') {
      document.body.style.setProperty('--ghs-animation-speed', value + '');
    } else if (setting === 'fontsize') {
      document.body.style.setProperty('--ghs-fontsize', value + '');
    } else if (setting === 'barsize') {
      document.body.style.setProperty('--ghs-barsize', value + '');
    } else if (setting === 'globalFontsize') {
      document.body.style.setProperty('--ghs-global-fontsize', value + '');
    } else if (setting === 'portraitMode') {
      if (value) {
        document.body.classList.add('portrait-mode');
      } else {
        document.body.classList.remove('portrait-mode');
      }
    } else if (setting === 'theme' && this.settings.automaticTheme) {
      if (value === 'fh' || value === 'bb') {
        this.settings.fhStyle = true;
      } else {
        this.settings.fhStyle = false;
      }
    } else if (setting === 'bbAm') {
      gameManager.game.monsterAttackModifierDeck.bb = value || false;
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          figure.attackModifierDeck.bb = value || false;
        }
      });
    } else if (setting === 'temporaryEnhancements') {
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          gameManager.enhancementsManager.previousEnhancements(figure, value);
        }
      });
    } else if (setting === 'customCss') {
      let styleEl = document.getElementById('ghs-custom-css') as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'ghs-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = value || '';
    } else if (setting === 'zoom') {
      this.applyZoom(value as number);
    } else if (setting === 'maxLog' || setting === 'maxUndo') {
      // -1: unlimited log, otherwise the log must not be shorter than the undo history, which is labeled by it
      if (this.settings.maxLog < 0) {
        this.settings.maxLog = -1;
      } else if (this.settings.maxLog < this.settings.maxUndo) {
        this.settings.maxLog = this.settings.maxUndo;
      }
    }
  }

  get(setting: string): any {
    return this.settings[setting];
  }

  setAutoBackupFinish(autoBackupFinish: boolean) {
    this.settings.autoBackupFinish = autoBackupFinish;
    if (this.settings.autoBackupFinish && this.settings.autoBackup < 0) {
      this.settings.autoBackup = 0;
    } else if (!this.settings.autoBackupFinish && this.settings.autoBackup === 0) {
      this.settings.autoBackup = -1;
    }
    this.storeSettings();
  }

  setAutoBackupUrl(
    autoBackupUrl:
      { url: string; method: string; fileUpload: boolean; username: string; password: string; authorization: string } | undefined
  ) {
    this.settings.autoBackupUrl = autoBackupUrl;
    if (this.settings.autoBackupUrl && !this.settings.autoBackupUrl.method) {
      this.settings.autoBackupUrl.method = 'POST';
    }
    this.storeSettings();
  }

  async setDisableWakeLock(disableWakeLock: boolean) {
    this.settings.disableWakeLock = disableWakeLock;
    if (disableWakeLock && gameManager.stateManager.wakeLock) {
      gameManager.stateManager.wakeLock.release().then(() => {
        gameManager.stateManager.wakeLock = null;
      });
    } else if (!disableWakeLock && !gameManager.stateManager.wakeLock && 'wakeLock' in navigator) {
      gameManager.stateManager.wakeLock = await navigator.wakeLock.request('screen');
    }
    this.storeSettings();
  }

  async setWakeLock(wakeLock: boolean) {
    this.settings.wakeLock = wakeLock;
    if (!wakeLock && gameManager.stateManager.wakeLock) {
      gameManager.stateManager.wakeLock.release().then(() => {
        gameManager.stateManager.wakeLock = null;
      });
    } else if (wakeLock && !gameManager.stateManager.wakeLock && 'wakeLock' in navigator) {
      gameManager.stateManager.wakeLock = await navigator.wakeLock.request('screen');
    }
    this.storeSettings();
  }

  setServer(url: string, port: number, code: string): void {
    this.settings.serverUrl = url;
    this.settings.serverPort = port;
    this.settings.serverCode = code;
    this.storeSettings();
  }

  setServerSettings(settings: boolean) {
    this.settings.serverSettings = settings;
    if (settings) {
      gameManager.serverSyncManager.requestSettings();
    } else {
      this.storeSettings();
    }
  }

  setZoom(zoom: number) {
    this.settings.zoom = this.applyZoom(zoom);
    this.storeSettings();
  }

  applyZoom(zoom: number, delta: number = 0): number {
    document.body.style.setProperty('--ghs-factor', zoom + '');
    if (delta < 0) {
      const maxWidth = +window.getComputedStyle(document.body).getPropertyValue('min-width').replace('px', '');
      if (maxWidth >= window.innerWidth) {
        zoom -= delta;
        document.body.style.setProperty('--ghs-factor', zoom + '');
      }
    }
    return zoom;
  }

  addSpoiler(spoiler: string) {
    if (!this.settings.spoilers.includes(spoiler)) {
      this.settings.spoilers.push(spoiler);
      this.sortSpoilers();
      this.storeSettings();
    }
  }

  addSpoilers(spoilables: Spoilable[]) {
    for (const spoilable of spoilables) {
      if (!this.settings.spoilers.includes(spoilable.name)) {
        this.settings.spoilers.push(spoilable.name);
      }
    }
    this.storeSettings();
  }

  removeSpoiler(spoiler: string) {
    if (this.settings.spoilers.includes(spoiler)) {
      this.settings.spoilers.splice(this.settings.spoilers.indexOf(spoiler), 1);
      this.storeSettings();
    }
  }

  removeAllSpoilers() {
    this.settings.spoilers = [];
    this.storeSettings();
  }

  addEdition(edition: string) {
    if (!this.settings.editions.includes(edition)) {
      this.settings.editions.push(edition);
      this.storeSettings();
    }
  }

  removeEdition(edition: string) {
    this.settings.editions.splice(this.settings.editions.indexOf(edition), 1);
    this.storeSettings();
  }

  sortSpoilers() {
    this.settings.spoilers.sort((a: string, b: string) => {
      if (a.toLowerCase() > b.toLowerCase()) {
        return 1;
      }

      if (a.toLowerCase() < b.toLowerCase()) {
        return -1;
      }
      return 0;
    });
  }

  async updateLocale(locale: string) {
    labelManager.label = {};

    await fetch('./assets/locales/' + locale + '.json')
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        labelManager.label = labelManager.merge(labelManager.label, true, data);
      })
      .catch((error: Error) => {
        console.error('Invalid locale: ' + locale, error);
        return;
      });

    // default label
    if (locale !== this.defaultLocale) {
      await fetch('./assets/locales/' + this.defaultLocale + '.json')
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          labelManager.label = labelManager.merge(labelManager.label, false, data);
        })
        .catch((error: Error) => {
          console.error('Invalid locale: ' + locale, error);
          return;
        });
    }

    labelManager.label.data = {};
    for (const editionData of gameManager.editionManager.editionData) {
      labelManager.loadDataLabel(editionData);
    }

    switch (locale) {
      case 'de': {
        registerLocaleData(localeDe);
        break;
      }
      case 'fr': {
        registerLocaleData(localeFr);
        break;
      }
      case 'ko': {
        registerLocaleData(localeKo);
        break;
      }
    }

    gameManager.triggerUiChange(false);
  }

  automaticTheme(edition: string, previousEdition: string | undefined) {
    if (this.settings.automaticTheme && edition !== previousEdition) {
      if (this.settings.theme !== 'modern') {
        if (edition === 'fh' || edition === 'bb') {
          this.set('theme', edition);
        } else {
          this.set('theme', 'default');
        }
      }
      const fhStyleEditions = ['fh', 'gh2e', 'rpg'];
      if (fhStyleEditions.includes(edition)) {
        this.set('fhStyle', true);
      } else if (previousEdition && fhStyleEditions.includes(previousEdition)) {
        this.set('fhStyle', false);
      }
    }
  }
}
