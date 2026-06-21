import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { AfterViewInit, Component, HostListener, inject, OnInit, ViewEncapsulation } from '@angular/core';
import type { LatLngBoundsLiteral, Map as LeafletMap } from 'leaflet';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { PartySheetDialogComponent } from 'src/app/ui/figures/party/party-sheet-dialog';
import { ScenarioChartPopupDialog } from 'src/app/ui/figures/party/scenario-chart/popup/scenario-chart-popup';
import { WorldMapComponent } from 'src/app/ui/figures/party/world-map/world-map';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, PointerInputDirective],
  selector: 'ghs-scenario-chart',
  templateUrl: 'scenario-chart.html',
  styleUrls: ['scenario-chart.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ScenarioChartDialogComponent implements OnInit, AfterViewInit {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  flow: string[] = [];
  flowString: string = '';
  edition: string;
  worldMap: boolean = false;
  campaignSheet: boolean = false;
  campaignMode: boolean = true;
  legend: boolean = false;
  chart!: LeafletMap;
  private mermaid: any = null;
  initializing: boolean = false;
  private nodeScenarioMap = new Map<string, ScenarioData>();

  gameManager: GameManager = gameManager;

  data: { edition: string } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.updateMap());
    this.edition = this.data.edition;
    this.campaignMode = gameManager.game.party.campaignMode;
  }

  async ngOnInit(): Promise<void> {
    // Lazy load mermaid only when needed
    if (!this.mermaid) {
      const mermaidModule = await import('mermaid');
      this.mermaid = mermaidModule.default;

      this.mermaid.initialize({
        startOnLoad: false,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'linear',
          padding: 10,
          subGraphTitleMargin: {
            bottom: 15
          }
        },
        theme: 'base',
        themeVariables: {
          fontSize: 'calc(var(--ghs-unit) * 3.5 * var(--ghs-dialog-factor))',
          fontFamily: 'var(--ghs-font-text)',
          darkMode: true,
          primaryColor: '#202830',
          secondaryColor: 'transparent',
          tertiaryColor: '#52565f',
          tertiaryBorderColor: '#202830',
          tertiaryTextColor: '#eeeeee'
        },
        wrap: false,
        // Disable unused diagram types to reduce bundle size
        securityLevel: 'loose',
        logLevel: 5
      });
    }
  }

  ngAfterViewInit(): void {
    this.updateMap();
  }

  update(): boolean {
    this.flow = [
      'flowchart LR',
      'classDef default stroke-width:4, r:32px;',
      'classDef success stroke:#7da82a;',
      'classDef unplayed stroke:#56c8ef;',
      'classDef blocked stroke:#e2421f;',
      'classDef locked stroke:#eca610;',
      'classDef success-blocked fill:#7da82a,stroke:#e2421f;',
      'classDef success-locked fill:#7da82a,stroke:#eca610;',
      'linkStyle default stroke-width:5;'
    ];

    this.nodeScenarioMap.clear();

    const pad = '000';

    this.worldMap = false;
    const editionData = gameManager.editionData.find((editionData) => this.edition && editionData.edition === this.edition);
    if (editionData && (editionData.worldMap || editionData.extendWorldMap)) {
      this.worldMap = true;
    }

    const extendedEditions = editionData && editionData.type === 'addon' ? editionData.extends || [] : [];
    const allScenarios = [
      ...gameManager.scenarioManager.scenarioData(this.edition, !this.campaignMode),
      ...extendedEditions.flatMap((ext) => gameManager.scenarioManager.scenarioData(ext, !this.campaignMode))
    ].filter((scenarioData) => {
      if (scenarioData.random || scenarioData.group === 'random' || scenarioData.group === 'randomDungeon') {
        return false;
      }
      if (this.campaignMode && scenarioData.solo) {
        const characterData = gameManager.getCharacterData(scenarioData.solo, scenarioData.edition);
        return (
          !!characterData &&
          (!characterData.spoiler || gameManager.game.unlockedCharacters.includes(characterData.edition + ':' + characterData.name))
        );
      }
      return true;
    });

    // Unique node id for mermaid across all groups
    const nodeId = (scenarioData: ScenarioData): string =>
      scenarioData.group ? scenarioData.group + '-' + scenarioData.index : scenarioData.index;
    // Composite key for lookups across groups
    const compositeKey = (scenarioData: ScenarioData): string => (scenarioData.group ?? '') + ':' + scenarioData.index;
    const compositeKeyFromParts = (group: string | undefined, index: string): string => (group ?? '') + ':' + index;

    const successSet = new Set(gameManager.game.party.scenarios.map((m) => `${m.edition}:${m.group ?? ''}:${m.index}`));

    const scenariosByIndex = new Map<string, ScenarioData>();
    allScenarios.forEach((s) => {
      scenariosByIndex.set(compositeKey(s), s);
      this.nodeScenarioMap.set(nodeId(s), s);
    });

    const blockedIndices = new Set<string>();
    gameManager.game.party.scenarios
      .filter((m) => m.edition === this.edition)
      .forEach((m) => {
        const s = scenariosByIndex.get(compositeKeyFromParts(m.group, m.index));
        if (s && s.blocks && successSet.has(`${m.edition}:${m.group ?? ''}:${m.index}`)) {
          s.blocks.forEach((b) => blockedIndices.add(compositeKeyFromParts(s.group, b)));
        }
      });
    gameManager.game.party.conclusions
      .filter((m) => m.edition === this.edition)
      .forEach((m) => {
        const section = gameManager.scenarioManager.getSection(m.index, m.edition, m.group, true);
        if (section && section.blocks) {
          section.blocks.forEach((b) => blockedIndices.add(compositeKeyFromParts(m.group, b)));
        }
      });

    const lockedSet = new Set<string>();
    allScenarios.forEach((s) => {
      if (gameManager.scenarioManager.isLocked(s)) lockedSet.add(compositeKey(s));
    });

    // Get distinct groups, sorted with undefined (main campaign) first
    const groups = Array.from(new Set(allScenarios.map((s) => s.group))).sort((a, b) => {
      if (a === b) return 0;
      if (!a) return -1;
      if (!b) return 1;
      return a.localeCompare(b);
    });

    // Iterate over each group
    groups.forEach((group) => {
      const scenarios = allScenarios
        .filter((scenarioData) => scenarioData.group === group)
        .sort(gameManager.scenarioManager.sortScenarios)
        .sort((a, b) => {
          if (a.flowChartGroup === b.flowChartGroup) {
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

      if (scenarios.length === 0) {
        return;
      }

      // Open group subgraph (only for named groups)
      if (group) {
        this.flow.push('subgraph "' + settingsManager.getLabel('data.scenario.group.' + group) + '"');
      }

      let subgraph: string | undefined = undefined;

      scenarios.forEach((scenarioData) => {
        let state = ':::unplayed';
        const success = this.campaignMode && successSet.has(`${scenarioData.edition}:${scenarioData.group ?? ''}:${scenarioData.index}`);

        if (success) {
          state = ':::success';
        }
        if (this.campaignMode && blockedIndices.has(compositeKey(scenarioData))) {
          state = success ? ':::success-blocked' : ':::blocked';
        } else if (this.campaignMode && lockedSet.has(compositeKey(scenarioData))) {
          state = success ? ':::success-locked' : ':::locked';
        }

        // Handle flowChartGroup subgraphs within this group
        if (scenarioData.flowChartGroup && scenarioData.flowChartGroup !== subgraph) {
          if (subgraph) {
            this.flow.push('end');
          }
          this.flow.push(
            'subgraph "' +
              settingsManager.getLabel('data.custom.' + scenarioData.edition + '.flowChartGroup.' + scenarioData.flowChartGroup) +
              '"'
          );
          subgraph = scenarioData.flowChartGroup;
        } else if (!scenarioData.flowChartGroup && subgraph) {
          this.flow.push('end');
          subgraph = undefined;
        }

        const index = scenarioData.index.match(/\d+/g) ? (pad + scenarioData.index).slice(-pad.length) : scenarioData.index;
        this.flow.push('\t' + nodeId(scenarioData) + '((' + index + '))' + state);
      });

      if (subgraph) {
        this.flow.push('end');
      }

      // Close group subgraph
      if (group) {
        this.flow.push('end');
      }
    });

    const unlocks: { a: string; b: string }[] = [];
    const collectedLinks: { a: string; b: string }[] = [];

    allScenarios.forEach((scenarioData) => {
      const success = this.campaignMode && successSet.has(`${scenarioData.edition}:${scenarioData.group ?? ''}:${scenarioData.index}`);
      const visible: boolean = !this.campaignMode || success;
      const links: string[] = [];
      const forcedLinks: string[] = [];
      if (visible) {
        if (scenarioData.unlocks) {
          scenarioData.unlocks.forEach((index) => {
            let arrow: string | false = ' --- ';
            const unlockKey = compositeKeyFromParts(scenarioData.group, index);
            const unlockScenarioData = scenariosByIndex.get(unlockKey);
            if (unlockScenarioData) {
              const unlockCKey = compositeKey(unlockScenarioData);
              if (this.campaignMode && blockedIndices.has(unlockCKey)) {
                arrow = ' --- ';
              } else if (this.campaignMode && lockedSet.has(unlockCKey)) {
                arrow = ' --- ';
              } else if (!unlocks.find((unlock) => unlock.a === nodeId(scenarioData) && unlock.b === nodeId(unlockScenarioData))) {
                unlocks.push({ a: nodeId(scenarioData), b: nodeId(unlockScenarioData) });
              } else {
                arrow = false;
              }

              if (arrow) {
                if (
                  unlockScenarioData.blocks &&
                  unlockScenarioData.blocks.some((block) => scenarioData.unlocks.includes(block)) &&
                  allScenarios.some((other) => other.index === unlockScenarioData.index)
                ) {
                  arrow = ' ' + arrow.trim() + '|🔓| ';
                }

                if (scenarioData.forcedLinks && scenarioData.forcedLinks.includes(unlockScenarioData.index)) {
                  if (arrow.includes('🔓')) {
                    arrow = arrow.replace('🔓', '🔓❗🔗');
                  } else {
                    arrow = ' ' + arrow.trim() + '|❗🔗| ';
                  }
                  collectedLinks.push({ a: nodeId(scenarioData), b: nodeId(unlockScenarioData) });
                } else if (scenarioData.links && scenarioData.links.includes(unlockScenarioData.index)) {
                  if (arrow.includes('🔓')) {
                    arrow = arrow.replace('🔓', '🔓🔗');
                  } else {
                    arrow = ' ' + arrow.trim() + '|🔗| ';
                  }
                  collectedLinks.push({ a: nodeId(scenarioData), b: nodeId(unlockScenarioData) });
                }

                this.flow.push('\t' + nodeId(scenarioData) + arrow + nodeId(unlockScenarioData));
              }
            }
          });
        }

        if (scenarioData.links) {
          scenarioData.links.forEach((index) => {
            const arrow = ' ---|🔗| ';
            const otherKey = compositeKeyFromParts(scenarioData.group, index);
            const other = scenariosByIndex.get(otherKey);
            if (
              other &&
              !collectedLinks.some((value) => value.a === nodeId(scenarioData) && value.b === nodeId(other)) &&
              !links.includes(index) &&
              allScenarios.find(
                (unlocked) => unlocked.edition === other.edition && unlocked.group === other.group && unlocked.index === other.index
              )
            ) {
              this.flow.push('\t' + nodeId(scenarioData) + arrow + nodeId(other));
              links.push(index);
            }
          });
        }

        if (scenarioData.forcedLinks) {
          scenarioData.forcedLinks.forEach((index) => {
            const arrow = ' ---|❗🔗| ';
            const otherKey = compositeKeyFromParts(scenarioData.group, index);
            const other = scenariosByIndex.get(otherKey);
            if (
              other &&
              !collectedLinks.some((value) => value.a === nodeId(scenarioData) && value.b === nodeId(other)) &&
              !forcedLinks.includes(index)
            ) {
              this.flow.push('\t' + nodeId(scenarioData) + arrow + nodeId(other));
              forcedLinks.push(index);
            }
          });
        }

        const sections = gameManager.scenarioManager.getSections(scenarioData);
        sections
          .filter((sectionData) => sectionData.unlocks && sectionData.unlocks.length)
          .forEach((sectionData) => {
            const success =
              this.campaignMode &&
              gameManager.game.party.conclusions.find(
                (scenarioModel) =>
                  scenarioModel.edition === sectionData.edition &&
                  scenarioModel.group === sectionData.group &&
                  scenarioModel.index === sectionData.index
              ) !== undefined;
            const visible: boolean = !this.campaignMode || success;

            if (visible && sectionData.unlocks) {
              sectionData.unlocks.forEach((index) => {
                let arrow = ' --- ';
                const otherKey = compositeKeyFromParts(sectionData.group, index);
                const other = scenariosByIndex.get(otherKey);
                if (other) {
                  if (!unlocks.find((unlock) => unlock.a === nodeId(scenarioData) && unlock.b === nodeId(other))) {
                    unlocks.push({ a: nodeId(scenarioData), b: nodeId(other) });

                    if (
                      !this.campaignMode &&
                      other.blocks &&
                      other.blocks.some(
                        (block) =>
                          sectionData.unlocks.includes(block) ||
                          sections.some((otherSection) => otherSection.unlocks && otherSection.unlocks.includes(block))
                      )
                    ) {
                      arrow = ' ' + arrow.trim() + '|🔓| ';
                    }

                    if (sectionData.forcedLinks && sectionData.forcedLinks.includes(other.index)) {
                      if (arrow.includes('🔓')) {
                        arrow = arrow.replace('🔓', '🔓❗🔗');
                      } else {
                        arrow = ' ' + arrow.trim() + '|❗🔗| ';
                      }
                      collectedLinks.push({ a: nodeId(scenarioData), b: nodeId(other) });
                    } else if (sectionData.links && sectionData.links.includes(other.index)) {
                      if (arrow.includes('🔓')) {
                        arrow = arrow.replace('🔓', '🔓🔗');
                      } else {
                        arrow = ' ' + arrow.trim() + '|🔗| ';
                      }
                      collectedLinks.push({ a: nodeId(scenarioData), b: nodeId(other) });
                    }

                    this.flow.push('\t' + nodeId(scenarioData) + arrow + nodeId(other));
                  }
                }
              });

              if (sectionData.links) {
                sectionData.links.forEach((index) => {
                  const arrow = ' ---|🔗| ';
                  const otherKey = compositeKeyFromParts(sectionData.group, index);
                  const other = scenariosByIndex.get(otherKey);
                  if (
                    other &&
                    !collectedLinks.some((value) => value.a === nodeId(scenarioData) && value.b === nodeId(other)) &&
                    !links.includes(index)
                  ) {
                    this.flow.push('\t' + nodeId(scenarioData) + arrow + nodeId(other));
                    links.push(index);
                  }
                });
              }

              if (sectionData.forcedLinks) {
                sectionData.forcedLinks.forEach((index) => {
                  const arrow = ' ---|❗🔗| ';
                  const otherKey = compositeKeyFromParts(sectionData.group, index);
                  const other = scenariosByIndex.get(otherKey);
                  if (
                    other &&
                    !collectedLinks.some((value) => value.a === nodeId(scenarioData) && value.b === nodeId(other)) &&
                    !forcedLinks.includes(index)
                  ) {
                    this.flow.push('\t' + nodeId(scenarioData) + arrow + nodeId(other));
                    forcedLinks.push(index);
                  }
                });
              }
            }
          });

        sections
          .filter(
            (sectionData) =>
              sectionData.conclusion &&
              sectionData.rewards &&
              (sectionData.rewards.calendarSection || sectionData.rewards.calendarSectionManual)
          )
          .forEach((sectionData) => {
            const success =
              this.campaignMode &&
              gameManager.game.party.conclusions.find(
                (scenarioModel) =>
                  scenarioModel.edition === sectionData.edition &&
                  scenarioModel.group === sectionData.group &&
                  scenarioModel.index === sectionData.index
              ) !== undefined;
            const visible: boolean = !this.campaignMode || success;
            if (visible) {
              this.calendarLinkHelper(nodeId(scenarioData), sectionData, unlocks);
            }
          });

        this.calendarLinkHelper(nodeId(scenarioData), scenarioData, unlocks);
      }
    });

    if (this.flow.join('\n') !== this.flowString) {
      this.flowString = this.flow.join('\n');
      return true;
    }
    return false;
  }

  calendarLinkHelper(scenarioNodeId: string, scenarioData: ScenarioData, unlocks: { a: string; b: string }[]) {
    const nodeIdFromIndex = (group: string | undefined, index: string): string => (group ? group + '-' + index : index);

    if (scenarioData.rewards && scenarioData.rewards.calendarSection) {
      scenarioData.rewards.calendarSection
        .map((value) => gameManager.scenarioManager.getSection(value.split('-')[0], scenarioData.edition, scenarioData.group))
        .forEach((sectionData) => {
          if (sectionData && !sectionData.hideIndex) {
            if (sectionData.unlocks) {
              sectionData.unlocks.forEach((index) => {
                if (!unlocks.find((unlock) => unlock.a === scenarioNodeId && unlock.b === nodeIdFromIndex(sectionData.group, index))) {
                  unlocks.push({ a: scenarioNodeId, b: nodeIdFromIndex(sectionData.group, index) });
                  this.flow.push('\t' + scenarioNodeId + ' --o|🗓️| ' + nodeIdFromIndex(sectionData.group, index));
                }
              });
            } else {
              gameManager
                .sectionData(sectionData.edition)
                .filter(
                  (other) =>
                    other.conclusion && other.parentSections && other.parentSections.some((value) => value.includes(sectionData.index))
                )
                .forEach((other) => {
                  if (other.unlocks && !other.hideIndex) {
                    other.unlocks.forEach((index) => {
                      if (!unlocks.find((unlock) => unlock.a === scenarioNodeId && unlock.b === nodeIdFromIndex(other.group, index))) {
                        unlocks.push({ a: scenarioNodeId, b: nodeIdFromIndex(other.group, index) });
                        this.flow.push('\t' + scenarioNodeId + ' --o|🗓️| ' + nodeIdFromIndex(other.group, index));
                      }
                    });
                  }
                });
            }
          }
        });
    }

    if (scenarioData.rewards && scenarioData.rewards.calendarSectionManual) {
      scenarioData.rewards.calendarSectionManual
        .map((value) => gameManager.scenarioManager.getSection(value.section, scenarioData.edition, scenarioData.group))
        .forEach((sectionData) => {
          if (sectionData && !sectionData.hideIndex) {
            if (sectionData.unlocks) {
              sectionData.unlocks.forEach((index) => {
                if (!unlocks.find((unlock) => unlock.a === scenarioNodeId && unlock.b === nodeIdFromIndex(sectionData.group, index))) {
                  unlocks.push({ a: scenarioNodeId, b: nodeIdFromIndex(sectionData.group, index) });
                  this.flow.push('\t' + scenarioNodeId + ' --o|🗓️| ' + nodeIdFromIndex(sectionData.group, index));
                }
              });
            } else {
              gameManager
                .sectionData(sectionData.edition)
                .filter(
                  (other) =>
                    other.conclusion && other.parentSections && other.parentSections.some((value) => value.includes(sectionData.index))
                )
                .forEach((other) => {
                  if (other.unlocks && !other.hideIndex) {
                    other.unlocks.forEach((index) => {
                      if (!unlocks.find((unlock) => unlock.a === scenarioNodeId && unlock.b === nodeIdFromIndex(other.group, index))) {
                        unlocks.push({ a: scenarioNodeId, b: nodeIdFromIndex(other.group, index) });
                        this.flow.push('\t' + scenarioNodeId + ' --o|🗓️| ' + nodeIdFromIndex(other.group, index));
                      }
                    });
                  }
                });
            }
          }
        });
    }
  }

  updateMap() {
    if (this.update()) {
      if (this.chart) {
        this.chart.remove();
      }
      this.initMap();
    }
  }

  async initMap() {
    if (this.initializing) {
      return;
    }
    this.initializing = true;
    // Ensure mermaid is loaded before rendering
    if (!this.mermaid) {
      const mermaidModule = await import('mermaid');
      this.mermaid = mermaidModule.default;
    }

    const { svg, bindFunctions } = await this.mermaid.render('graphDiv', this.flowString);
    const parser = new DOMParser();
    const svgElement = parser.parseFromString(svg, 'image/svg+xml').lastChild as SVGElement;

    const clusters = svgElement.getElementsByClassName('cluster');
    for (let i = 0; i < clusters.length; i++) {
      const rects = clusters[i].getElementsByTagName('rect');
      for (let j = 0; j < rects.length; j++) {
        rects[j].setAttribute('rx', '20');
        rects[j].setAttribute('ry', '20');
      }
    }

    const viewBox = svgElement.getAttribute('viewBox') || '0 0 600 600';
    const viewBoxArray = viewBox.split(/\s+|,/);
    const width = +viewBoxArray[2];
    const height = +viewBoxArray[3];
    const boundWidth = Math.max(width, 600);
    const boundHeight = Math.max(height, 600);
    const offsetX = boundWidth > width ? (boundWidth - width) / 2 : 0;
    const offsetY = boundHeight > height ? boundHeight - height : 0;
    const leafletModule = await import('leaflet');
    const L = 'default' in leafletModule ? leafletModule.default : leafletModule;
    this.chart = L.map('chart', {
      crs: L.CRS.Simple,
      maxBounds: [
        [boundHeight * -0.5, boundWidth * -0.5],
        [boundHeight * 1.5, boundWidth * 1.5]
      ],
      minZoom: -4,
      zoomDelta: 0.25,
      zoomSnap: 0.25,
      wheelPxPerZoomLevel: 240,
      attributionControl: false
    });
    const bounds: LatLngBoundsLiteral = [
      [0, 0],
      [boundHeight * 1.5, boundWidth * 1.5]
    ];
    this.chart.fitBounds(bounds);
    this.chart.zoomIn();

    const overlay = L.svgOverlay(
      svgElement,
      [
        [height + offsetY, offsetX],
        [offsetY, width + offsetX]
      ],
      { interactive: true }
    );

    svgElement.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      let element = event.target as HTMLElement;

      if (!!element && element.tagName.toUpperCase() === 'P' && element.parentElement) {
        element = element.parentElement;
      }

      let parent = element.parentElement;

      if (!!element && element.classList.contains('nodeLabel')) {
        while (parent && !parent.classList.contains('node')) {
          parent = parent.parentElement;
        }
      }

      if (!!parent && 'id' in parent && parent.classList.contains('node')) {
        const nodeId = parent.id.split('-').slice(2).slice(0, -1).join('-');
        if (nodeId) {
          const scenarioData = this.nodeScenarioMap.get(nodeId);
          if (scenarioData) {
            this.dialog
              .open(ScenarioChartPopupDialog, {
                panelClass: ['dialog'],
                data: { scenarioData: scenarioData, forceAll: !this.campaignMode }
              })
              .closed.subscribe({
                next: (result) => {
                  if (result) {
                    this.dialogRef.close();
                  }
                }
              });
          }
        }
      }
    });

    overlay.addTo(this.chart);

    const container = this.chart.getContainer();
    if (bindFunctions) {
      bindFunctions(container);
    }

    this.initializing = false;
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
          panelClass: ['fullscreen-panel', 'no-dialog-animations'],
          backdropClass: ['fullscreen-backdrop'],
          data: { edition: this.edition }
        });
      }, 1);
    }
  }

  openCampaignSheet() {
    if (!this.campaignSheet) {
      this.campaignSheet = true;
      this.dialog
        .open(PartySheetDialogComponent, {
          panelClass: ['dialog-invert'],
          data: { disableShortcuts: true }
        })
        .closed.subscribe({ next: () => (this.campaignSheet = false) });
    }
  }
}
