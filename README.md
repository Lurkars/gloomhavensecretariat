# Gloomhaven Secretary

[Latest Online Version](https://lurkars.github.io/gloomhavensecretary/)

*Gloomhaven Secretary* is a **Gloomhaven companion app** and does bookkeeping of all entities values to gain more focus on gameplay. It is an open source web app made with [Angular](https://angular.io/).

GHS is basically a full clone with the same functionality and look&feel of the original [Gloomhaven Helper](http://esotericsoftware.com/gloomhaven-helper) (by [Esoteric Software®](http://esotericsoftware.com)). Since GHH is discontinued and not available anymore, GHS should become a well maintained successor.

As open source software this is meant for the community to actively [contribute](#contributing) with ideas, suggestions and of course feedback. As I am not capable of good design/UX also feel free to contribute better assets.

For usage with multiple clients sharing the same game, the server component [Gloomhaven Secretary Server](https://github.com/Lurkars/ghs-server) is required. A public instance is available under `ghs.champonthis.de/server` port `443` with `secure` option.

> SPOILER WARNING:
> The `label.json` files inside the `data`-folders and therefore the final edition data files inside the `src/assets/data`-folder contain spoilers by including the corresponding label.

## Support

☕ [Buy me a coffee?](https://ko-fi.com/lurkars)

## Current Features

- Feature complete for base GH, JOTL, FC and CS (all needs testing, so please [contribute](#contributing)!)
- Tracking:
  - **initiative** sorting
  - **health** automatic exhausting/dead, max values for every level
  - **conditions** automatic expire + automatic apply (wound, wound_x, regenerate, bane, poison, poison_x, ward, brittle)
  - **level**, **loot**, **experience** of Characters
  - **Elements** automatic update state
  - **Monster Stats**
  - **Monster Standees**
  - **Monster Modifier Deck** addition of **Blesses** and **Curses**, auto-shuffling
  - **Monster Ability Cards** auto-shuffling, calculated values (separated for normal and elite)
  - **Character Summons**
  - **Scenarios** and **Sections**
  - **Markers** (currently Hatchet only)
- Eliminating the following physical components:
  - monster ability cards
  - monster stats sheets
  - monster attack modifier deck
  - damage tokens
  - condition tokens
  - element board, element discs, round tracker, initiative tracker
  - character HP/XP dials
  - character boards
- Other features:
  - i18n support (translations required!) for everything!
  - PWA for installation on all devices!
  - Synchronize state (+ settings) with [GHS Server](https://github.com/Lurkars/ghs-server)!
  - load custom JSON edition data for custom content!

### Short term plans

- validation of all existing data
- improve code base (many repeated component for now for figures/entities)
- improve mobile experience
- start with FH data
- tools like monster editor to create/update monster stats and abilities via UI (WIP)

### Long term plans

- support for managing character (ability cards, perks, attack modifier deck, items)
- FH style

## Install

### Progressive Web App

You can always install any hosted version as PWA if your OS/Browser supports installation of PWA. For example here is the [Latest Online Version](https://lurkars.github.io/gloomhavensecretary/) on GitHub Pages.

### Standalone

An Electron app is provided for Linux, Mac and Windows.
Download the corresponding files from the [latest release](https://github.com/Lurkars/gloomhavensecretary/releases/latest) assets.

> only tested Linux AppImage for now

### Selfhost

To selfhost *Gloomhaven Secretary* on your webserver, simple download the zip file from the [latest release](https://github.com/Lurkars/gloomhavensecretary/releases/latest) and unzip to your webserver.

> The base url for this build is set to root. To use a different base url please [build your own package](#build-from-source).

## Build from source

If you want to create you own custom build (for example to [selfhost](#selfhost)), prepare a [development setup](#development). Afterwards run `npm run build` and access build under `./dist/gloomhavensecretary`.

## Development

Prerequisite:

- up-to-date [Node.js](https://nodejs.org) and npm version

Checkout the source code with `git clone https://github.com/Lurkars/gloomhavensecretary.git`.

Install dependencies with `npm install`.

Afterwards run `npm run start` to create a development server at [http://localhost:4200](http://localhost:4200).

## Contributing

Feel free to file a [new issue](https://github.com/Lurkars/gloomhavensecretary/issues/new/choose) for bugs, features, improvements, help or feedback.

All game data is inside the [data](./data/) folder with subfolders for every edition. A review of all data by a third person would be awesome. As all files are JSON data it should be easily human readable. Every character, monster and monster deck has it's own file, so it should be easy to check.
Every edition folder get concatenated to a single edition data file on build.

Also pull requests are welcome!

## Copyright / License

Gloomhaven and all related properties, images and text are owned by [Cephalofair Games](https://cephalofair.com).

Assets/Data used:

- [Creator Pack by Isaac Childres](https://boardgamegeek.com/thread/1733586/files-creation) CC BY-NC-SA 4.0
- [Worldhaven](https://github.com/any2cards/worldhaven)
- [FrosthavenAssistant](https://github.com/Tarmslitaren/FrosthavenAssistant)
- [Haven Keeper](https://github.com/PrimalZed/haven-keeper)
- some other assets used are public domain licensed

Source code is licenced under [AGPL](/LICENSE)

## Personal disclaimer

This is a hobby project I do in my free-time. The software provides a practical need due to the end of the original Helper app and so I completely follow the **Quick'n'Dirty** approach to get things fast done. This leads of course to a lack of quality and testing and the code base does definitely not comply with my profession.
