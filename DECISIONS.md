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

Update 2026-11-28: the user paid the Chrome fee after all; the Chrome Web Store listing (submitted 2026-11-27, D22) is
live since 2026-11-28. Both stores get the same zip each release.

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
same files will serve a Chrome listing later (they didn't quite: see D22). Category: Productivity.

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

## D16. Features are built on a branch and merged through a pull request (2026-11-14)

Each feature gets a short-lived branch (`feature/<name>`) off `main`, a pull request so CI tests every push, and is
merged when tried out; releases stay tags on `main` (D15). `main` therefore stays releasable while a feature is half
built: if the version in store review is rejected, or a small fix must ship, it goes out from `main` without the
unfinished work. The user also wanted to learn the branch, commit, pull request, merge cycle.

Considered: git-flow (permanent `main` + `develop`, plus feature, release and hotfix branches). It suits teams with
release trains and several supported versions; here it would add a second long-lived branch to keep in sync and
release branches the tag-driven workflow doesn't need. Committing straight to `main` (fine alone, but then unfinished
work blocks every release). Note for merges: `deploy/` is generated, so a conflict there is fixed by running
`node build.js` and committing the result, never by hand.

## D17. Dead Links is its own page; only "not found" is pre-selected (2026-11-14)

The user has more than 5,000 favorites and the Tools page is sometimes slow on them, because it rescans the whole tree
for duplicates, similar and empty folders whenever it opens. The checker was moved from a Tools section to its own
page so opening Tools never involves it and a check that takes minutes has a tab of its own.

The user also pointed out that pre-selecting "unreachable" results would let a short Wi-Fi drop tick many good
favorites for removal. Now only "not found" (a server answered that the page is gone) is pre-selected; the check pauses
while the browser is offline, and every unreachable address is checked once more at the end.

Considered: keeping it in Tools but lazy-loaded (still shares the page with the slow scans); pre-selecting
unreachable after two failures (a drop longer than the retry gap defeats it).

## D18. A timing log, kept locally and shown in Troubleshooting (2026-11-14)

The user's 5,252 favorites sometimes make the Tools page struggle, not always. The original only had a verbose
development log (every event printed to the console, off in store builds, D14), which says nothing about where time
goes. So the extension now records how long each step takes: reading the tree and each Tools finder (on open and on
every refresh, with how many favorite changes came in since the last refresh), drawing each Tools section, and full
sorts. The newest 200 timings are saved in local storage (they survive the service worker stopping) and summarized on
the About page, per step: runs, average, slowest, last, with Copy Information including it for bug reports.

Measured first with 5,252 generated favorites (`test/browser.js` takes any collection): Tools opens in about 0.25 s,
a refresh takes about 0.1 s, a full sort up to 2.6 s. That did not reproduce the slowness, so the fix waits for timings
from the real collection rather than guessing.

Considered: the existing verbose log (too noisy to read, and off for users); the browser's DevTools performance
profiler (precise, but only if it is recording at the moment it happens, and "sometimes" means it usually isn't);
sending timings anywhere (no: nothing leaves the browser, PRIVACY.md).

## D19. "Find similar" groups addresses in one pass instead of comparing every pair (2026-11-14)

The timing log (D18) on the user's real collection (4,347 bookmarks) showed the Tools scan at about 0.5 s, 90% of it
in "find similar" (about 450 ms; 12–21 ms on evenly spread generated data). Tools reruns that scan after every favorite
change, up to twice a second, so a burst of changes (sync, import, sorting) kept it busy most of the time. The cause:
favorites are grouped by site + path (all YouTube videos are `www.youtube.com/watch`), and for every address the old code
re-parsed every other address in its group and compared whole groups as strings, so cost grew with the square of the
group size.

"Similar" only depends on user name, password and port class (none/80/443 count as one), which makes it an equivalence:
each address can go straight into a bucket keyed by those three, in one pass, with Sets and a direct lookup replacing
the array searches. Checked against the old implementation on 25 generated collections with large groups plus edge cases:
identical output (groups, numbering, order, fields); 144 ms to 10 ms per scan on this machine. A test now pins the
grouping of a known tree (`function_tool_similar_bookmarks_find_groups`).

Considered: rescanning less often (longer throttle, or only when Tools is visible): still slow per scan, and the list
would lag behind changes; caching results between scans and updating them per change: more state to keep correct for
a scan that is now cheap enough to just rerun.

## D20. The About page shows the git commit, from a git-ignored build-info.json (2026-11-14)

The user tests branches on more than one machine and wanted to see which "version" is loaded; the manifest version
doesn't change between commits. `build-info.json` (commit, branch or tag, commit date, uncommitted changes) is written
next to the manifest by `node build.js`, and after every switch, pull or rebase by a line that `sh .githooks/install`
adds to the clone's own post-checkout, post-merge and post-rewrite hooks, for machines without Node. The installer
appends instead of setting `core.hooksPath`: that setting replaces the whole hooks folder and would silently switch off
any other hook, such as a pre-commit scan for personal data (caught when the first version tried to use it).
The first appending installer (merged in #3) left new or empty hooks without the line, because `grep -v` exits 1
when nothing is left and that skipped the copy; About kept showing the branch from the moment the installer ran. Fixed
in #4, together with `test/hooks-install.sh`, which checks the hook files and that a switch and a merge really
rewrite the file (it fails 7 of 13 checks on the old installer), and now runs in CI. Bringing `main` into the
Dead Links branch then showed that a merge finished by hand (after resolving conflicts) runs `post-commit`, not
`post-merge`, so the installer also adds the line to `post-commit`, which keeps About current after any commit. In `deploy/` it
is git-ignored; store zips and GitHub releases include it, so a store install shows the exact commit it came from.

Considered: committing the commit ID in `deploy/` (a commit can't contain its own ID; writing the previous one would
change `deploy/` on every build, break CI's deploy check and conflict on every merge); putting it in the manifest
version (store versions must be numeric and increase); reading `.git` at runtime (an extension can only read files
inside its own folder).

## D21. Dead Links paces requests per site and backs off when a site says "slow down" (2026-11-14)

The user asked whether a long check could make their traffic look like a bot. Across many different sites the checker
was already gentle, but many favorites on one site meant up to 4 requests a second to it for minutes; for Google search
result pages that can trigger the "unusual traffic" CAPTCHA for the user's whole connection. Now: 1.5 s between requests
to the same site (from 0.25 s), at most 5 new requests a second overall, and a 429 or 503 pauses that site (its
`Retry-After`, or 60 s doubling, capped at 10 minutes) and retries the address later, up to twice, without the
follow-up GET it used to send straight away. Checked against a local server that rate-limits: one request per try,
paused in between, the right results.

Considered: a fixed long gap for every request (makes 5,000 favorites take hours for no benefit on sites with one
favorite); skipping search-result URLs entirely (they can be dead too, and pacing solves it); a user-adjustable speed
setting (one more option to understand; the defaults are safe).

Confirmed on the user's collection the same day: rechecking with the new pacing, YouTube no longer appeared under
"Couldn't verify", "Server error" or "Timed out". The recheck also showed YouTube "moves" that only added
`?cbrd=1&ucbcb=1` (its no-consent-cookie markers, since checks send no cookies): a redirect to the same page that only
adds parameters now counts as OK, a redirect to a cookie-consent page has its own result without "Update address",
and the Update button re-applies the current rule so results saved earlier can't add that noise to a favorite.

## D22. The Chrome listing gets its own images, taken in Chrome (2026-11-27)

D13 assumed the Edge images would serve a Chrome listing too, but the options page draws each browser's own folder
names and pictures: in Edge the screenshots show "Favorites bar", in Chrome "Bookmarks Bar". Edge wording in a Chrome
listing reads as a port and invites reviewer questions, so `make-store-assets.js chrome` takes the same screenshots in
Chrome for Testing and writes them, tiles saying "bookmarks" and the 128×128 store icon Google requires (96×96 artwork,
16 px padding) to `store/chrome/`, next to its own `listing.md` (the listing text reworded from favorites to bookmarks,
plus the fields only Chrome asks for: single purpose, host-permission justification, data-usage answers, test
instructions). Prepared before the account exists, so submitting is paste-and-upload once the $5 fee is paid (D3).

Considered: reusing the Edge screenshots (they show Edge UI); one shared listing file with both stores' text (the two
dashboards ask different questions and the wording differs throughout). Gotcha: on the user's machine
`@puppeteer/browsers@2.3.0 install chrome@stable` (Chrome 158) unpacked a truncated 308 MB `chrome` that segfaults
("missing section headers"); the downloaded zip was intact, and unzipping it by hand works.
