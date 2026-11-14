# Sprucemarks Continued

A web browser extension that automatically sorts your bookmarks by title, date, or URL.

**Sprucemarks Continued is an unofficial community fork of [Sprucemarks](https://github.com/nightmode) by Kai Nightmode.**
The original was archived in August 2026, removed from the browser stores on November 1, 2026, and dedicated to the
public domain under CC0. This fork exists to keep it working and available. It is not affiliated with or endorsed by
the original author.

## Navigation

* [Install](#install)
* [Build](#build)
* [Development](#development)
* [Test](#test)
* [Privacy](#privacy)
* [License](#license)

## Install

### From the Microsoft Edge Add-ons store

In review (submitted November 14, 2026). The link will appear here once it is published. Store installs update automatically.

### Manually, in Chrome, Edge, Brave, Opera or Vivaldi

Use this if you're on Chrome (there's no Chrome Web Store listing yet) or you'd rather not use a store.

1. Download `sprucemarks-continued-<version>.zip` from the latest release on the [Releases page](https://github.com/vitorhmcorreia/sprucemarks-continued/releases).
2. Unzip it into a folder you'll keep, for example `Documents/Sprucemarks Continued`. The browser loads the extension
   from that folder every time it starts, so don't delete or move it.
3. Open the extensions page: `chrome://extensions` (Chrome, Brave, Vivaldi), `edge://extensions` (Edge) or
   `opera://extensions` (Opera).
4. Turn on **Developer mode** (a switch at the top right, or in the left sidebar in Edge).
5. Click **Load unpacked** and pick the folder from step 2 (the one with `manifest.json` in it).
6. Optional: pin it from the extensions (puzzle piece) menu so the toolbar icon stays visible.

Good to know:

- **No automatic updates.** To be told about new versions, click **Watch → Custom → Releases** on the GitHub repo.
  To update, unzip the new release over the same folder (replace the files), then click the reload arrow on the
  extension's card. Keep the same folder path: the browser ties your options to it, so a new path starts with defaults.
- **Developer mode warnings.** Some browsers show a reminder about developer-mode extensions at start-up. It's
  expected for anything loaded this way; you can dismiss it.
- **Coming from the original Sprucemarks?** Remove it once this one is running, so the two don't both sort, then set
  your options again (there are only a few).

### Firefox

Not packaged for Firefox yet. For testing, open `about:debugging`, choose **This Firefox → Load Temporary Add-on**, and
select `manifest.json` in the unzipped folder. Firefox removes temporary add-ons when it closes. If it refuses to load,
replace the `background` object in `manifest.json` with:

```
"background": {
    "scripts": ["background.js"]
},
```

### From a clone (developers)

Clone the repo and load the `deploy/` folder unpacked, as in the manual steps above. It's always built and committed.

## Build

Edit files in `source/`, then build them into `deploy/` with Node.js (no dependencies):

```
node build.js                    # build deploy/
node build.js --no-tests --zip   # store release: no test suite, logging off, zipped into dist/
```

`build.js` replaces Feri, the original build tool, which was unpublished from npm in 2026. Files and folders starting
with `-` are includes only; `.jss` files are templates using `<js>include(...)</js>` and `<js>write(...)</js>`. The
header of `build.js` describes the rules. `deploy/` is committed and is always the full build, test suite included.

Releases are published by pushing a version tag; the steps are in [ARCHITECTURE.md](ARCHITECTURE.md#build-and-release).

## Development

How the code fits together: [ARCHITECTURE.md](ARCHITECTURE.md). Why the fork is set up this way: [DECISIONS.md](DECISIONS.md).

Use the `log` setting inside `source/js/shared.js` to enable or disable console logs for various events and operations
(release builds turn it off automatically).

When something feels slow, open **About → Troubleshooting → Timing**: it lists how long recent Tools scans, drawing and
sorting took (slowest first). **Copy Information** includes it, for a bug report.

## Test

Run the test suite in a headless browser (Edge or Chromium; set `BROWSER=` to pick one):

```
node build.js && node test/run-tests.js
```

Or, with the extension loaded unpacked, run `await test()` in its service worker console (not available in
`--no-tests` builds). CI runs the suite on every push.

## Privacy

Sprucemarks Continued collects no data. See [PRIVACY.md](PRIVACY.md).

## License

[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)

The original work was dedicated to the public domain by its author, and this fork keeps the same dedication.
