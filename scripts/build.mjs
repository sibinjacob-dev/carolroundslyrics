import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const readProjectFile = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function render(template, values) {
  return template.replace(/{{([A-Za-z][A-Za-z0-9]*)}}/g, (token, key) => {
    if (!(key in values)) {
      throw new Error(`Missing template value for ${token}`);
    }
    return values[key];
  });
}

const [baseTemplate, songTemplate, indexTemplate, footerTemplate, englishSource, malayalamSource] = await Promise.all([
  readProjectFile('templates/base.html'),
  readProjectFile('templates/song.html'),
  readProjectFile('templates/index.html'),
  readProjectFile('templates/footer.html'),
  readProjectFile('SongsEnglish/songs.json'),
  readProjectFile('SongsMalayalam/songs.json')
]);
const collections = [JSON.parse(englishSource), JSON.parse(malayalamSource)];
const songs = collections.flatMap((collection) => collection.songs.map((song) => ({
  ...song,
  language: collection.language
})));

const languageKeys = new Set(collections.map((collection) => collection.language));
const songKeys = new Set();
const listOrderKeys = new Set();

for (const song of songs) {
  if (!languageKeys.has(song.language)) {
    throw new Error(`Unknown language "${song.language}" for song "${song.slug}".`);
  }
  const songKey = `${song.language}:${song.slug}`;
  if (songKeys.has(songKey)) {
    throw new Error(`Duplicate song: ${songKey}`);
  }
  if (!song.title || !Array.isArray(song.lines) || song.lines.length === 0) {
    throw new Error(`Song ${songKey} must have a title and a non-empty lines array.`);
  }
  if (song.lines.some((line) => typeof line !== 'string')) {
    throw new Error(`Every lyric line in ${songKey} must be a string.`);
  }
  if (song.order !== undefined) {
    if (!Number.isInteger(song.order) || song.order < 1 || !song.listLabel) {
      throw new Error(`Listed song ${songKey} must have a positive integer order and listLabel.`);
    }
    const orderKey = `${song.language}:${song.order}`;
    if (listOrderKeys.has(orderKey)) {
      throw new Error(`Duplicate song-list order: ${orderKey}`);
    }
    listOrderKeys.add(orderKey);
  }
  songKeys.add(songKey);
}

const generatedFiles = [];
const page = (content, values) => render(baseTemplate, {
  ...values,
  content,
  footer: footerTemplate.trimEnd(),
  pageScripts: values.pageScripts ?? ''
});

const browserSongData = Object.fromEntries(collections.map((collection) => [
  collection.language,
  collection
]));
generatedFiles.push({
  outputPath: 'scripts/song-data.js',
  content: `window.CAROL_SONG_DATA = ${JSON.stringify(browserSongData, null, 2)};`
});

generatedFiles.push({
  outputPath: 'lyrics.html',
  content: page(songTemplate, {
    htmlLang: 'en',
    description: 'Carol Rounds song lyrics',
    pageTitle: 'Carol Rounds Lyrics',
    root: '',
    bodyClass: 'lyrics-page',
    pageScripts: '  <script src="scripts/song-data.js" defer></script>\n  <script src="scripts/lyrics.js" defer></script>'
  })
});

const songItemsFor = (language) => {
  const listedSongs = songs
    .filter((song) => song.language === language && song.order !== undefined)
    .sort((first, second) => first.order - second.order);
  return listedSongs.map((song) => {
    const href = `lyrics.html?lang=${encodeURIComponent(language)}&song=${encodeURIComponent(song.slug)}`;
    return `          <li><a href="${escapeHtml(href)}">${escapeHtml(song.listLabel)}</a></li>`;
  }).join('\n');
};

const collectionsByLanguage = Object.fromEntries(collections.map((collection) => [
  collection.language,
  collection
]));
const malayalamCollection = collectionsByLanguage.ml;
const englishCollection = collectionsByLanguage.en;
const indexContent = render(indexTemplate, {
  malayalamChurchName: escapeHtml(malayalamCollection.churchName),
  malayalamCollectionTitle: escapeHtml(malayalamCollection.collectionTitle),
  malayalamSongItems: songItemsFor('ml'),
  englishChurchName: escapeHtml(englishCollection.churchName),
  englishCollectionTitle: escapeHtml(englishCollection.collectionTitle),
  englishSongItems: songItemsFor('en')
});
generatedFiles.push({
  outputPath: 'index.html',
  content: page(indexContent, {
    htmlLang: 'en',
    description: 'Malayalam and Manglish Carol Rounds songs from Thuruthicadu Mar Thoma Church',
    pageTitle: 'Carol Rounds Songs - Thuruthicadu Mar Thoma Church',
    root: '',
    bodyClass: 'song-index-page',
    pageScripts: '  <script src="scripts/index.js" defer></script>'
  })
});

let staleCount = 0;
for (const generated of generatedFiles) {
  const outputFile = path.join(projectRoot, generated.outputPath);
  const expected = `${generated.content.trim()}\n`;
  if (checkOnly) {
    const current = await readFile(outputFile, 'utf8').catch(() => '');
    if (current !== expected) {
      staleCount += 1;
      console.error(`Out of date: ${generated.outputPath}`);
    }
  } else {
    await writeFile(outputFile, expected, 'utf8');
  }
}

if (checkOnly && staleCount > 0) {
  console.error(`Run npm run build to update ${staleCount} generated file(s).`);
  process.exitCode = 1;
} else {
  console.log(`${checkOnly ? 'Checked' : 'Generated'} ${generatedFiles.length} pages from shared templates.`);
}
