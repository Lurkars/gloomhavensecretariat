# Gloomhaven Secretary

[Latest Online Version](https://gloomhaven-secretary.de)

*Gloomhaven Secretary* is a **Gloomhaven companion app** and does bookkeeping of all entities values to gain more focus on gameplay. It is an open source web app made with [Angular](https://angular.io/).

As GHS is a web application no installation is required and it runs in every modern browser even on mobile, still it can also be [installed](#install).

For usage with multiple clients sharing the same game, the server component [Gloomhaven Secretary Server](https://github.com/Lurkars/ghs-server) is required. A public instance is available under `gloomhaven-secretary.de` port `8443` with `secure` option.

GHS is based on the look&feel of the original [Gloomhaven Helper](http://esotericsoftware.com/gloomhaven-helper) (by [Esoteric Software®](http://esotericsoftware.com)). Since GHH is discontinued and not available anymore, GHS should become a well maintained successor, implementing all functionality of GHH, many improvements and many more features. For a comparison of some popular apps, see [Comparison of Companion Apps](https://github.com/Lurkars/gloomhavensecretary/wiki/Comparison-of-Companion-Apps).

As open source software this is meant for the community to actively [contribute](#contributing) with ideas, suggestions and of course feedback. As I am not capable of good design/UX also feel free to contribute better assets. 

If you need help using the app take a look at the [help page](https://help.gloomhaven-secretary.de). It is not complete but should help with all general steps to use GHS properly.

> SPOILER WARNING:
> The `label-spoiler.json` files inside the `data`-folders and therefore the final edition data files in releases inside `./assets/data`-folder contain spoilers by including the corresponding label.

## Support me

☕ [Buy me a coffee?](https://ko-fi.com/lurkars)

## Current Features

- Feature complete for base GH, JOTL, FC and CS (all needs testing, so please [contribute](#contributing)!)
- Tracking:
  - **initiative** sorting
  - **health** automatic exhausting/dead, max values for every level
  - **conditions** automatic expire + automatic apply (wound, wound_x, regenerate, bane, poison, poison_x, ward, brittle)
  - **level**, **loot**, **experience** of Characters
  - **Character Progress** level, loot, experience, items, battlegoals, perks
  - **Character Attack Modifier Deck** including perks (for GH, FC & JOTL)
  - **Elements** automatic update state
  - **Monster Stats**
  - **Monster Standees**
  - **Monster Modifier Deck** addition of **Blesses** and **Curses**, auto-shuffling
  - **Monster Ability Cards** auto-shuffling, calculated values (separated for normal and elite)
  - **Character Summons**
  - **Scenarios** and **Sections** with automatic level calculation, special rules reminder and scenario finish for applying character progress
  - **Party Sheet**
  - **Campaign Management**
  - **Markers**
- Eliminating the following physical components:
  - monster ability cards
  - monster stats sheets
  - monster attack modifier deck
  - damage tokens
  - condition tokens
  - element board, element discs, round tracker, initiative tracker
  - character HP/XP dials
  - character boards
  - character sheets
  - character attack modifier deck (perks for CS missing)
  - party sheet
- Other features:
  - i18n support (currently en, de and fr, more translations required. Big thanks to [@Boomchil](https://github.com/Boomchil) for french translations!)
  - PWA for installation on all devices!
  - Synchronize state (+ settings) with [GHS Server](https://github.com/Lurkars/ghs-server)
  - Permission management for different clients with [GHS Server](https://github.com/Lurkars/ghs-server)
  - load custom JSON edition data for custom content!
  - edit Monster Attack Modifier and Monster Ability decks (support for Diviner class mechanics): reveal cards, remove cards, re-order cards
  - [Monster data editor](https://gloomhaven-secretary.de/editor/monster)
  - includes Solo Scenarios for GH, FC and CS
  - includes [Blood and Sand](https://boardgamegeek.com/thread/2613617/blood-and-sand-gloomhaven-campaign-set-red-desert) campaign: can be enabled under *Data Management* (Big thanks to [/u/Calm_Construction131](https://www.reddit.com/user/Calm_Construction131) for contribution)
  - includes [Seeker of Xor](https://boardgamegeek.com/thread/2220121/seeker-xorn-bonus-content) campaign: can be enabled under *Data Management*
  - manage multiple parties (on party sheet while no active scenario set)
  - <details>
      <summary>SPOILER WARNING: Envelope X</summary>

      > To add Envelope X, add the following Edition Data Url under *Data Management* `./assets/data/gh-envx.json` and enable it.
    </details>

### Short term plans

- validation of all existing data
- FH style (WIP)
- support for CS AM decks
- support for managing character ability cards

### Long term plans

- FH data (as soon as available)

## Install

### Progressive Web App

You can always install any hosted version as PWA if your OS/Browser supports installation of PWA. For example here is the [Latest Online Version](https://gloomhaven-secretary.de) or latest version on [GitHub Pages](https://lurkars.github.io/gloomhavensecretary/).

### Standalone

An Electron app is provided for Linux, Mac and Windows.
Download the corresponding files from the [latest release](https://github.com/Lurkars/gloomhavensecretary/releases/latest) assets.

> only tested Linux AppImage for now

### Selfhost

To selfhost *Gloomhaven Secretary* on your webserver, simple download the zip file from the [latest release](https://github.com/Lurkars/gloomhavensecretary/releases/latest) and unzip to your webserver.

> The base url for this build is set to root. To use a different base url please [build your own package](#build-from-source).

#### Build and run using Docker

If you want to use docker for running on port 80 execute following:

```shell
docker build -t gloomhavensecretary .
docker run --rm -p 80:80 gloomhavensecretary
```

For usage with docker compose, simple run `docker compose up -d`.

## Build from source

If you want to create you own custom build (for example to [selfhost](#selfhost)), prepare a [development setup](#development). Afterwards run `npm run build` ([available options](https://angular.io/cli/build#options)) and access build under `./dist/gloomhavensecretary`.

## Development

Prerequisite:

- up-to-date [Node.js](https://nodejs.org) and npm version

Checkout the source code with `git clone https://github.com/Lurkars/gloomhavensecretary.git`.

Install dependencies with `npm install`.

Afterwards run `npm run start` to create a development server at [http://localhost:4200](http://localhost:4200).

For development with docker, install docker compose and run `docker compose -f docker-compose.dev.yaml up -d`.

## Contributing

Feel free to file a [new issue](https://github.com/Lurkars/gloomhavensecretary/issues/new/choose) for bugs, features, improvements, help or feedback.

All game data is inside the [data](./data/) folder with subfolders for every edition. A review of all data by a third person would be awesome. As all files are JSON data it should be easily human readable. Every character, monster and monster deck has it's own file, so it should be easy to check.
Every edition folder get concatenated to a single edition data file on build.

Also pull requests are welcome!

## Privacy

This app does NOT collect ANY personal data. Everything runs and stays in your browser/local storage. For usage of the server component please go to [Gloomhaven Secretary Server#Privacy](https://github.com/Lurkars/ghs-server#privacy).

## Copyright / License

Gloomhaven and all related properties, images and text are owned by [Cephalofair Games](https://cephalofair.com).

Assets/Data used:

- [Creator Pack by Isaac Childres](https://boardgamegeek.com/thread/1733586/files-creation) CC BY-NC-SA 4.0
- [Worldhaven](https://github.com/any2cards/worldhaven)
- [FrosthavenAssistant](https://github.com/Tarmslitaren/FrosthavenAssistant)
- [Gloomhaven Item DB](https://github.com/heisch/gloomhaven-item-db)
- [Haven Keeper](https://github.com/PrimalZed/haven-keeper)
- some other assets used are public domain licensed

Source code is licenced under [AGPL](/LICENSE)

## Personal disclaimer

This is a hobby project I do in my free-time. The software provides a practical need due to the end of the original Helper app and so I completely follow the **Quick'n'Dirty** approach to get things fast done. This leads of course to a lack of quality and testing and the code base does definitely not comply with my profession.
