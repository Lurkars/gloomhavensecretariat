import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Sound } from 'src/app/game/model/data/Sound';

export type { Sound } from 'src/app/game/model/data/Sound';

export class SoundboardManager {
  readonly defaultSounds: Sound[] = [
    { id: '2h', src: 'assets/media/2h.ogg' },
    { id: 'gold', src: 'assets/media/gold.ogg' },
    { id: 'loot', src: 'assets/media/loot.ogg' },
    { id: 'lumber', src: 'assets/media/lumber.ogg' },
    { id: 'metal', src: 'assets/media/metal.ogg' },
    { id: 'null', src: 'assets/media/null.ogg' },
    { id: 'waiting', src: 'assets/media/waiting.ogg' }
  ];

  get sounds(): Sound[] {
    const sounds: Sound[] = [...this.defaultSounds];
    const customIds: string[] = [];
    (settingsManager.settings.soundboardSounds || []).forEach((sound) => {
      if (!sound || !sound.id || customIds.includes(sound.id)) {
        return;
      }
      customIds.push(sound.id);
      const index = sounds.findIndex((value) => value.id === sound.id);
      if (index !== -1) {
        sounds[index] = sound;
      } else {
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
    if (!value) {
      console.warn('Unknown sound', sound);
      return undefined;
    }
    if (!value.src) {
      return undefined;
    }
    const audio = new Audio(value.src);
    const playing = audio.play();
    if (playing) {
      playing.catch((e) => console.debug('Could not play sound', value.id, e));
    }
    return audio;
  }
}

export const soundboardManager: SoundboardManager = new SoundboardManager();
