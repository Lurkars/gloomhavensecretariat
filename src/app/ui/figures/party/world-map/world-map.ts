import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { AfterViewInit, Component, Inject, ViewEncapsulation } from "@angular/core";
import L, { ImageOverlay, LatLngBounds, LatLngBoundsLiteral } from 'leaflet';
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { BuildingData } from "src/app/game/model/data/BuildingData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { WorldMapCoordinates } from "src/app/game/model/data/WorldMap";
import { ScenarioChartPopupDialog } from "src/app/ui/header/menu/scenario/chart/popup/scenario-chart-popup";
import { ghsDefaultDialogPositions, ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
    selector: 'ghs-world-map',
    templateUrl: './world-map.html',
    styleUrls: ['./world-map.scss',],
    encapsulation: ViewEncapsulation.None
})
export class WorldMapComponent implements AfterViewInit {

    gameManager: GameManager = gameManager;

    map!: L.Map;
    worldMap: { width: number, height: number } | undefined;
    mapEdition: string;
    scenarios: ScenarioData[] = [];
    conclusions: ScenarioData[] = [];
    buildings: BuildingData[] = [];
    columns: number[] = [];
    rows: number[] = [];
    offsetX: number[] = [];
    offsetY: number[] = [];
    success: boolean[] = [];

    scale: number = 1;
    zooming: boolean = false;
    highlighting: boolean = true;
    showExtended: boolean = false;

    constructor(@Inject(DIALOG_DATA) public edition: string, public dialogRef: DialogRef, private dialog: Dialog, private overlay: Overlay) {
        const pinchZoom = settingsManager.settings.pinchZoom;
        settingsManager.settings.pinchZoom = false;
        this.mapEdition = this.edition;
        let editionData = gameManager.editionData.find((editionData) => editionData.edition == this.edition);
        if (editionData && !editionData.worldMap && editionData.extendWorldMap) {
            editionData = gameManager.editionData.find((other) => editionData && other.edition == editionData.extendWorldMap && other.worldMap);
        }
        if (editionData && editionData.worldMap) {
            this.worldMap = editionData.worldMap;
            this.mapEdition = editionData.edition;
            if (this.worldMap) {
                this.scenarios = gameManager.scenarioManager.scenarioData(this.edition).filter((scenarioData) => scenarioData.coordinates);

                if (this.mapEdition != this.edition && this.showExtended) {
                    this.scenarios.push(...gameManager.scenarioManager.scenarioData(this.mapEdition).filter((scenarioData) => scenarioData.coordinates))
                }

                gameManager.sectionData(this.edition).filter((sectionData) => sectionData.conclusion && sectionData.coordinates && sectionData.unlocks && sectionData.unlocks.length).forEach((sectionData) => {
                    const visible = !gameManager.game.party.campaignMode || gameManager.game.party.conclusions.find((model) => model.edition == sectionData.edition && model.index == sectionData.index && model.group == sectionData.group);
                    if (visible) {
                        sectionData.unlocks.forEach((index) => {
                            let scenarioData = gameManager.scenarioData(sectionData.edition).find((scenarioData) => scenarioData.edition == sectionData.edition && scenarioData.group == sectionData.group && scenarioData.index == index && !scenarioData.coordinates);
                            if (scenarioData) {
                                const conclusionScenario = new ScenarioData(scenarioData);
                                conclusionScenario.coordinates = sectionData.coordinates;
                                this.scenarios.push(conclusionScenario);
                            }
                        })
                    }

                })

                this.conclusions = gameManager.sectionData(this.edition).filter((sectionData) => sectionData.conclusion && sectionData.rewards && (sectionData.rewards.overlayCampaignSticker || sectionData.rewards.overlaySticker));

                if (this.mapEdition != this.edition && this.showExtended) {
                    this.conclusions.push(...gameManager.sectionData(this.mapEdition).filter((sectionData) => sectionData.conclusion && sectionData.rewards && (sectionData.rewards.overlayCampaignSticker || sectionData.rewards.overlaySticker)))
                }

                if (editionData.campaign && editionData.campaign.buildings) {
                    this.buildings = editionData.campaign.buildings.filter((buildingData) => buildingData.coordinates && buildingData.coordinates.length);
                }
            }
        }

        this.dialogRef.closed.subscribe({
            next: () => {
                settingsManager.settings.pinchZoom = pinchZoom;
            }
        })
    }

    ngAfterViewInit(): void {
        if (this.worldMap) {
            const width = this.worldMap.width;
            const height = this.worldMap.height;
            this.map = L.map('map', {
                crs: L.CRS.Simple,
                maxBounds: [[height * -0.5, width * -0.5], [height * 1.5, width * 1.5]],
                minZoom: -4,
                zoomDelta: 0.25,
                zoomSnap: 0.25,
                wheelPxPerZoomLevel: 240,
                attributionControl: false
            });
            var bounds: LatLngBoundsLiteral = [[0, 0], [height, width]];
            L.imageOverlay('./assets/images/world-map/' + this.mapEdition + '/map.jpg', bounds).addTo(this.map);
            this.map.fitBounds(bounds);
            this.map.zoomIn();

            this.scenarios.forEach((scenarioData, i) => {
                if (scenarioData.coordinates) {
                    const success = gameManager.scenarioManager.isSuccess(scenarioData);

                    if (success) {
                        this.success[i] = true;
                    }

                    let imageIndex = scenarioData.index.replaceAll(/[a-zA-Z]+/g, '');
                    while (imageIndex.length < 3) {
                        imageIndex = '0' + imageIndex;
                    }

                    if (success) {
                        if (scenarioData.rewards && scenarioData.rewards.overlayCampaignSticker) {
                            const imageName = scenarioData.rewards.overlayCampaignSticker.coordinates.image || scenarioData.edition + '-' + scenarioData.rewards.overlayCampaignSticker.name.toLowerCase();
                            const overlayCampaignSticker: ImageOverlay = this.placeOverlay('./assets/images/world-map/' + scenarioData.edition + '/overlays/' + imageName + '.png', scenarioData.rewards.overlayCampaignSticker.coordinates, height, i + 3);
                            overlayCampaignSticker.addTo(this.map);
                            const element = overlayCampaignSticker.getElement();
                            if (element) {
                                element.classList.add('building');
                            }
                        }
                    }

                    if (!gameManager.game.party.campaignMode || success) {
                        if (scenarioData.rewards && scenarioData.rewards.overlaySticker) {
                            const imageName = scenarioData.rewards.overlaySticker.coordinates.image || scenarioData.edition + '-' + scenarioData.rewards.overlaySticker.name.toLowerCase();
                            const overlaySticker: ImageOverlay = this.placeOverlay('./assets/images/world-map/' + scenarioData.edition + '/overlays/' + imageName + '.png', scenarioData.rewards.overlaySticker.coordinates, height, -1);
                            overlaySticker.addTo(this.map);
                            const element = overlaySticker.getElement();
                            if (element) {
                                element.classList.add('overlay');
                            }
                        }
                    }

                    const imageName = scenarioData.coordinates.image || scenarioData.edition + '-' + imageIndex;
                    const overlay: ImageOverlay = this.placeOverlay('./assets/images/world-map/' + scenarioData.edition + '/scenarios/' + imageName + '.png', scenarioData.coordinates, height, i);

                    overlay.on('mouseover', (event) => {
                        event.target.setZIndex(this.scenarios.length + 2);
                    });

                    overlay.on('mouseout', (event) => {
                        event.target.setZIndex(i + 2);
                    });

                    overlay.on('click', (event) => {
                        if (!settingsManager.settings.debugEditWorldMap && (!gameManager.stateManager.permissions || gameManager.stateManager.permissions.scenario)) {
                            const scenarioData = this.scenarios[i];
                            const element = event.target.getElement();
                            this.dialog.open(ScenarioChartPopupDialog, {
                                panelClass: ['dialog'],
                                data: scenarioData,
                                positionStrategy: this.overlay.position().flexibleConnectedTo(element).withPositions(ghsDefaultDialogPositions())
                            }).closed.subscribe({
                                next: (result) => {
                                    if (result) {
                                        this.dialogRef.close();
                                    }
                                }
                            })
                        }
                    });

                    overlay.addTo(this.map);
                    const element = overlay.getElement();
                    if (element) {
                        let classes: string[] = ['scenario'];
                        if (success) {
                            classes.push('success');
                        }
                        if (gameManager.scenarioManager.isBlocked(scenarioData)) {
                            classes.push('blocked');
                        } else if (gameManager.scenarioManager.isLocked(scenarioData)) {
                            classes.push('locked');
                        }
                        classes.forEach((c) => element.classList.add(c));
                    }
                }
            })

            this.conclusions.forEach((sectionData) => {
                const success = gameManager.game.party.conclusions.find((model) => model.edition == sectionData.edition && model.index == sectionData.index && model.group == sectionData.group);

                if (!gameManager.game.party.campaignMode || success) {

                    if (sectionData.rewards && sectionData.rewards.overlayCampaignSticker) {
                        const imageName = sectionData.rewards.overlayCampaignSticker.coordinates.image || sectionData.edition + '-' + sectionData.rewards.overlayCampaignSticker.name.toLowerCase();
                        const overlayCampaignSticker: ImageOverlay = this.placeOverlay('./assets/images/world-map/' + sectionData.edition + '/overlays/' + imageName + '.png', sectionData.rewards.overlayCampaignSticker.coordinates, height, -1);
                        overlayCampaignSticker.addTo(this.map);
                        const element = overlayCampaignSticker.getElement();
                        if (element) {
                            element.classList.add('building');
                        }
                    }

                    if (sectionData.rewards && sectionData.rewards.overlaySticker) {
                        const imageName = sectionData.rewards.overlaySticker.coordinates.image || sectionData.edition + '-' + sectionData.rewards.overlaySticker.name.toLowerCase();
                        const overlaySticker: ImageOverlay = this.placeOverlay('./assets/images/world-map/' + sectionData.edition + '/overlays/' + imageName + '.png', sectionData.rewards.overlaySticker.coordinates, height, -1);
                        overlaySticker.addTo(this.map);
                        const element = overlaySticker.getElement();
                        if (element) {
                            element.classList.add('overlay');
                        }
                    }
                }
            })

            this.buildings.forEach((buildingData) => {
                const model = gameManager.game.party.buildings.find((model) => model.name == buildingData.name);
                const level: number | undefined = model ? model.level : (gameManager.buildingsManager.initialBuilding(buildingData) ? 1 : gameManager.buildingsManager.availableBuilding(buildingData) ? 0 : undefined);
                if (level != undefined) {
                    if (buildingData.coordinates && buildingData.coordinates.length) {
                        const overlayData = buildingData.coordinates[level || 0];
                        if (overlayData) {
                            const imageName = overlayData.image || buildingData.edition + '-' + (buildingData.id ? buildingData.id + '-' : '') + buildingData.name + (buildingData.upgrades.length || buildingData.manualUpgrades ? '-' + (level != undefined ? level : '0') : '');
                            const overlayBuilding: ImageOverlay = this.placeOverlay('./assets/images/world-map/' + buildingData.edition + '/buildings/' + imageName + '.png', overlayData, height, -1);
                            overlayBuilding.addTo(this.map);
                            const element = overlayBuilding.getElement();
                            if (element) {
                                element.classList.add('building');
                            }
                        }
                    }
                }
            })
        }
    }

    placeOverlay(url: string, coordinates: WorldMapCoordinates, height: number, index: number): ImageOverlay {
        let overlay = L.imageOverlay(url, [[height - coordinates.y, coordinates.x], [height - coordinates.y - coordinates.height, coordinates.x + coordinates.width]], { interactive: true });

        overlay.setZIndex(index + 2);

        overlay.on('mousedown', (event) => this.editStartDrag(event));
        overlay.on('mouseleave', (event) => this.editStopDrag(event));
        overlay.on('mousemove', (event) => this.editMoveDrag(event));

        return overlay;
    }

    editStartDrag(event: any) {
        if (settingsManager.settings.debugEditWorldMap) {
            const target = event.target as ImageOverlay;
            const element = target.getElement();
            if (element && !element.getAttribute('drag')) {
                this.map.dragging.disable();
                element.setAttribute("drag", "" + true);
                element.setAttribute("dragLat", "" + event.latlng.lat);
                element.setAttribute("dragLng", "" + event.latlng.lng);
                target.setOpacity(0.5);
            } else {
                this.editStopDrag(event);
            }
        }
    }

    editStopDrag(event: any) {
        if (settingsManager.settings.debugEditWorldMap) {
            const target = event.target as ImageOverlay;
            const element = target.getElement();

            if (element && element.getAttribute('drag')) {
                this.map.dragging.enable();
                this.worldMap && console.debug("\"x\": " + target.getBounds().getSouthWest().lng + ",\n" + "\"y\": " + (this.worldMap.height - target.getBounds().getNorthEast().lat) + ",");
                element.removeAttribute("drag");
                element.removeAttribute("dragLat");
                element.removeAttribute("dragLng");
                target.setOpacity(1);
            }
        }
    }

    editMoveDrag(event: any) {
        if (settingsManager.settings.debugEditWorldMap) {
            const target = event.target as ImageOverlay;
            const element = target.getElement();
            if (element && element.getAttribute('drag')) {
                let lat: number | undefined;
                let lng: number | undefined;
                lat = +(element.getAttribute("dragLat") || 0);
                lng = +(element.getAttribute("dragLng") || 0);
                if (lat && lng) {
                    lat = event.latlng.lat - lat;
                    lng = event.latlng.lng - lng;
                    const bounds: LatLngBounds = new LatLngBounds([target.getBounds().getSouthWest().lat + lat, target.getBounds().getSouthWest().lng + lng], [target.getBounds().getNorthEast().lat + lat, target.getBounds().getNorthEast().lng + lng]);
                    target.setBounds(bounds);
                    (event.target.getElement() as HTMLElement).setAttribute("dragLat", "" + event.latlng.lat);
                    (event.target.getElement() as HTMLElement).setAttribute("dragLng", "" + event.latlng.lng);
                    event.originalEvent.preventDefault();
                    event.originalEvent.stopPropagation();
                }
            }
        }
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }
}

