import { storageManager } from 'src/app/game/businesslogic/Managers';

// StorageManager wraps IndexedDB with a localStorage fallback. This spec covers the localStorage
// datadump (forced via migrate=true, which always reads localStorage).

describe('StorageManager', () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe('datadump', () => {
    it('keeps values which are no JSON instead of failing the whole dump', async () => {
      localStorage.setItem('ghs-game', JSON.stringify({ revision: 3 }));
      localStorage.setItem('other-key', 'plain text');

      const datadump = await storageManager.datadump(true);

      expect(datadump['ghs-game']).toEqual({ revision: 3 });
      expect(datadump['other-key']).toEqual('plain text');
    });
  });
});
