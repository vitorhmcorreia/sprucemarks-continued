# Edge Add-ons listing: Sprucemarks Continued

Live since 2026-11-14: https://microsoftedge.microsoft.com/addons/detail/sprucemarks-continued/kbnolfoleaklmdmejgffhmbodflkojeh (extension ID `kbnolfoleaklmdmejgffhmbodflkojeh`).

Copy these into Partner Center (Microsoft Edge → your extension). Images are in this folder; regenerate them with
`node build.js && node store/make-store-assets.js`. Limits are from Microsoft's "Publish an extension" page
(checked 2026-11-14) and from what Partner Center actually enforced at the first submission.

## Package

`node build.js --no-tests --zip` → `dist/sprucemarks-continued-<version>.zip` (the same zip as the GitHub release).

## Availability

- Visibility: **Public**
- Markets: **All markets** (default)

## Properties

- Category: **Productivity**
- Privacy policy URL: `https://github.com/vitorhmcorreia/sprucemarks-continued/blob/main/PRIVACY.md` (from
  2026.11.14.2 it also describes the Dead Links checks; data collection answers stay "none": the checks contact the
  bookmarked sites themselves and nothing is collected)
  (strictly only required when an extension collects personal data; this one collects none, but a link costs nothing
  and answers the question up front)
- Website URL: `https://github.com/vitorhmcorreia/sprucemarks-continued`
- Support contact: `https://github.com/vitorhmcorreia/sprucemarks-continued/issues`
- Mature content: no

## Permission justifications

**bookmarks:**

```
Sprucemarks Continued sorts the user's favorites. It needs the bookmarks permission to read the favorites tree, reorder favorites and folders according to the sort options the user chooses, and react when favorites are added, moved or renamed. The optional Tools page also uses it to list empty folders and duplicate or similar favorites, and removes only the ones the user selects. Favorites data never leaves the browser.
```

**storage:**

```
Used to save the user's options (which folders to sort and how), preferences (theme, toolbar icon color) and the optional favorites history shown on the Tools page, in local extension storage on the user's device. Nothing is synced or sent anywhere.
```

**Optional host permissions (`http://*/*`, `https://*/*`), from 2026.11.14.2:**

```
Optional, never requested at install. Used only by the Dead Links page: when the user clicks "Check Links", the extension asks for this access, then sends a HEAD (or, to confirm a failure, a GET stopped after the headers) to each bookmarked address to see whether the page still exists, has moved, or is gone. Requests go directly from the browser to those sites, without cookies, at most 5 per second and 1.5 s apart per site, backing off when a site asks. Nothing is sent to the developer or anyone else. The user can revoke the access on that page at any time.
```

## Store listing (English)

**Short description** comes from the package (`source/_locales/en/messages.json`), 99 characters:

> Automatically sort bookmarks by title, date, or URL. A community fork that keeps Sprucemarks alive.

**Description** (934 characters; Partner Center allows 250 to 1,000, although Microsoft's docs say 10,000; updated
for 2026.11.14.2 with Dead Links):

```
Sprucemarks Continued keeps your favorites in order, automatically.

Choose a sort order for the favorites bar, other favorites and mobile favorites, each with its own setting for sub folders, and your favorites stay sorted as you add, move or rename them.

• Sort by title, date added or URL, in either direction
• Tools to find empty folders, duplicate and similar favorites
• Dead Links: find favorites whose page is gone or has moved, then update, ignore or remove them, with a backup file first
• Light and dark themes

Privacy: no data is collected, no analytics, ads or tracking. Dead Links contacts the bookmarked sites directly from your browser, only when you click Check Links and allow it.

An unofficial community fork of Sprucemarks by Kai Nightmode, archived in 2026 and dedicated to the public domain; not affiliated with or endorsed by the original author. Source code: github.com/vitorhmcorreia/sprucemarks-continued
```

**Extension logo:** `logo-300.png` (300×300, 1:1)

**Small promotional tile (optional):** `tile-small-440x280.png`

**Large promotional tile (optional):** `tile-large-1400x560.png`

**Screenshots (optional, up to 6, 1280×800):** upload in this order:

1. `screenshots/1-options.png`: options, automatic sorting on
2. `screenshots/2-sort-options.png`: a sort order per folder and its sub folders
3. `screenshots/3-dead-links.png`: Dead Links results (from 2026.11.14.2; before that `3-duplicates.png`)
4. `screenshots/4-similar.png`: similar favorites tool
5. `screenshots/5-preferences-dark.png`: preferences, dark theme
6. `screenshots/6-about-dark.png`: about this fork

The favorites in the screenshots are made-up samples of public websites (see `make-store-assets.js`).

**Search terms** (up to 7, 30 characters each, 21 words in total):

1. sort bookmarks
2. sort favorites
3. bookmark sorter
4. organize favorites
5. duplicate bookmarks
6. alphabetical bookmarks
7. sprucemarks

## Notes for certification

```
Sprucemarks Continued is a community fork of the open-source Sprucemarks extension (CC0, archived by its author in 2026); this fork is not affiliated with the original author. No account or test credentials are needed. To test: open the extension from the toolbar icon, enable "Automatic Sorting" and a sort option (for example Favorites Bar: A–Z), then add or rename favorites and they are re-sorted within a second or two. The Tools page finds empty folders, duplicate favorites and similar favorites. The extension makes no network requests and uses only the "bookmarks" and "storage" permissions. Source: https://github.com/vitorhmcorreia/sprucemarks-continued
```

## Updates

Each update: upload the zip from the GitHub release (or `node build.js --no-tests --zip`), replace changed
screenshots, and paste the notes below into "Notes for certification".

### 2026.11.14.1

Screenshots: replace `6-about-dark.png` (changelog and store link); the others are unchanged since the first
submission except `1-options.png` and `5-preferences-dark.png`, which now show the green page logo.

```
Update with no new permissions (still only "bookmarks" and "storage"). Changes: the Tools page finds similar favorites about 15 times faster on large collections; the About page shows a timing summary and which build is running; a green page logo matching the icon; developer console logging is off; links to this listing. No network requests, no data collected. Source and change history: https://github.com/vitorhmcorreia/sprucemarks-continued
```

### 2026.11.14.2

Submit only after 2026.11.14.1 is published: a new submission replaces one still in review and restarts its review.

GitHub release notes (the annotated tag's message; the Release workflow publishes it):

```
**Sprucemarks Continued 2026.11.14.2**: Dead Links.

- **New Dead Links page**: find favorites whose page no longer exists, has moved, or could not be verified, then update, ignore, or remove them.
- **Asks first, checks politely**: nothing is checked until you click Check Links, and website access is requested only then (optional permission, revocable on the page). Checks go straight from your browser to each site, without cookies, at most 5 requests a second and 1.5 s apart per site, backing off when a site asks.
- **Safe removal**: only "not found" is pre-ticked, and removing first saves a backup file you can import in any browser.
- **Filters**: by result and by site, Select All, Recheck Problems, Start over.

Required permissions are unchanged (bookmarks, storage). Store users get this automatically once Microsoft approves the update.

**Install manually** (Chrome, Edge, Brave, Opera, Vivaldi): download the zip below, unzip it into a folder you'll keep, open your browser's extensions page, turn on Developer mode, and choose **Load unpacked**. Full steps in the [README](https://github.com/vitorhmcorreia/sprucemarks-continued#install).
```

- Permissions: add the justification for the optional host permissions (above).
- Description: replace with the updated one above.
- Screenshots: replace `3-duplicates.png` with `3-dead-links.png`, and replace `1-options.png`, `5-preferences-dark.png`
  and `6-about-dark.png` (the navigation now has a Dead Links tab; the About changelog is new). `2` and `4` are unchanged.

```
This update adds a Dead Links page and declares OPTIONAL host permissions (http://*/*, https://*/*). They are never requested at install; the extension asks for them only when the user clicks "Check Links" on that page, and the user can revoke them there. Required permissions are unchanged (bookmarks, storage). To test: open the extension, go to the Dead Links tab, click Check Links and allow the access; the page lists favorites whose address returns 404/410 (not found), cannot be reached, has moved, or could not be verified. Requests go directly to the bookmarked sites, without cookies, rate limited (1.5 s per site, 5/s overall, back-off on 429/503). Removing selected favorites first downloads a standard bookmarks HTML backup. No data is collected or sent to the developer. Source: https://github.com/vitorhmcorreia/sprucemarks-continued
```
