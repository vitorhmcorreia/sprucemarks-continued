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
code. Zips go to the git-ignored `dist/`.

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
install stays bookmarks + storage only.

## D9. No ClarifyDoc snapshot in the repo (2026-11-14)

The user was trying ClarifyDoc, which kept a one-time map of files and symbols in `.clarifydoc/` (self-ignored by git).
Codegraph already gives the same map, and keeps it current as files change, so the folder was deleted. `.codegraph/` is
git-ignored.
