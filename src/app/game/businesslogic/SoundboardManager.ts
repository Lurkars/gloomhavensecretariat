import { settingsManager } from 'src/app/game/businesslogic/Managers';
import { Sound } from 'src/app/game/model/data/Sound';

export type { Sound } from 'src/app/game/model/data/Sound';

export class SoundboardManager {
  get sounds(): Sound[] {
    const sounds: Sound[] = [];
    (settingsManager.settings.soundboardSounds || []).forEach((sound) => {
      if (sound && sound.id && !sounds.some((value) => value.id === sound.id)) {
        sounds.push(sound);
      }
    });
    return sounds;
  }

  sound(sound: number | string): Sound | undefined {
    const sounds = this.sounds;
    return typeof sound === 'number' ? sounds[sound] : sounds.find((value) => value.id === sound);
  }

  play(sound: number | string | Sound): HTMLAudioElement | undefined {
    const value = typeof sound === 'object' ? sound : this.sound(sound);
    if (!value || !value.src) {
      return undefined;
    }
    const audio = new Audio(value.src);
    const playing = audio.play();
    if (playing) {
      playing.catch((e) => console.debug('Could not play sound', value.id, e));
    }
    return audio;
  }

  duration(sound: HTMLAudioElement): Promise<number> {
    return new Promise((resolve) => {
      if (sound.readyState >= 1) {
        resolve(sound.duration || 0);
        return;
      }
      const timeout = setTimeout(() => resolve(0), 5000);
      sound.addEventListener(
        'loadedmetadata',
        () => {
          clearTimeout(timeout);
          resolve(sound.duration || 0);
        },
        { once: true }
      );
      sound.addEventListener(
        'error',
        () => {
          clearTimeout(timeout);
          resolve(0);
        },
        { once: true }
      );
    });
  }
}
