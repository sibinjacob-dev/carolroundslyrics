(() => {
  const titleElement = document.querySelector('#song-title');
  const contentElement = document.querySelector('#lyrics-content');
  const messageElement = document.querySelector('#lyrics-message');
  const lyricView = document.querySelector('#lyric-view');
  const homeLink = document.querySelector('#home-link');
  const previousSong = document.querySelector('#previous-song');
  const nextSong = document.querySelector('#next-song');
  const fontDown = document.querySelector('#font-down');
  const fontUp = document.querySelector('#font-up');
  const keepAwake = document.querySelector('#keep-awake');
  let wakeLock = null;
  let fontScale = 1;

  const applyFontScale = () => {
    fontScale = Math.min(1.35, Math.max(0.85, fontScale));
    lyricView.style.setProperty('--lyric-scale', fontScale);
    try { localStorage.setItem('lyrics-font-scale', fontScale); } catch { /* Storage is optional. */ }
    fontDown.disabled = fontScale <= 0.85;
    fontUp.disabled = fontScale >= 1.35;
  };

  if (fontDown && fontUp) {
    try { fontScale = Number(localStorage.getItem('lyrics-font-scale')) || 1; } catch { /* Storage is optional. */ }
    fontDown.addEventListener('click', () => { fontScale -= 0.1; applyFontScale(); });
    fontUp.addEventListener('click', () => { fontScale += 0.1; applyFontScale(); });
    applyFontScale();
  }

  const setWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
      keepAwake.querySelector('span').textContent = 'Not supported';
      keepAwake.disabled = true;
      return;
    }
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      keepAwake.setAttribute('aria-pressed', 'true');
      keepAwake.classList.add('is-active');
      keepAwake.querySelector('span').textContent = 'Awake';
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        keepAwake.setAttribute('aria-pressed', 'false');
        keepAwake.classList.remove('is-active');
        keepAwake.querySelector('span').textContent = 'Stay awake';
      });
    } catch {
      keepAwake.querySelector('span').textContent = 'Unavailable';
    }
  };
  if (keepAwake) keepAwake.addEventListener('click', () => wakeLock ? wakeLock.release() : setWakeLock());

  const showError = (message) => {
    titleElement.textContent = 'Lyrics not found';
    contentElement.replaceChildren();
    messageElement.textContent = message;
    messageElement.classList.add('lyrics-error');
  };

  const appendLinkedText = (container, line) => {
    const urlPattern = /https?:\/\/[^\s]+/g;
    let cursor = 0;

    for (const match of line.matchAll(urlPattern)) {
      container.append(document.createTextNode(line.slice(cursor, match.index)));
      const link = document.createElement('a');
      link.href = match[0];
      link.textContent = match[0];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      container.append(link);
      cursor = match.index + match[0].length;
    }

    container.append(document.createTextNode(line.slice(cursor)));
  };

  const renderLines = (lines) => {
    const fragment = document.createDocumentFragment();
    let verse = document.createElement('p');
    verse.className = 'lyrics-verse';

    const finishVerse = () => {
      if (verse.childNodes.length === 0) return;
      fragment.append(verse);
      verse = document.createElement('p');
      verse.className = 'lyrics-verse';
    };

    for (const line of lines) {
      if (!line) {
        finishVerse();
        continue;
      }
      if (verse.childNodes.length > 0) verse.append(document.createElement('br'));
      appendLinkedText(verse, line);
    }
    finishVerse();
    contentElement.replaceChildren(fragment);
  };

  const loadSong = () => {
    const parameters = new URLSearchParams(window.location.search);
    const language = parameters.get('lang');
    const slug = parameters.get('song');
    const collection = window.CAROL_SONG_DATA?.[language];

    if (!collection || !slug) {
      showError('Choose a song from the Malayalam or Manglish song list.');
      return;
    }

    try {
      const song = collection.songs.find((entry) => entry.slug === slug);

      if (collection.language !== language) {
        throw new Error(`Language mismatch for ${language}`);
      }
      homeLink.href = `${collection.indexFile}?lang=${encodeURIComponent(language)}`;

      if (!song) {
        showError('This song link is invalid or the song has been removed.');
        return;
      }

      document.documentElement.lang = collection.htmlLang;
      document.body.className = `lyrics-page ${language === 'ml' ? 'malayalam-page' : 'manglish-page'}`;
      document.title = song.title;
      document.querySelector('meta[name="description"]').content = `${song.title} lyrics`;
      lyricView.classList.toggle('arima-Malayalam', language === 'ml');
      titleElement.textContent = song.title;
      messageElement.hidden = true;
      renderLines(song.lines);
      const listedSongs = collection.songs.filter((entry) => Number.isInteger(entry.order)).sort((a, b) => a.order - b.order);
      const position = listedSongs.findIndex((entry) => entry.slug === slug);
      const setSongLink = (element, entry) => {
        if (!entry) return;
        if (!element) return;
        element.href = `lyrics.html?lang=${encodeURIComponent(language)}&song=${encodeURIComponent(entry.slug)}`;
        element.hidden = false;
      };
      setSongLink(previousSong, listedSongs[position - 1]);
      setSongLink(nextSong, listedSongs[position + 1]);
    } catch (error) {
      console.error(error);
      showError('The lyrics could not be loaded. Please refresh the page or return home.');
    }
  };

  loadSong();
})();
