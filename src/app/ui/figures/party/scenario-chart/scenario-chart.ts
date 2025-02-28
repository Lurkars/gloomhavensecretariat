import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { AfterViewInit, Component, HostListener, Inject, OnInit, ViewEncapsulation } from "@angular/core";

import { Overlay } from "@angular/cdk/overlay";
import L, { LatLngBoundsLiteral } from 'leaflet';
import mermaid from 'mermaid';
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { PartySheetDialogComponent } from "src/app/ui/figures/party/party-sheet-dialog";
import { WorldMapComponent } from "src/app/ui/figures/party/world-map/world-map";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";
import { ScenarioChartPopupDialog } from "./popup/scenario-chart-popup";
import { Subscription } from "rxjs";

@Component({
    standalone: false,
    selector: 'ghs-scenario-chart',
    templateUrl: 'scenario-chart.html',
    styleUrls: ['scenario-chart.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ScenarioChartDialogComponent implements OnInit, AfterViewInit {

    flow: string[] = [];
    flowString: string = "";
    edition: string;
    group: string | undefined;
    worldMap: boolean = false;
    campaignSheet: boolean = false;
    campaignMode: boolean = true;
    chart!: L.Map;

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public data: { edition: string, group: string | undefined }, private dialogRef: DialogRef, private dialog: Dialog, private overlay: Overlay) {
        this.edition = data.edition;
        this.group = data.group;
        this.campaignMode = gameManager.game.party.campaignMode;
    }

    ngOnInit(): void {
        mermaid.initialize({
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: "linear"
            },
            theme: "base",
            themeVariables: {
                fontSize: "calc(var(--ghs-unit) * 4 * var(--ghs-dialog-factor))",
                fontFamily: "var(--ghs-font-text)",
                darkMode: true,
                primaryColor: "#202830",
                secondaryColor: "transparent",
                tertiaryColor: "#52565f",
                tertiaryBorderColor: "#202830",
                tertiaryTextColor: "#eeeeee"
            }
        });
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.updateMap() });
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.flow = [
            "flowchart LR",
            "classDef default stroke-width:4;",
            "classDef success stroke:#7da82a;",
            "classDef unplayed stroke:#56c8ef;",
            "classDef blocked stroke:#e2421f;",
            "classDef locked stroke:#eca610;",
            "classDef success-blocked fill:#7da82a,stroke:#e2421f;",
            "classDef success-locked fill:#7da82a,stroke:#eca610;",
            "linkStyle default stroke-width:5"];

        let pad = "000";
        let subgraph: string | undefined = undefined;

        this.worldMap = false;
        const editionData = gameManager.editionData.find((editionData) => this.edition && editionData.edition == this.edition);
        if (editionData && (editionData.worldMap || editionData.extendWorldMap)) {
            this.worldMap = true;
        }

        const scenarios = gameManager.scenarioManager.scenarioData(this.edition, !this.campaignMode).filter((scenarioData) => scenarioData.group == this.group).sort(gameManager.scenarioManager.sortScenarios).sort((a, b) => {
            if (a.flowChartGroup == b.flowChartGroup) {
                return 0;
            } else if (!a.flowChartGroup && b.flowChartGroup) {
                return -1;
            } else if (a.flowChartGroup && !b.flowChartGroup) {
                return 1;
            } else if (a.flowChartGroup && b.flowChartGroup) {
                return a.flowChartGroup < b.flowChartGroup ? -1 : 1;
            }
            return 0;
        });

        scenarios.forEach((scenarioData) => {

            let state = ":::unplayed";
            const success = this.campaignMode && gameManager.scenarioManager.isSuccess(scenarioData);

            if (success) {
                state = ":::success";
            }
            if (this.campaignMode && gameManager.scenarioManager.isBlocked(scenarioData)) {
                state = success ? ":::success-blocked" : ":::blocked";
            } else if (this.campaignMode && gameManager.scenarioManager.isLocked(scenarioData)) {
                state = success ? ":::success-locked" : ":::locked";
            }

            if (scenarioData.flowChartGroup && scenarioData.flowChartGroup != subgraph || !scenarioData.flowChartGroup && scenarioData.group && scenarioData.group != subgraph) {
                if (subgraph) {
                    this.flow.push("end");
                }

                if (scenarioData.flowChartGroup) {
                    if (scenarios.find((other) => other != scenarioData && other.flowChartGroup == scenarioData.flowChartGroup)) {
                        const subgraphId = "" + settingsManager.getLabel('data.custom.' + this.edition + '.flowChartGroup.' + scenarioData.flowChartGroup) + ""
                        this.flow.push("subgraph " + subgraphId);
                        subgraph = scenarioData.flowChartGroup;
                    } else {
                        subgraph = undefined;
                    }
                } else {
                    if (scenarios.find((other) => other != scenarioData && !other.flowChartGroup && other.group == scenarioData.group)) {
                        this.flow.push("subgraph \"" + settingsManager.getLabel('data.scenario.group.' + scenarioData.group) + "\"");
                        subgraph = scenarioData.group;
                    } else {
                        subgraph = undefined;
                    }
                }
            }

            this.flow.push("\t" + scenarioData.index + "((" + (pad + scenarioData.index).slice(-pad.length) + "))" + state);
        });

        if (subgraph) {
            this.flow.push("end");
        }

        let unlocks: { a: string, b: string }[] = [];

        scenarios.forEach((scenarioData) => {
            const success = this.campaignMode && gameManager.scenarioManager.isSuccess(scenarioData);
            const visible: boolean = !this.campaignMode || success;
            let links: string[] = [];
            let forcedLinks: string[] = [];
            if (visible) {
                if (scenarioData.unlocks) {
                    scenarioData.unlocks.forEach((index) => {
                        let arrow = " --> ";
                        const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                        if (other) {
                            if (gameManager.scenarioManager.isBlocked(other)) {
                                arrow = " --x ";
                                this.flow.push("\t" + scenarioData.index + arrow + other.index);
                            } else if (gameManager.scenarioManager.isLocked(other)) {
                                arrow = " --o ";
                                this.flow.push("\t" + scenarioData.index + arrow + other.index);
                            } else if (!unlocks.find((unlock) => unlock.a == scenarioData.index && unlock.b == other.index)) {
                                unlocks.push({ a: scenarioData.index, b: other.index });
                                this.flow.push("\t" + scenarioData.index + arrow + other.index);
                            }
                        }
                    })
                }

                if (scenarioData.links) {
                    scenarioData.links.forEach((index) => {
                        let arrow = ' .->|🔗| ';
                        const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                        if (other && links.indexOf(index) == -1) {
                            if (gameManager.scenarioManager.isBlocked(other)) {
                                arrow = ' .-x|🔗| ';
                            } else if (gameManager.scenarioManager.isLocked(other)) {
                                arrow = ' .-o|🔗| ';
                            }

                            this.flow.push("\t" + scenarioData.index + arrow + index);
                            links.push(index);
                        }
                    })
                }

                if (scenarioData.forcedLinks) {
                    scenarioData.forcedLinks.forEach((index) => {
                        let arrow = ' .->|❗🔗| ';
                        const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                        if (other && forcedLinks.indexOf(index) == -1) {
                            if (gameManager.scenarioManager.isBlocked(other)) {
                                arrow = ' .-x|❗🔗| ';
                            } else if (gameManager.scenarioManager.isLocked(other)) {
                                arrow = ' .-o|❗🔗| ';
                            }

                            this.flow.push("\t" + scenarioData.index + arrow + index);
                            forcedLinks.push(index);
                        }
                    })
                }
            }

            if (visible) {
                gameManager.scenarioManager.getSections(scenarioData).filter((sectionData) => sectionData.unlocks && sectionData.unlocks.length).forEach((sectionData) => {
                    const success = this.campaignMode && gameManager.game.party.conclusions.find((scenarioModel) => scenarioModel.edition == sectionData.edition && scenarioModel.group == sectionData.group && scenarioModel.index == sectionData.index) != undefined;
                    const visible: boolean = !this.campaignMode || success;

                    if (visible && sectionData.unlocks) {
                        sectionData.unlocks.forEach((index) => {
                            let arrow = " --> ";
                            const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                            if (other) {
                                if (!unlocks.find((unlock) => unlock.a == scenarioData.index && unlock.b == other.index)) {
                                    unlocks.push({ a: scenarioData.index, b: other.index });
                                    this.flow.push("\t" + scenarioData.index + arrow + other.index);
                                }
                            }
                        })

                        if (sectionData.links) {
                            sectionData.links.forEach((index) => {
                                let arrow = ' .->|🔗| ';
                                const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                                if (other && links.indexOf(index) == -1) {
                                    if (gameManager.scenarioManager.isBlocked(other)) {
                                        arrow = ' .-x|🔗| ';
                                    } else if (gameManager.scenarioManager.isLocked(other)) {
                                        arrow = ' .-o|🔗| ';
                                    }

                                    this.flow.push("\t" + scenarioData.index + arrow + index);
                                    links.push(index);
                                }
                            })
                        }


                        if (sectionData.forcedLinks) {
                            sectionData.forcedLinks.forEach((index) => {
                                let arrow = ' .->|❗🔗| ';
                                const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                                if (other && forcedLinks.indexOf(index) == -1) {
                                    if (gameManager.scenarioManager.isBlocked(other)) {
                                        arrow = ' .-x|❗🔗| ';
                                    } else if (gameManager.scenarioManager.isLocked(other)) {
                                        arrow = ' .-o|❗🔗| ';
                                    }

                                    this.flow.push("\t" + scenarioData.index + arrow + index);
                                    forcedLinks.push(index);
                                }
                            })
                        }
                    }
                })
            }
        });

        this.flowString = this.flow.join("\n");
    }

    updateMap() {
        this.update();
        this.chart.remove();
        this.ngAfterViewInit();
    }

    async ngAfterViewInit() {

        const { svg, bindFunctions } = await mermaid.render('graphDiv', this.flowString);
        var parser = new DOMParser();
        var svgElement = parser.parseFromString(svg, "image/svg+xml").lastChild as SVGElement;

        let subgraphs: HTMLCollectionOf<SVGRectElement> | undefined[] = svgElement.getElementsByClassName('clusters').length ? svgElement.getElementsByClassName('clusters')[0].getElementsByTagName("rect") : [];

        for (let i = 0; i < subgraphs.length; i++) {
            const subgraph = subgraphs[i];
            if (subgraph) {
                subgraph.setAttribute("rx", "20");
                subgraph.setAttribute("ry", "20");
            }
        }

        const viewBox = svgElement.getAttribute('viewBox') || "0 0 600 600";
        const viewBoxArray = viewBox.split(/\s+|,/);
        const width = +viewBoxArray[2];
        const height = +viewBoxArray[3];
        const boundWidth = Math.max(width, 600);
        const boundHeight = Math.max(height, 600);
        const offsetX = boundWidth > width ? (boundWidth - width) / 2 : 0;
        const offsetY = boundHeight > height ? (boundHeight - height) : 0;
        this.chart = L.map('chart', {
            crs: L.CRS.Simple,
            maxBounds: [[boundHeight * -0.5, boundWidth * -0.5], [boundHeight * 1.5, boundWidth * 1.5]],
            minZoom: -4,
            zoomDelta: 0.25,
            zoomSnap: 0.25,
            wheelPxPerZoomLevel: 240,
            attributionControl: false
        });
        var bounds: LatLngBoundsLiteral = [[0, 0], [boundHeight * 1.5, boundWidth * 1.5]];
        this.chart.fitBounds(bounds);
        this.chart.zoomIn();

        const overlay = L.svgOverlay(svgElement, [[height + offsetY, offsetX], [offsetY, width + offsetX]], { interactive: true });

        svgElement.addEventListener('click', (event) => {
            const element = event.target as HTMLElement;
            if (element && element.classList.contains('nodeLabel')) {
                let parent = element.parentElement;
                while (parent && !parent.classList.contains('node')) {
                    parent = parent.parentElement;
                }
                if (parent && 'id' in parent.dataset) {
                    const scenarioData = gameManager.scenarioData(this.edition).find((scenarioData) => parent && scenarioData.group == this.group && scenarioData.index == parent.dataset['id']);
                    if (scenarioData) {
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
                }
            }
        });

        overlay.addTo(this.chart);

        const container = this.chart.getContainer();
        if (bindFunctions) {
            bindFunctions(container);
        }
    }

    @HostListener('document:keydown', ['$event'])
    keyboardShortcuts(event: KeyboardEvent) {
        if (settingsManager.settings.keyboardShortcuts && !this.campaignSheet) {
            if (!event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'p' && settingsManager.settings.partySheet) {
                this.openCampaignSheet();
                event.stopPropagation();
                event.preventDefault();
            } else if (!event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'g' && this.worldMap) {
                this.openWorldMap();
                event.stopPropagation();
                event.preventDefault();
            }
        }
    }

    toggleCampaignMode(event: any, force: boolean = false) {
        if (!this.campaignMode || force) {
            this.campaignMode = !this.campaignMode;
            this.updateMap();
        }

        event.preventDefault();
        event.stopPropagation();
    }

    openWorldMap() {
        if (this.worldMap) {
            this.dialogRef.close();
            setTimeout(() => {
                this.dialog.open(WorldMapComponent, {
                    panelClass: ['fullscreen-panel'],
                    backdropClass: ['fullscreen-backdrop'],
                    data: this.edition
                });
            }, 1);
        }
    }

    openCampaignSheet() {
        if (!this.campaignSheet) {
            this.campaignSheet = true;
            this.dialog.open(PartySheetDialogComponent, {
                panelClass: ['dialog-invert'],
                data: { disableShortcuts: true }
            }).closed.subscribe({ next: () => this.campaignSheet = false });
        }
    }
}