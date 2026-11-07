import { NgClass } from '@angular/common';
import { Component, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { soundboardManager } from 'src/app/game/businesslogic/SoundboardManager';
import { Sound } from 'src/app/game/model/data/Sound';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';

@Component({
  imports: [NgClass, RouterModule, GhsLabelDirective, TabClickDirective],
  selector: 'ghs-debug-menu',
  templateUrl: 'debug.html',
  styleUrls: ['../menu.scss', 'debug.scss']
})
export class SettingsDebugMenuComponent {
  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  soundboardManager = soundboardManager;

  readonly closed = output();

  setServerPing(event: any) {
    settingsManager.settings.serverPing = event.target.value;
    settingsManager.storeSettings();
  }

  clearFeedbackErrors() {
    settingsManager.settings.feedbackErrorsIgnore = [];
    settingsManager.storeSettings();
    this.closed.emit();
  }

  isDefault(id: string): boolean {
    return soundboardManager.defaultSounds.some((sound) => sound.id === id);
  }

  isCustom(id: string): boolean {
    return (settingsManager.settings.soundboardSounds || []).some((sound) => sound.id === id);
  }

  setCustomSound(sound: Sound) {
    const sounds = [...(settingsManager.settings.soundboardSounds || [])];
    const index = sounds.findIndex((value) => value.id === sound.id);
    if (index !== -1) {
      sounds[index] = sound;
    } else {
      sounds.push(sound);
    }
    settingsManager.set('soundboardSounds', sounds);
  }

  addSound(idInput: HTMLInputElement, srcInput: HTMLInputElement) {
    const id = idInput.value.trim();
    if (!id) {
      return;
    }
    this.setCustomSound({ id, src: srcInput.value.trim() || null });
    idInput.value = '';
    srcInput.value = '';
  }

  removeSound(id: string) {
    if (this.isDefault(id)) {
      this.setCustomSound({ id, src: null });
    } else {
      this.restoreSound(id);
    }
  }

  restoreSound(id: string) {
    settingsManager.set(
      'soundboardSounds',
      (settingsManager.settings.soundboardSounds || []).filter((sound) => sound.id !== id)
    );
  }
}
