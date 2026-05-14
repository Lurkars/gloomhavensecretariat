import type { CapacitorConfig } from '@capacitor/cli';
import { existsSync } from 'fs';

let localConfig: Partial<CapacitorConfig> = {};
if (existsSync('./capacitor.config.local.json')) {
  localConfig = require('./capacitor.config.local.json');
}

const config: CapacitorConfig = {
  appId: 'de.champonthis.ghs',
  appName: 'Gloomhaven Secretariat',
  webDir: 'dist/gloomhavensecretariat',
  ...localConfig
};

export default config;
