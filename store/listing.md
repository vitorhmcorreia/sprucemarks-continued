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
- Privacy policy URL: `https://github.com/vitorhmcorreia/sprucemarks-continued/blob/main/PRIVACY.md`
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

## Store listing (English)

**Short description** comes from the package (`source/_locales/en/messages.json`), 99 characters:

> Automatically sort bookmarks by title, date, or URL. A community fork that keeps Sprucemarks alive.

**Description** (888 characters; Partner Center allows 250 to 1,000, although Microsoft's docs say 10,000):

```
Sprucemarks Continued keeps your favorites in order, automatically.

Choose a sort order for the favorites bar, other favorites and mobile favorites, each with its own setting for sub folders, and your favorites stay sorted as you add, move or rename them.

• Sort by title, date added or URL, in either direction
• Optionally list folders first
• Tools to find empty folders, duplicate favorites and similar favorites
• Favorites history: recently added, modified or removed
• Light and dark themes

Privacy: everything happens inside your browser. No data is collected or sent anywhere, with no analytics, ads or tracking.

Sprucemarks Continued is an unofficial community fork of Sprucemarks by Kai Nightmode, archived in 2026 and dedicated to the public domain. It is not affiliated with or endorsed by the original author. Source code: github.com/vitorhmcorreia/sprucemarks-continued
```

**Extension logo:** `logo-300.png` (300×300, 1:1)

**Small promotional tile (optional):** `tile-small-440x280.png`

**Large promotional tile (optional):** `tile-large-1400x560.png`

**Screenshots (optional, up to 6, 1280×800):** upload in this order:

1. `screenshots/1-options.png`: options, automatic sorting on
2. `screenshots/2-sort-options.png`: a sort order per folder and its sub folders
3. `screenshots/3-duplicates.png`: duplicate favorites tool
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
