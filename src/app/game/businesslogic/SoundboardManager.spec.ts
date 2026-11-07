import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { SoundboardManager } from 'src/app/game/businesslogic/SoundboardManager';

describe('SoundboardManager', () => {
  let manager: SoundboardManager;
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    manager = new SoundboardManager();
    playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    settingsManager.settings.soundboardSounds = [];
    vi.restoreAllMocks();
  });

  it('has unique sound ids', () => {
    const ids = manager.sounds.map((sound) => sound.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe('sound', () => {
    it('resolves a sound by index', () => {
      expect(manager.sound(0)).toBe(manager.sounds[0]);
    });

    it('resolves a sound by id', () => {
      expect(manager.sound('lumber')?.src).toBe('assets/media/lumber.ogg');
    });

    it('returns undefined for unknown index or id', () => {
      expect(manager.sound(-1)).toBeUndefined();
      expect(manager.sound(manager.sounds.length)).toBeUndefined();
      expect(manager.sound('unknown')).toBeUndefined();
    });
  });

  describe('play', () => {
    it('plays a sound by id', () => {
      const audio = manager.play('gold');
      expect(audio?.src).toContain('assets/media/gold.ogg');
      expect(playSpy).toHaveBeenCalledTimes(1);
    });

    it('plays a sound by index', () => {
      const audio = manager.play(manager.sounds.findIndex((sound) => sound.id === 'metal'));
      expect(audio?.src).toContain('assets/media/metal.ogg');
      expect(playSpy).toHaveBeenCalledTimes(1);
    });

    it('does not play and warns for unknown sounds', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(manager.play('unknown')).toBeUndefined();
      expect(manager.play(99)).toBeUndefined();
      expect(playSpy).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('swallows rejected playback (e.g. autoplay policy)', async () => {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      playSpy.mockImplementation(() => Promise.reject(new Error('NotAllowedError')));
      expect(() => manager.play('loot')).not.toThrow();
      await Promise.resolve();
      await Promise.resolve();
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('custom sounds', () => {
    it('appends custom sounds from settings after the default sounds', () => {
      settingsManager.settings.soundboardSounds = [{ id: 'horn', src: 'https://example.com/horn.ogg' }];
      expect(manager.sounds.length).toBe(manager.defaultSounds.length + 1);
      expect(manager.sound(manager.defaultSounds.length)?.id).toBe('horn');
      expect(manager.sound('horn')?.src).toBe('https://example.com/horn.ogg');
    });

    it('overwrites default sounds in place', () => {
      settingsManager.settings.soundboardSounds = [{ id: 'gold', src: 'https://example.com/gold.ogg' }];
      const index = manager.defaultSounds.findIndex((sound) => sound.id === 'gold');
      expect(manager.sounds.length).toBe(manager.defaultSounds.length);
      expect(manager.sound(index)?.src).toBe('https://example.com/gold.ogg');
      expect(manager.sound('gold')?.src).toBe('https://example.com/gold.ogg');
      expect(manager.defaultSounds[index].src).toBe('assets/media/gold.ogg');
    });

    it('skips invalid and duplicate custom sounds', () => {
      settingsManager.settings.soundboardSounds = [
        { id: '', src: 'https://example.com/empty.ogg' },
        { id: 'horn', src: 'https://example.com/horn.ogg' },
        { id: 'horn', src: 'https://example.com/horn2.ogg' }
      ];
      expect(manager.sounds.map((sound) => sound.id)).toEqual([...manager.defaultSounds.map((sound) => sound.id), 'horn']);
      expect(manager.sound('horn')?.src).toBe('https://example.com/horn.ogg');
    });

    it('disables sounds without src without shifting indices', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      settingsManager.settings.soundboardSounds = [
        { id: 'gold', src: null },
        { id: 'loot' },
        { id: 'lumber', src: '' },
        { id: 'horn', src: 'https://example.com/horn.ogg' }
      ];
      expect(manager.sounds.length).toBe(manager.defaultSounds.length + 1);
      expect(manager.play('loot')).toBeUndefined();
      expect(manager.play('lumber')).toBeUndefined();
      expect(manager.play('gold')).toBeUndefined();
      expect(manager.play({ id: 'preview', src: null })).toBeUndefined();
      expect(playSpy).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(manager.play(manager.defaultSounds.length)?.src).toBe('https://example.com/horn.ogg');
    });

    it('handles a missing custom sounds setting', () => {
      settingsManager.settings.soundboardSounds = undefined as any;
      expect(manager.sounds).toEqual(manager.defaultSounds);
    });

    it('plays an external sound url', () => {
      settingsManager.settings.soundboardSounds = [{ id: 'horn', src: 'https://example.com/horn.ogg' }];
      const audio = manager.play('horn');
      expect(audio?.src).toBe('https://example.com/horn.ogg');
      expect(playSpy).toHaveBeenCalledTimes(1);
    });

    it('plays a sound object directly', () => {
      const audio = manager.play({ id: 'preview', src: 'https://example.com/preview.ogg' });
      expect(audio?.src).toBe('https://example.com/preview.ogg');
      expect(playSpy).toHaveBeenCalledTimes(1);
    });
  });
});
