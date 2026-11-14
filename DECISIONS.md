# Decisions

Why the fork is the way it is. Newest last. Each entry: what was decided, why, and what else was considered.

## D1. Publish as "Sprucemarks Continued", credited, marked not affiliated (2026-11-14)

The original Sprucemarks (Kai Nightmode) was archived on 2026-08-28 and removed from GitHub and the stores on
2026-11-01, with the code dedicated to the public domain (CC0). CC0 frees the code but explicitly does not waive
trademark (LICENSE, section 4a), and store reviewers reject listings that look like they impersonate another
extension. So the fork keeps a recognisable name for existing users, adds "Continued", and says "unofficial community
fork, not affiliated with or endorsed by the original author" in the README, the About page and the store listing.

Considered: keeping plain "Sprucemarks" (likely to be read as impersonating the original, and confusing if the author
ever returns); a completely new name with "fork of Sprucemarks" in the description (safest in review, but harder for
existing users to find).

## D2. `short_name` stays "Sprucemarks" (2026-11-14)

`short_name` is only used where space is tight (about 12 characters); "Sprucemarks Continued" would be cut off. The
full `name` carries the fork identity everywhere else.

## D3. Edge Add-ons first, Chrome Web Store later (2026-11-14)

Microsoft's developer account is free; Google's costs a one-time $5, which the user doesn't want to pay for now. The
package is the same for both, so adding Chrome later only needs the listing. Firefox (AMO, also free) is possible later
but needs the background-script variant noted in the README.

## D4. Replace Feri with a small `build.js` (2026-11-14)

Feri, the original build tool, was unpublished from npm on 2026-08-24, so the project could no longer be built. Its
use here was small: copy files, skip `-` includes, and render `.jss` templates with `include()`/`write()`. `build.js`
(no dependencies, about 80 lines) reproduces exactly that, and was checked by rebuilding the last original commit and
comparing with its committed `deploy/`: byte-identical. One difference showed up and was fixed: copied files kept the
source's executable bit.

Considered: running Feri from an old copy or mirror (an unmaintained dependency we'd have to carry anyway); moving to a
bundler such as esbuild or Vite (rewrites every template, adds dependencies, no benefit for a plain extension); dropping
the templates and editing the 24 generated pages by hand (error-prone, six copies of every page).

## D5. `deploy/` stays committed with the test suite; store zips are built without it (2026-11-14)

Keeping `deploy/` in git means anyone can load the extension unpacked straight from a clone with no build step, as the
original did, and `git diff deploy/` shows what a source change really produced. The test suite stays in that build so
`await test()` works during development, while `--no-tests --zip` makes the store package smaller and free of test
code. Zips go to the git-ignored `dist/`, and a `--no-tests` build goes to `dist/package/`, never `deploy/` (the
first store build overwrote `deploy/` without the tests until this was fixed, 2026-11-14).

## D6. The one-time upgrade message becomes the fork notice (2026-11-14)

The original's last upgrade message was the "final version, download your own copy" warning, which is wrong for the
fork. It now explains the fork and has a Continue button, and `check_version` was raised to the fork's first version so
people who load the new build over the old unpacked folder see it once. A store install has a new extension ID, so it
counts as a fresh install and shows the usual toolbar tips instead; no migration of options from the old extension is
possible (storage is per extension) or needed (there are few options).

## D7. Keep the original changelog as history (2026-11-14)

The About page keeps every original changelog entry under "Before the fork", after a new "About This Fork" section and
the fork's own entries. It credits the original work and explains features users remember. Entries about the original's
Patreon account and server describe things the current code doesn't have; they are left as history, not removed.

## D8. Dead-link checker waits until the Edge listing is live (2026-11-14)

It is the first planned feature, but it needs host access to fetch arbitrary URLs. That widens the permissions,
changes the privacy answers and makes store review stricter. Publishing the plain rebrand first keeps the first review
simple. When it is built: ask for hosts through `optional_host_permissions` at the moment the user runs it, so the base
install stays bookmarks + storage only. The design is in [docs/dead-link-checker.md](docs/dead-link-checker.md) (written
2026-11-14; it also records why it lives in the Tools page rather than in a separate extension).

## D9. No ClarifyDoc snapshot in the repo (2026-11-14)

The user was trying ClarifyDoc, which kept a one-time map of files and symbols in `.clarifydoc/` (self-ignored by git).
Codegraph already gives the same map, and keeps it current as files change, so the folder was deleted. `.codegraph/` is
git-ignored.

## D10. New icon: original trees, spruce green, with a teal "continued" arrow badge (2026-11-14)

Users who had the original installed, and store reviewers, should see at a glance that this is a different extension.
Each icon keeps the original art (so it's still recognisably Sprucemarks) and adds a small teal disc with a circular
arrow in the bottom-right corner, cut out of the art by a transparent ring so it reads on light and dark toolbars. The
store/manifest icon also turns from grey to spruce green. The icons are generated by `art/make-icons.js` from the
untouched originals in `art/original/` (each size from its own hand-tuned original), so they can be regenerated
without stacking badges. The page header logo first stayed the original grey shape; on 2026-11-14 the user asked for it
to match, so `art/make-icons.js` now also writes `source/images/-logo.svg` (green, with the badge, colours fixed in the
SVG instead of set by the theme CSS; the back tree is lightened in the dark theme, where dark green disappears).

Considered: badge only (grey store icon too close to the original at a glance); green only (toolbar icons would be
identical to the original's); a completely new drawing (loses recognition for existing users). The toolbar's own
badge area, also bottom-right, is unused: `badge_set` always sets empty text.

## D11. Repo renamed to `sprucemarks-continued` (2026-11-14)

The repo name now matches the extension, so links in the manifest (`homepage_url`), About page and privacy policy
say what users installed. GitHub redirects the old `vitorhmcorreia/sprucemarks` URLs. The local folder is renamed
separately, after a session, because it changes the path Claude Code, codegraph and claude-hivemind know the project by.

## D12. Manual installs come from GitHub Releases (2026-11-14)

With only an Edge listing (D3), Chrome users and anyone avoiding stores need another way in. Each version gets a
GitHub Release with the same zip that goes to the store (`node build.js --no-tests --zip`), and the README walks
through unzip → Developer mode → Load unpacked. That needs no git or Node, and the zip is identical to what the store
reviews. Downsides, stated in the README: no automatic updates (users can watch releases) and options are tied to
the folder path.

Considered: pointing users at "clone the repo" or GitHub's Download ZIP (needs git, or pulls the whole repo with
sources and docs, and the folder to pick is less obvious); a self-hosted update URL for Chrome (Chrome only allows
that for enterprise-managed or store installs, so it doesn't help).

## D13. Store images are generated from the real extension and kept in the repo (2026-11-14)

`store/make-store-assets.js` loads the built `deploy/` into a throwaway headless Edge profile seeded with made-up
favorites of public websites, drives it over the DevTools protocol, and writes six 1280×800 screenshots plus the
300×300 logo and both promotional tiles. The listing text, search terms and certification notes sit next to them in
`store/listing.md`. Each release can refresh the screenshots in one command, they always show the current UI, and the
same files will serve a Chrome listing later. Category: Productivity.

Considered: hand-made screenshots of the user's own browser (shows real favorites and isn't repeatable); generating
the copy with Partner Center's "Generate with AI" (it can't know about the fork wording D1 requires). Gotchas found
while building it: a background tab can't be captured (the extension's first-install tab takes focus, so the script
brings its tab to the front), `Page.captureScreenshot`'s `clip` uses page coordinates and breaks scrolled shots, and
pages must be waited on until `#content` is visible rather than for a fixed time.

## D14. Release builds turn debug logging off automatically (2026-11-14)

`source/js/shared.js` has `'log': true` with a comment saying to set it to false before publishing, and the archived
original shipped with it on, so the first store build did too (harmless: only the extension's own console sees it).
Instead of remembering to flip it, `node build.js --no-tests` (the store build) rewrites it to false, and fails if the
line ever changes shape. `deploy/` keeps logging on for development.

Considered: setting it to false in the source (then every developer has to turn it back on, and the test suite's
warning about it is the only reminder); a separate build flag (one more thing to forget; the store build is exactly
when it must be off).

## D15. CI runs the real test suite; releases are made by pushing a tag (2026-11-14)

`.github/workflows/ci.yml` runs on every push and pull request: `deploy/` must equal what `build.js` makes from
`source/` (so the committed build can't drift from the code), the release build must come out without tests and with
logging off, and the extension's own 115-test suite runs in headless Chrome with the extension loaded and sample
favorites (`test/run-tests.js`). `.github/workflows/release.yml` runs on a `v<version>` tag: it checks the tag matches
the manifest version, repeats the checks, builds the store zip and publishes the GitHub Release with the annotated
tag's message as the notes. Releasing becomes bump, commit, tag, push, and the zip on GitHub is always the one CI built.

The browser is Chrome for Testing, installed with `@puppeteer/browsers`, because branded Chrome ignores
`--load-extension` since version 137. Locally the same runner uses Edge.

Considered: CI without the browser tests (cheaper, but the only real tests are the in-browser ones); Playwright
(a large dependency for one script; the DevTools protocol over Node's built-in WebSocket is enough); keeping releases
manual with `gh release create` (works, but the zip then comes from whoever's machine, and steps get skipped).
