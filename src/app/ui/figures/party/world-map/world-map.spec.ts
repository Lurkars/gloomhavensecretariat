import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { CampaignData, EditionData } from 'src/app/game/model/data/EditionData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';
import { WorldMapComponent } from 'src/app/ui/figures/party/world-map/world-map';

// WorldMapComponent's update() is a pure data-gathering step (resolve worldMap/mapEdition, collect
// scenarios/conclusions/buildings with coordinates) that runs independently of the leaflet map
// itself (that's initMap(), which dynamic-imports leaflet and renders into a #map element that
// doesn't exist here — deliberately out of scope). Following the AppComponent.spec.ts pattern:
// create via TestBed, never call fixture.detectChanges() (ngAfterViewInit's updateMap() never
// runs), and call update() directly.

function scenario(index: string, overrides: Partial<ScenarioData> = {}): ScenarioData {
  return Object.assign(new ScenarioData(), { edition: 'gh', index }, overrides);
}

function createComponent(edition: string = 'gh', pick: boolean = false): WorldMapComponent {
  TestBed.configureTestingModule({
    imports: [WorldMapComponent],
    providers: [
      { provide: DIALOG_DATA, useValue: { edition, pick } },
      { provide: DialogRef, useValue: { closed: { subscribe: () => {} } } },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(WorldMapComponent);
  return fixture.componentInstance;
}

describe('WorldMapComponent', () => {
  beforeEach(() => {
    settingsManager.settings.editions = ['gh', 'jotl'];
    gameManager.game.party.campaignMode = true;
    gameManager.game.party.scenarios = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.buildings = [];
    gameManager.editionData = [];
  });

  it('constructs and captures the requested edition from DIALOG_DATA', () => {
    const component = createComponent('gh');
    expect(component.edition).toEqual('gh');
    expect(component.mapEdition).toEqual('gh');
  });

  describe('update', () => {
    it('leaves worldMap unset when the edition has no world map data', () => {
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []))];
      const component = createComponent('gh');
      component.update();
      expect(component.worldMap).toBeUndefined();
    });

    it('populates worldMap and coordinate-bearing scenarios for a matching edition', () => {
      gameManager.editionData = [
        Object.assign(
          new EditionData('gh', [], [], [], [scenario('1', { coordinates: new WorldMapCoordinates() }), scenario('2')], [], []),
          {
            worldMap: { width: 100, height: 100 }
          }
        )
      ];
      const component = createComponent('gh');
      component.update();
      expect(component.worldMap).toEqual({ width: 100, height: 100 });
      expect(component.scenarios.map((s) => s.index)).toEqual(['1']);
    });

    it('falls back to the extended edition when the current edition has no world map of its own', () => {
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), { extendWorldMap: 'jotl' }),
        Object.assign(
          new EditionData('jotl', [], [], [], [scenario('1', { edition: 'jotl', coordinates: new WorldMapCoordinates() })], [], []),
          {
            worldMap: { width: 50, height: 50 }
          }
        )
      ];
      const component = createComponent('gh');
      component.update();
      expect(component.mapEdition).toEqual('jotl');
      expect(component.worldMap).toEqual({ width: 50, height: 50 });
    });

    it('only includes extended-edition scenarios once showExtended is set', () => {
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), { extendWorldMap: 'jotl' }),
        Object.assign(
          new EditionData('jotl', [], [], [], [scenario('1', { edition: 'jotl', coordinates: new WorldMapCoordinates() })], [], []),
          {
            worldMap: { width: 50, height: 50 }
          }
        )
      ];
      const component = createComponent('gh');
      component.update();
      expect(component.scenarios.length).toEqual(0);

      component.showExtended = true;
      component.update();
      expect(component.scenarios.map((s) => s.index)).toEqual(['1']);
    });

    it('collects coordinate-bearing buildings from the edition campaign data', () => {
      const building = Object.assign(new BuildingData(), { name: 'sanctuary', edition: 'gh', coordinates: [new WorldMapCoordinates()] });
      const buildingNoCoords = Object.assign(new BuildingData(), { name: 'shrine', edition: 'gh', coordinates: [] });
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), {
          worldMap: { width: 100, height: 100 },
          campaign: Object.assign(new CampaignData(), { buildings: [building, buildingNoCoords] })
        })
      ];
      const component = createComponent('gh');
      component.update();
      expect(component.buildings.map((b) => b.name)).toEqual(['sanctuary']);
    });

    it('collects conclusion sections that carry an overlay reward', () => {
      const conclusionSection = Object.assign(new ScenarioData(), {
        edition: 'gh',
        index: 'c1',
        conclusion: true,
        rewards: { overlaySticker: { name: 'x', coordinates: new WorldMapCoordinates() } }
      });
      const nonOverlaySection = Object.assign(new ScenarioData(), { edition: 'gh', index: 'c2', conclusion: true });
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [conclusionSection, nonOverlaySection], []), {
          worldMap: { width: 100, height: 100 }
        })
      ];
      const component = createComponent('gh');
      component.update();
      expect(component.conclusions.map((c) => c.index)).toEqual(['c1']);
    });
  });

  describe('editStartDrag / editStopDrag / editMoveDrag', () => {
    it('are no-ops when debugEditWorldMap is disabled', () => {
      settingsManager.settings.debugEditWorldMap = false;
      const component = createComponent('gh');
      const target = { getElement: () => ({ getAttribute: () => null, setAttribute: () => {} }) } as any;
      const event = { target, latlng: { lat: 1, lng: 1 } };
      expect(() => component.editStartDrag(event)).not.toThrow();
      expect(() => component.editStopDrag(event)).not.toThrow();
      expect(() => component.editMoveDrag(event)).not.toThrow();
    });
  });
});
