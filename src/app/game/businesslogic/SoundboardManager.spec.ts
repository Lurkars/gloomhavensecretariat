import { settingsManager } from 'src/app/game/businesslogic/Managers';
import { SoundboardManager } from 'src/app/game/businesslogic/SoundboardManager';

describe('SoundboardManager', () => {
  let manager: SoundboardManager;
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    manager = new SoundboardManager();
    playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    settingsManager.settings.soundboardSounds = [
      { id: 'gold', src: 'https://example.com/gold.ogg' },
      { id: 'horn', src: 'https://example.com/horn.ogg' }
    ];
  });

  it('has no sounds without custom sounds', () => {
    settingsManager.settings.soundboardSounds = [];
    expect(manager.sounds).toEqual([]);
    settingsManager.settings.soundboardSounds = undefined as any;
    expect(manager.sounds).toEqual([]);
  });

  describe('sound', () => {
    it('resolves a sound by index', () => {
      expect(manager.sound(1)?.id).toBe('horn');
    });

    it('resolves a sound by id', () => {
      expect(manager.sound('gold')?.src).toBe('https://example.com/gold.ogg');
    });

    it('returns undefined for unknown index or id', () => {
      expect(manager.sound(-1)).toBeUndefined();
      expect(manager.sound(manager.sounds.length)).toBeUndefined();
      expect(manager.sound('unknown')).toBeUndefined();
    });
  });

  describe('play', () => {
    it('plays a sound by id', () => {
      const audio = manager.play('horn');
      expect(audio?.src).toBe('https://example.com/horn.ogg');
      expect(playSpy).toHaveBeenCalledTimes(1);
    });

    it('plays a sound by index', () => {
      const audio = manager.play(0);
      expect(audio?.src).toBe('https://example.com/gold.ogg');
      expect(playSpy).toHaveBeenCalledTimes(1);
    });

    it('plays a sound object directly', () => {
      const audio = manager.play({ id: 'preview', src: 'https://example.com/preview.ogg' });
      expect(audio?.src).toBe('https://example.com/preview.ogg');
      expect(playSpy).toHaveBeenCalledTimes(1);
    });

    it('silently ignores unknown sounds', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(manager.play('waiting')).toBeUndefined();
      expect(manager.play(99)).toBeUndefined();
      expect(playSpy).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('swallows rejected playback (e.g. autoplay policy)', async () => {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      playSpy.mockImplementation(() => Promise.reject(new Error('NotAllowedError')));
      expect(() => manager.play('gold')).not.toThrow();
      await Promise.resolve();
      await Promise.resolve();
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('custom sounds', () => {
    it('skips invalid and duplicate sounds', () => {
      settingsManager.settings.soundboardSounds = [
        { id: '', src: 'https://example.com/empty.ogg' },
        { id: 'horn', src: 'https://example.com/horn.ogg' },
        { id: 'horn', src: 'https://example.com/horn2.ogg' }
      ];
      expect(manager.sounds.map((sound) => sound.id)).toEqual(['horn']);
      expect(manager.sound('horn')?.src).toBe('https://example.com/horn.ogg');
    });

    it('keeps sounds without src in place but does not play them', () => {
      settingsManager.settings.soundboardSounds = [
        { id: 'gold', src: null },
        { id: 'loot' },
        { id: 'horn', src: 'https://example.com/horn.ogg' }
      ];
      expect(manager.sounds.length).toBe(3);
      expect(manager.play('gold')).toBeUndefined();
      expect(manager.play('loot')).toBeUndefined();
      expect(manager.play({ id: 'preview', src: null })).toBeUndefined();
      expect(playSpy).not.toHaveBeenCalled();
      expect(manager.play(2)?.src).toBe('https://example.com/horn.ogg');
    });
  });
});
