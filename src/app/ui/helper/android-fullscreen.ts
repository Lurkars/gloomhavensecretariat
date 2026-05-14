import { registerPlugin } from '@capacitor/core';

interface AndroidFullscreenPlugin {
  enable(): Promise<void>;
  disable(): Promise<void>;
}

export const AndroidFullscreen = registerPlugin<AndroidFullscreenPlugin>('AndroidFullscreen', {
  web: {
    enable: async () => {},
    disable: async () => {}
  }
});
