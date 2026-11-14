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

Store listing: Microsoft Edge Add-ons (submission in progress). A Chrome Web Store listing may follow later.

To run it unpacked, build it first (see [Build](#build)), then:

For Chrome, navigate to `chrome://extensions` and enable developer mode. Then use `load unpacked` to select the `deploy` folder as the extension directory.

For Edge, navigate to `edge://extensions/` and enable developer mode. Then use `load unpacked` to select the `deploy` folder as the extension directory.

For Firefox, navigate to `about:debugging` and enable `add-on debugging`. Then use `load temporary add-on` and select the `manifest.json` file within the `deploy` folder. If Firefox does not load the extension, you may need to replace the background object inside `source/manifest.json` with the following code.

```
"background": {
    "scripts": ["background.js"]
},
```

Moving from the original Sprucemarks: a store install is a separate extension, so set your options again (they are
few). Remove the original afterwards so the two don't sort at the same time.

## Build

Edit files in `source/`, then build them into `deploy/` with Node.js (no dependencies):

```
node build.js                    # build deploy/
node build.js --no-tests --zip   # store release: no test suite, zipped into dist/
```

`build.js` replaces Feri, the original build tool, which was unpublished from npm in 2026. Files and folders starting
with `-` are includes only; `.jss` files are templates using `<js>include(...)</js>` and `<js>write(...)</js>`. The
header of `build.js` describes the rules. `deploy/` is committed and is always the full build, test suite included.

## Development

How the code fits together: [ARCHITECTURE.md](ARCHITECTURE.md). Why the fork is set up this way: [DECISIONS.md](DECISIONS.md).

Use the `log` setting inside `source/js/shared.js` to enable or disable console logs for various events and operations.

## Test

From the background service worker, run `await test()` to use the test suite (not available in `--no-tests` builds).

## Privacy

Sprucemarks Continued collects no data. See [PRIVACY.md](PRIVACY.md).

## License

[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)

The original work was dedicated to the public domain by its author, and this fork keeps the same dedication.
