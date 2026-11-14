# Design: dead-link checker

Status: **proposed**, not started. Waiting for the first Edge Add-ons listing to be approved (DECISIONS D8). Written
2026-11-14 so the work can start right after approval.

## Goal

Find favorites whose pages no longer exist, and let the user review and remove them, the same way the existing
tools handle empty folders, duplicates and similar favorites. It must never remove anything on its own, and it must
never call a page dead when it's only slow, blocking bots, or behind a login.

## Where it lives

A fifth section on the **Tools** page, **Dead Links**, under Similar Favorites, built like the other tool sections:
a description, a **Check Links** button, a results table (Title, Location, URL, Result, Select), a **Remove Favorites**
button and a "Viewing N" line. No separate extension (discussed 2026-11-14): the Tools page is already "review and
clean up your favorites", the store's single-purpose rule covers it, and a second listing would double the upkeep.

## Permissions: ask only when used

- Add `"optional_host_permissions": ["http://*/*", "https://*/*"]` to the manifest. Required permissions stay
  `bookmarks` and `storage`, so installing or updating asks for nothing new, and store review sees no broad host access.
- Clicking **Check Links** calls `browser.permissions.request({ origins: [...] })` (it must come from that click). If
  the user declines, show one line explaining why the access is needed and leave everything else working.
- A **Revoke access** link next to the button calls `browser.permissions.remove`, for anyone who wants it gone after a check.

## Where the checking runs: the Tools page, not the service worker

MV3 service workers are stopped after about 30 seconds without extension events, and a few hundred fetches can take
minutes. The Tools page is a normal extension page that lives as long as its tab, and with host permission granted it
can fetch any URL without CORS limits. So the page runs the check and shows progress ("Checked 120 of 840"), and the
service worker isn't involved beyond what it already does (listing favorites, removing the selected ones). Closing the
tab stops the check. The results found so far are kept (see Results).

## How one URL is checked

1. Skip anything that isn't `http:` or `https:` (`javascript:`, `file:`, `chrome:`, `edge:`, `about:`, `data:`): shown as "not checked".
2. `fetch(url, { method: 'HEAD', redirect: 'follow', credentials: 'omit', cache: 'no-store', signal })` with a 15 s
   timeout (`AbortController`). `credentials: 'omit'` means no cookies are sent, so a check never acts as the logged-in user.
3. If HEAD is refused (405, 501, or a network error that a GET might not hit), retry once with GET and abort as soon
   as the headers arrive, so no page body is downloaded.
4. Classify:

| Outcome | Result shown | Pre-selected for removal? |
|---|---|---|
| 2xx, or 3xx ending in 2xx | OK (not listed) | n/a |
| Redirected to a different host or path | "Moved to …" (informational) | no |
| 404, 410 | **Not found** | yes |
| DNS failure / connection refused, twice, 10 s apart | **Unreachable** | yes |
| 401, 403, 429, other 4xx | "Couldn't verify (HTTP n)" | no |
| 5xx, timeout | "Server error / timed out" | no |

Only "Not found" and "Unreachable" count as dead. Everything else is listed so the user can decide, but never pre-selected.

## Being polite to websites

- At most 6 requests at a time overall, and 1 at a time per host, with 250 ms between requests to the same host.
- One request per unique URL (duplicates are checked once).
- Requests go only to the sites the user has bookmarked, directly from their browser. Nothing goes through a server of ours.

## Results

- Saved in `browser.storage.local` (`tool_dead_links`: URL → result and time checked), so reopening Tools shows the
  last check with "checked 2 days ago".
- **Recheck** re-runs only the non-OK ones; **Check Links** again does everything.
- Removing uses the same path as the other tools: a `tool-dead-links-remove` port message with the selected IDs, and
  the service worker removes them with `bookmark_remove`.

## Privacy and store updates that ship with it

- `PRIVACY.md`: "When you run Check Links, your browser contacts each bookmarked website directly to see if the page
  still exists. Nothing is sent to us or anyone else; no cookies are sent with these checks." The no-network wording
  in the About page and the store description changes to match.
- Edge listing: a justification for the optional host permission, and the certification notes explain it's requested
  only when the user clicks Check Links.

## Tests

- Unit tests in `-background-test.js` style for the classifier (status code and error to result) and the per-host queue.
- `test/run-tests.js` can't reach the internet in a reliable way, so the fetch layer gets a fake in tests; one manual
  check against a few known URLs (a live page, a 404, a non-existent domain) before release.

## Open questions for the user

1. Should "Moved to …" offer to **update** the favorite's URL to the new address? (Useful, but changes favorites
   rather than only removing them.)
2. Should intranet and `localhost` URLs be skipped by default? (They are often only reachable at work or at home.)
3. Is an "ignore this favorite" list worth it from the start, or only if people ask?
