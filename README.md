# Gloomhaven Secretary

[Latest Online Version](https://lurkars.github.io/gloomhavensecretary/)

An open source [Gloomhaven Helper](http://esotericsoftware.com/gloomhaven-helper) (by [Esoteric Software®](http://esotericsoftware.com)) clone made as web app with Angular. *Gloomhaven Secretary* is a companion app and does basically bookkeeping of all entities values to gain more focus on gameplay.

This is basically a clone implementing the same functionality and look&feel of the original Gloomhaven Helper since I am not capable of good design/UX. So feel free to contribute better assets.

For usage with multiple clients sharing the same game, the server component [Gloomhaven Secretary Server](https://github.com/Lurkars/ghs-server) is required. A public instance is available under `ghs.champonthis.de/server` port `443` with `secure` option.

> SPOILER WARNING:
> The `label.json` files inside the `data`-folder and therefore the final edition data files inside the `src/assets/data`-folder contain spoilers by including the corresponding label.

## Current Features

- Feature complete for base GH and JOTL (mostly complete for FC, only Diviner mechanics missing)
- Tracking:
  - **initiative** sorting
  - **health** automatic exhausting/dead, max values for every level
  - **conditions** automatic expire
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

## Missing / Upcoming

- monster/scenario data of FH, CS (WIP)
- upgradable/stackable conditions (WIP)
- tools like monster editor to create/update monster stats and abilities via UI (WIP)
- goals ~~and section~~ mechanic
- ~~i18n/icons for custom actions~~
- ~~i18n support~~
- ~~summons~~
- ~~standalone app with Electron\/PWA~~
- ~~releases for easier self hosting~~
- ~~server part to sync states~~
- ~~load (JSON-)data from URL, so easier custom content integration~~

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

Also pull requests are welcome!

## Copyright / License

Gloomhaven and all related properties, images and text are owned by [Cephalofair Games](https://cephalofair.com).

Assets used:

- [Creator Pack by Isaac Childres](https://boardgamegeek.com/thread/1733586/files-creation) CC BY-NC-SA 4.0
- [Worldhaven](https://github.com/any2cards/worldhaven)
- [Haven Keeper](https://github.com/PrimalZed/haven-keeper)
- some other assets used are public domain licensed

Source code is licenced under [AGPL](/LICENSE)

## Personal disclaimer

This is a hobby project I do in my free-time. The software provides a practical need due to the end of the original Helper app and so I completely follow the **Quick'n'Dirty** approach to get things fast done. This leads of course to a lack of quality and testing and the code base does definitely not comply with my profession.
