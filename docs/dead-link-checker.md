# Design: dead-link checker

Status: **merged** into `main` (pull request #1, 2026-11-14) after a try-out on a real 4,288-favorite collection; ships
in 2026.11.14.2 (released 2026-11-14; first numbered 2026.11.15.0 by mistake, re-released under the release date before reaching the store). DECISIONS D8, D16, D17,
D21. Code: `source/js/dead-links.js` (pure logic, tested), `source/js/page/dead-links-tool.js`
(checking and display), `source/js/page/dead-links.js` (page start-up), `source/page/-dead-links.html.jss`.

## Goal

Find favorites whose pages no longer exist, and let the user review and remove them, the same way the existing
tools handle empty folders, duplicates and similar favorites. It must never remove anything on its own, and it must
never call a page dead when it's only slow, blocking bots, or behind a login.

## Where it lives

Its own **Dead Links** page in the navigation, next to Tools (changed from a Tools section on 2026-11-14, D17). The
Tools page runs its duplicate, similar and empty-folder scans every time it opens, which is already slow on very large
collections; a separate page keeps the checker out of that, never starts anything on its own, and gives a long check a
tab of its own. The page has a description, the skip-local option, a status line, a results table (Title, Location,
URL, Result, Select), **Check Links**, **Recheck Problems**, **Stop**, **Select All** and **Remove Selected (n)**
buttons, and a **Start over** link. Select All ticks every row in the table (respecting the filters) and turns into
Select None. Start over (asked for by the user, 2026-11-14) forgets results, ticks, the last-run line and the ignore list,
after a confirmation that says how much; favorites are never touched. A **Show** list filters the table by result
("Not found (12)", …; only results that occur, with counts) and a **Site** list by site within that result, busiest
first ("youtube.com (38)"; www. is ignored), to see which sites refuse or rate-limit checks. Rows filtered out are
unticked, so Remove Selected only removes favorites the user can see (same rule as the Tools page). No separate
extension (discussed 2026-11-14): cleaning up favorites is the extension's single purpose, and a second listing would
double the upkeep.

## Permissions: ask only when used

- Add `"optional_host_permissions": ["http://*/*", "https://*/*"]` to the manifest. Required permissions stay
  `bookmarks` and `storage`, so installing or updating asks for nothing new, and store review sees no broad host access.
- Clicking **Check Links** calls `browser.permissions.request({ origins: [...] })` (it must come from that click). If
  the user declines, show one line explaining why the access is needed and leave everything else working.
- A **Revoke website access** link calls `browser.permissions.remove`, for anyone who wants it gone after a check.
- Check Links never fails silently: if the request is refused (for example "Only permissions specified in the
  manifest may be requested", which happens when an older manifest is still loaded after a branch switch), the status
  line says so and suggests reloading the extension.
- The extension's own `browser` polyfill (`js/browser-polyfill.js`) only wraps the APIs it uses, so `permissions` and
  `bookmarks.update` were added to it.

## Where the checking runs: the Dead Links page, not the service worker

MV3 service workers are stopped after about 30 seconds without extension events, and a few hundred fetches can take
minutes. The Dead Links page is a normal extension page that lives as long as its tab, and with host permission granted
it can fetch any URL without CORS limits. So the page runs the check and shows progress ("Checking: 120 of 840
addresses…"), and reads, updates and removes favorites with `browser.bookmarks` itself; the service worker only
supplies theme and preferences. Closing the tab stops the check; results are saved every 25 addresses and at the end.

## How one URL is checked

1. Skip anything that isn't `http:` or `https:` (`javascript:`, `file:`, `chrome:`, `edge:`, `about:`, `data:`); these
   are simply left out. With **Skip local and intranet addresses** on, local addresses are skipped too and counted in
   the status line ("2 local addresses skipped").
2. `fetch(url, { method: 'HEAD', redirect: 'follow', credentials: 'omit', cache: 'no-store', signal })` with a 15 s
   timeout (`AbortController`). `credentials: 'omit'` means no cookies are sent, so a check never acts as the logged-in user.
3. If HEAD fails with a network error or any status of 400 or more, except 429 and 503 (those back off instead, see
   "Being polite"), confirm with one GET, aborted as soon as the headers arrive, so no page body is downloaded. Many
   servers answer HEAD badly, so a failed HEAD alone never decides.
4. Classify:

| Outcome | Result shown | Pre-selected for removal? |
|---|---|---|
| 2xx, or 3xx ending in 2xx | OK (not listed) | n/a |
| Redirected to a different host or path, ending on a working page | "Moved to a new address", with **Update address** | no |
| A specific page redirected to the site's home page | "Redirects to the site's home page" (usually gone), no Update | no |
| Redirected to a sign-in page | "Redirects to a sign-in page", no Update | no |
| Same page with parameters only added (YouTube's `cbrd=1&ucbcb=1` without a consent cookie, tracking parameters) | OK (not moved) | n/a |
| Redirected to a cookie-consent page (`consent.youtube.com`, …/cookie-consent/) | "Redirects to a cookie-consent page", no Update | no |
| 404, 410 | **Not found** | yes |
| DNS failure / connection refused, twice, 10 s apart, and again in the final pass | **Unreachable** | **no** |
| 429 / 503 | site is paused and retried later (see below); after 3 tries "Couldn't verify (rate limited, 429)" / "Server error (503)" | no |
| 401, 403, other 4xx | "Couldn't verify (HTTP n)" | no |
| other 5xx | "Server error (n)" | no |
| no answer within 15 s | "Timed out" | no |

Only "Not found" is pre-selected: a server answered that the page is gone. "Unreachable" counts as dead but is never
pre-selected, because a dropped connection makes every site look unreachable (raised by the user, 2026-11-14).

### Connection drops

- Before each request, and whenever a request fails while `navigator.onLine` is false, the check pauses ("Paused: your
  connection is offline") and resumes when the browser reports it's back.
- Many networks drop without `navigator.onLine` changing, so after the main pass every address still marked
  unreachable is checked once more ("Double-checking N unreachable addresses"). A short drop mid-run is corrected there.

## Being polite to websites

Tightened on 2026-11-14 (D21), after the user asked whether a long check could look like a bot:

- At most 6 requests at a time, and at most 5 new requests per second overall.
- One request at a time per site, with **1.5 s** between two requests to the same site (was 0.25 s). Sites with many
  favorites (YouTube, saved search results) take longer; everything else is unaffected because the 6 slots stay busy.
- **When a site says "slow down"** (429 Too Many Requests, or 503): no second request, the site is left alone for as
  long as its `Retry-After` asks, or 60 s doubling each time (at most 10 minutes), and the address is tried again later,
  up to 2 more times. Only then is it recorded, as "Couldn't verify (rate limited, 429)". The status line says how many
  sites asked to slow down.
- One request per unique URL (duplicates are checked once); HEAD first, GET only to confirm a failure, stopped as soon
  as the headers arrive; no cookies.
- Requests go only to the sites the user has bookmarked, directly from their browser. Nothing goes through a server of ours.

## Results

- Saved in `browser.storage.local` under `dead_links`: `results` (by favorite ID: address, title, folder, result,
  status, new address, when checked; only problems are kept), `ignored` (favorite IDs), `skip_local`, and `last_run`
  (when, how many checked, problems, local addresses skipped, whether it was stopped). Reopening the page shows the
  last check ("Last checked 2 days ago: …").
- **Recheck Problems** re-runs only the listed, non-ignored results; **Check Links** again does everything.
- **Backup before removing** (asked for by the user, 2026-11-14): Remove Selected first downloads
  `sprucemarks-removed-<date>-<time>.html`, a standard bookmarks file (`dead_links.backup_html`) with the favorites about
  to go, in their original folders under one dated folder. Any browser restores it with "import bookmarks from HTML
  file". The page builds the file itself, so no `downloads` permission is needed; if building it fails, nothing is
  removed. Chosen over moving favorites to a "Removed" folder, which would be synced, sorted and scanned by Tools until
  emptied.
- Removing and updating call `browser.bookmarks.remove` / `update` from the page directly; the service worker sees
  the usual bookmark events (history log, re-sort) as with any other change. Results for favorites changed or removed
  elsewhere are dropped (the page listens to `onRemoved` / `onChanged` and checks URLs on load).

## Privacy and store updates that ship with it

- `PRIVACY.md` has a "Dead Links (only when you use it)" section; the About page ("About This Fork") and the store
  description say the checks contact the bookmarked sites directly and nothing is sent anywhere else.
- Edge listing: the certification notes explain the optional host permission and that it's requested only when the
  user clicks Check Links (Partner Center lists only required permissions, so it has no justification field for it).

## Tests

- In the suite (`-background-test.js`; `js/dead-links.js` is included in the service worker for this):
  `dead_links_checkable`, `dead_links_is_local`, `dead_links_redirect_kind`, `dead_links_classify`, `dead_links_queue`,
  `dead_links_queue_slow_down`, `dead_links_backoff` and `dead_links_backup_html`.
- The network part isn't in CI (it would depend on real websites). Checked by hand: full checks and rechecks on the
  user's real collection (2026-11-14), and a local test server that answers 429 with `Retry-After` and 404.

## Decided with the user (2026-11-14)

1. **Moved links:** offer **Update address** only when there is a real new address: the redirect ends on a working
   (2xx) page at a different URL, and not merely the same page with parameters added. Not found / unreachable rows have
   no new address and only offer removal. Redirects to the site's home page, a sign-in page or a cookie-consent page
   have their own results and no Update button, since they don't say where the page went.
2. **Local and intranet addresses:** an option, **Skip local and intranet addresses**, on by default. It covers
   `localhost` (and `*.localhost`), `127.0.0.0/8`, `::1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`,
   `169.254.0.0/16`, IPv6 unique-local (`fc00::/7`) and link-local (`fe80::/10`) addresses, names ending in `.local`,
   `.lan`, `.internal`, `.intranet`, `.corp` or `.home.arpa`, and single-label hostnames (`http://wiki/`). Skipped
   favorites aren't listed; the status line counts them.
3. **Ignore list, from the start:** an **Ignore** button per result row; ignored favorite IDs are kept in
   `browser.storage.local` and left out of results, with a "Show N ignored" link to see and un-ignore them.
