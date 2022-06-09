export class Settings {
  calculate: boolean = false;
  fullscreen: boolean = false;
  zoom: number = 100;
  columns: number = 1;
  locale: string = "en";
  editionDataUrls: string[] = [ "./assets/data/gh.json", "./assets/data/jotl.json" ];
  spoilers: string[] = [];
}