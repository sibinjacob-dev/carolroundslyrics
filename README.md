# Carol Rounds Lyrics

This is a data-driven static lyrics website. Every song opens through the same
`lyrics.html` page, so there is no HTML file to maintain for each song.

## Update a song

1. Open `SongsEnglish/songs.json` or `SongsMalayalam/songs.json`.
2. Change its `title` or the strings in its `lines` array.
3. Run `npm run build`.

Each string in `lines` is one lyric line. Use an empty string (`""`) between
verses. No HTML is needed in the song data.

To add a song, copy an existing song object and set:

- `language` to `ml` or `en`;
- a unique URL-friendly `slug`;
- `title` and the plain-text `lines`;
- `listLabel` and `order` to show it on that language's home page.

Leave out `listLabel` and `order` when a song should remain unlisted.
The included `song-language.schema.json` gives compatible editors field hints
and highlights malformed song entries while you type.

## Change the design

- `templates/base.html` contains the shared document shell and asset links.
- `templates/song.html` contains the one shared lyric-page layout.
- `templates/index.html` contains the song-list layout.
- `templates/footer.html` contains the shared footer.
- `styles/mainpage.css` contains the shared visual styling.

Run `npm run build` after any template or song change. It generates one compact
browser data script, but never generates per-song HTML files. This lets the site
work when opened directly from the filesystem as well as from a web server.
Run `npm run check` to validate the data and confirm that all three shared
output files are current.

The build uses Node.js only and has no package dependencies. The old
`SongsMalalam` misspelling is no longer used.

Use `npm start` to preview the site at `http://127.0.0.1:4173`.

## Offline and slow connections

After the first successful visit, the browser stores the pages, styles, code,
and lyric data for offline use. Songs then open without a network request. The
lyric data refreshes quietly in the background when a connection is available,
so a changed song appears on the next page load. Increment `CACHE_NAME` in
`sw.js` when changing the application shell itself.
