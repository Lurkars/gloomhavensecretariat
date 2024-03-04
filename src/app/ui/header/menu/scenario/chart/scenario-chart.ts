import { DIALOG_DATA } from "@angular/cdk/dialog";
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";

import { gameManager } from "src/app/game/businesslogic/GameManager";
import mermaid from 'mermaid';
import L, { LatLngBoundsLiteral } from 'leaflet';
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";


@Component({
    selector: 'ghs-scenario-chart',
    templateUrl: 'scenario-chart.html',
    styleUrls: ['scenario-chart.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ScenarioChartDialogComponent implements OnInit, AfterViewInit {

    @ViewChild("mermaid") mermaidElement!: ElementRef;

    flow: string[] = ["flowchart TB", "classDef success stroke:#7da82a,stroke-width:6", "classDef blocked stroke:#e2421f,stroke-width:6", "classDef locked stroke:#eca610,stroke-width:6", "linkStyle default stroke-width:5"];
    flowString: string = "";
    edition: string;
    group: string | undefined;

    constructor(@Inject(DIALOG_DATA) public data: { edition: string, group: string | undefined }) {
        this.edition = data.edition;
        this.group = data.group;
    }

    ngOnInit(): void {
        mermaid.initialize({
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: "linear"
            },
            securityLevel: "loose",
            themeVariables: {
                fontSize: "calc(var(--ghs-unit) * 4 * var(--ghs-dialog-factor))",
                fontFamily: 'var(--ghs-font-text)'
            }
        });

        let pad = "000";
        let subgraph: string | undefined = undefined;
        const scenarios = gameManager.scenarioManager.scenarioData(this.edition).filter((scenarioData) => scenarioData.group == this.group).sort(gameManager.scenarioManager.sortScenarios).sort((a, b) => {
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
            if (scenarioData.flowChartGroup && scenarioData.flowChartGroup != subgraph) {
                if (subgraph) {
                    this.flow.push("end");
                }
                this.flow.push("subgraph \"" + settingsManager.getLabel('data.custom.' + this.edition + '.flowChartGroup.' + scenarioData.flowChartGroup) + "\"");
                subgraph = scenarioData.flowChartGroup;
            }
            this.flow.push("\t" + scenarioData.index + "((" + (pad + scenarioData.index).slice(-pad.length) + "))");
        });

        if (subgraph) {
            this.flow.push("end");
        }


        scenarios.forEach((scenarioData) => {
            const success = gameManager.game.party.campaignMode && gameManager.game.party.scenarios.find((scenarioModel) => scenarioModel.edition == scenarioData.edition && scenarioModel.group == scenarioData.group && scenarioModel.index == scenarioData.index) != undefined;
            const visible: boolean = !gameManager.game.party.campaignMode || success;
            if (visible) {
                if (scenarioData.unlocks) {
                    scenarioData.unlocks.forEach((index) => {
                        let arrow = " --> ";
                        let otherClass = "";
                        const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                        if (other) {
                            if (gameManager.scenarioManager.isBlocked(other)) {
                                arrow = " --x ";
                                otherClass = ":::blocked";
                            } else if (gameManager.scenarioManager.isLocked(other)) {
                                arrow = " --o ";
                                otherClass = ":::locked";
                            }

                            this.flow.push("\t" + scenarioData.index + "((" + (pad + scenarioData.index).slice(-pad.length) + "))" + (success ? ":::success" : "") + arrow + index + "((" + (pad + other.index).slice(-pad.length) + "))" + otherClass);
                        }
                    })
                }

                if (scenarioData.links) {
                    scenarioData.links.forEach((index) => {
                        let arrow = ' -.->|🔗| ';
                        let otherClass = "";
                        const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                        if (other) {
                            if (gameManager.scenarioManager.isBlocked(other)) {
                                arrow = ' -.-x|🔗| ';
                                otherClass = ":::blocked";
                            } else if (gameManager.scenarioManager.isLocked(other)) {
                                arrow = ' -.-o|🔗| ';
                                otherClass = ":::locked";
                            }

                            this.flow.push("\t" + scenarioData.index + "((" + (pad + scenarioData.index).slice(-pad.length) + "))" + (success ? ":::success" : "") + arrow + index + "((" + (pad + other.index).slice(-pad.length) + "))" + otherClass);
                        }
                    })
                }

                if (scenarioData.forcedLinks) {
                    scenarioData.forcedLinks.forEach((index) => {
                        let arrow = ' -.->|❗🔗| ';
                        let otherClass = "";
                        const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                        if (other) {
                            if (gameManager.scenarioManager.isBlocked(other)) {
                                arrow = ' -.-x|❗🔗| ';
                                otherClass = ":::blocked";
                            } else if (gameManager.scenarioManager.isLocked(other)) {
                                arrow = ' -.-o|❗🔗| ';
                                otherClass = ":::locked";
                            }

                            this.flow.push("\t" + scenarioData.index + "((" + (pad + scenarioData.index).slice(-pad.length) + "))" + (success ? ":::success" : "") + arrow + index + "((" + (pad + other.index).slice(-pad.length) + "))" + otherClass);
                        }
                    })
                }
            }

            if (visible) {
                gameManager.scenarioManager.getSections(scenarioData).filter((sectionData) => sectionData.unlocks && sectionData.unlocks.length).forEach((sectionData) => {
                    const success = gameManager.game.party.campaignMode && gameManager.game.party.conclusions.find((scenarioModel) => scenarioModel.edition == sectionData.edition && scenarioModel.group == sectionData.group && scenarioModel.index == sectionData.index) != undefined;
                    const visible: boolean = !gameManager.game.party.campaignMode || success;

                    if (visible && scenarioData.unlocks) {
                        sectionData.unlocks.forEach((index) => {
                            let arrow = " -.-o ";
                            const other = gameManager.scenarioManager.getScenario(index, scenarioData.edition, scenarioData.group);
                            if (other) {
                                this.flow.push("\t" + scenarioData.index + "((" + (pad + scenarioData.index).slice(-pad.length) + "))" + arrow + index + "((" + (pad + other.index).slice(-pad.length) + "))");
                            }
                        })
                    }
                })
            }
        });

        this.flowString = this.flow.join("\n");
    }

    async ngAfterViewInit() {

        const { svg, bindFunctions } = await mermaid.render('graphDiv', this.flowString);
        var parser = new DOMParser();
        var svgElement = parser.parseFromString(svg, "image/svg+xml").lastChild as SVGElement;
        const viewBox = svgElement.getAttribute('viewBox') || "0 0 600 600";
        const viewBoxArray = viewBox.split(/\s+|,/);
        const width = +viewBoxArray[2];
        const height = +viewBoxArray[3];
        var map = L.map('map', {
            crs: L.CRS.Simple,
            maxBounds: [[height * -0.5, width * -0.5], [height * 1.5, width * 1.5]],
            minZoom: -4,
            attributionControl: false
        });
        var bounds: LatLngBoundsLiteral = [[0, 0], [height * 1.5, width * 1.5]];
        map.fitBounds(bounds);
        map.zoomIn();

        L.svgOverlay(svgElement, [[height, 0], [0, width]]).addTo(map);

        const container = map.getContainer();
        if (bindFunctions) {
            bindFunctions(container);
        }
    }
}