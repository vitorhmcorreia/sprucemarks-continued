# Chrome Web Store listing: Sprucemarks Continued

Live since 2026-11-28: https://chromewebstore.google.com/detail/sprucemarks-continued/jeaflgnbhjbnlogegbbipdledofcband (item ID `jeaflgnbhjbnlogegbbipdledofcband`), version 2026.11.14.2, submitted
2026-11-27. Everything that was pasted into the
developer dashboard (https://chrome.google.com/webstore/devconsole) is below. The package, privacy
policy and fork wording are the same as the Edge listing (`../listing.md`); the text here says "bookmarks", because that
is what Chrome calls them, and the images in this folder were taken in Chrome (D22).

Regenerate the images with `node build.js`, then
`BROWSER=<path to Chrome for Testing> node store/make-store-assets.js chrome` (install notes in the script's header).

## Before the first submission (account, once)

- Register at the developer dashboard and pay the $5 fee.
- Verify the contact email (Account tab); publishing is blocked until it is verified.
- The Google account needs 2-Step Verification turned on to publish.
- Trader declaration (EU Digital Services Act): **non-trader** fits a free hobby extension with no payments. This
  is the user's call; a trader has to publish an address and phone number.

## Package

Same zip as the GitHub release and Edge: `node build.js --no-tests --zip` → `dist/sprucemarks-continued-<version>.zip`.
The short description (99 characters, limit 132) comes from the package, and already says "bookmarks":

> Automatically sort bookmarks by title, date, or URL. A community fork that keeps Sprucemarks alive.

## Store listing tab

- Language: **English**
- Category: **Productivity → Workflow & Planning**
- Mature content: no
- Homepage URL: `https://github.com/vitorhmcorreia/sprucemarks-continued`
- Support URL: `https://github.com/vitorhmcorreia/sprucemarks-continued/issues`
- Official URL: leave empty (it needs a domain verified in Google Search Console)

**Description:**

```
Sprucemarks Continued keeps your bookmarks in order, automatically.

Choose a sort order for the bookmarks bar, other bookmarks and mobile bookmarks, each with its own setting for sub folders, and your bookmarks stay sorted as you add, move or rename them.

• Sort by title, date added or URL, in either direction
• Tools to find empty folders, duplicate and similar bookmarks
• Dead Links: find bookmarks whose page is gone or has moved, then update, ignore or remove them, with a backup file first
• Light and dark themes

Privacy: no data is collected, no analytics, ads or tracking. Dead Links contacts the bookmarked sites directly from your browser, only when you click Check Links and allow it.

An unofficial community fork of Sprucemarks by Kai Nightmode, archived in 2026 and dedicated to the public domain; not affiliated with or endorsed by the original author. Source code: github.com/vitorhmcorreia/sprucemarks-continued
```

**Graphic assets** (all in this folder):

- Store icon (128×128, required): `icon-128.png` (96×96 artwork with 16 px transparent padding, as Google asks)
- Small promo tile (440×280): `tile-small-440x280.png`
- Marquee promo tile (1400×560, optional): `tile-large-1400x560.png`
- Screenshots (1280×800, up to **5**), in this order:
  1. `screenshots/1-options.png`: options, automatic sorting on
  2. `screenshots/2-sort-options.png`: a sort order per folder and its sub folders (shows Chrome's Bookmarks Bar)
  3. `screenshots/3-dead-links.png`: Dead Links results
  4. `screenshots/4-similar.png`: similar bookmarks tool
  5. `screenshots/5-preferences-dark.png`: preferences, dark theme

  `screenshots/6-about-dark.png` is made too (Edge takes six) but doesn't fit; the description carries the fork wording.

The bookmarks in the screenshots are made-up samples of public websites (`test/browser.js`).

## Privacy practices tab

**Single purpose:**

```
Sprucemarks Continued organizes the user's bookmarks: it keeps them sorted automatically in the order the user chooses, and helps tidy them up by finding empty folders, duplicate or similar bookmarks, and bookmarks whose page no longer exists.
```

**bookmarks justification:**

```
Sprucemarks Continued sorts the user's bookmarks. It needs the bookmarks permission to read the bookmarks tree, reorder bookmarks and folders according to the sort options the user chooses, and react when bookmarks are added, moved or renamed. The optional Tools and Dead Links pages also use it to list empty folders, duplicate or similar bookmarks and bookmarks whose page is gone, and change or remove only the ones the user selects. Bookmark data never leaves the browser.
```

**storage justification:**

```
Used to save the user's options (which folders to sort and how), preferences (theme, toolbar icon color), the optional bookmark history shown on the Tools page and the last Dead Links results, in local extension storage on the user's device. Nothing is synced or sent anywhere.
```

**Host permission justification** (the manifest's optional `http://*/*`, `https://*/*`):

```
Optional, never requested at install. Used only by the Dead Links page: when the user clicks "Check Links", the extension asks for this access, then sends a HEAD (or, to confirm a failure, a GET stopped after the headers) to each bookmarked address to see whether the page still exists, has moved, or is gone. Requests go directly from the browser to those sites, without cookies, at most 5 per second and 1.5 s apart per site, backing off when a site asks. Nothing is sent to the developer or anyone else. The user can revoke the access on that page at any time.
```

Broad host patterns can send the item to a longer, in-depth review, even when they are optional. That is expected,
not a rejection.

**Remote code:** No, I am not using remote code (everything runs from the package; no external scripts or `eval`).

**Data usage:** tick **none** of the data types. Bookmarks are read and changed only on the device, and Dead Links
requests go to the bookmarked sites, not to the developer. Then tick all three certifications (no selling or
transferring data, no use unrelated to the single purpose, no use for creditworthiness or lending).

**Privacy policy URL:** `https://github.com/vitorhmcorreia/sprucemarks-continued/blob/main/PRIVACY.md`

## Distribution tab

- Payments: **Free of charge**
- Visibility: **Public**
- Regions: **All regions**

## Test instructions tab

```
Sprucemarks Continued is a community fork of the open-source Sprucemarks extension (CC0, archived by its author in 2026); this fork is not affiliated with the original author. No account or test credentials are needed. To test sorting: open the extension from the toolbar icon, enable "Automatic Sorting" and a sort option (for example Bookmarks Bar: A–Z), then add or rename bookmarks and they are re-sorted within a second or two. The Tools page finds empty folders, duplicate and similar bookmarks. Dead Links: open the Dead Links tab, click Check Links and allow the optional website access; the page lists bookmarks whose address returns 404/410, cannot be reached, has moved, or could not be verified. Requests go directly to the bookmarked sites, without cookies, rate limited; removing selected bookmarks first downloads a standard bookmarks HTML backup. Required permissions: bookmarks, storage. No data is collected or sent to the developer. Source: https://github.com/vitorhmcorreia/sprucemarks-continued
```

## After it is published

Done on 2026-11-28: listing URL above, README install section, D3, ARCHITECTURE and the About page (links both stores, D23,
since Brave, Opera and Vivaldi install from the Chrome Web Store too; ships with the next release).

- Each release: upload the same zip in both dashboards; refresh images with both `make-store-assets.js` commands.
