(() => {
  const tabs = [...document.querySelectorAll('[data-language-tab]')];
  const panels = [...document.querySelectorAll('[data-language-panel]')];
  const supportedLanguages = new Set(tabs.map((tab) => tab.dataset.languageTab));

  const selectLanguage = (requestedLanguage, updateUrl = false) => {
    const language = supportedLanguages.has(requestedLanguage) ? requestedLanguage : 'ml';

    for (const tab of tabs) {
      const selected = tab.dataset.languageTab === language;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-current', selected ? 'page' : 'false');
    }

    for (const panel of panels) {
      panel.hidden = panel.dataset.languagePanel !== language;
    }

    document.documentElement.lang = language === 'ml' ? 'ml' : 'en';
    document.body.classList.toggle('malayalam-page', language === 'ml');
    document.body.classList.toggle('manglish-page', language === 'en');

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', language);
      try {
        window.history.replaceState(null, '', url);
      } catch {
        // The selected panel still works if file:// history updates are blocked.
      }
    }
  };

  for (const tab of tabs) {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      selectLanguage(tab.dataset.languageTab, true);
    });
  }

  for (const input of document.querySelectorAll('[data-song-search]')) {
    if (typeof document.querySelector !== 'function') break;
    const panel = document.querySelector(`[data-language-panel="${input.dataset.songSearch}"]`);
    const items = [...panel.querySelectorAll('ol li')];
    const count = document.querySelector(`[data-song-count="${input.dataset.songSearch}"]`);
    const update = () => {
      const query = input.value.trim().toLocaleLowerCase();
      let visible = 0;
      for (const item of items) {
        const matches = item.textContent.toLocaleLowerCase().includes(query);
        item.hidden = !matches;
        if (matches) visible += 1;
      }
      count.textContent = query ? `${visible} song${visible === 1 ? '' : 's'} found` : `${items.length} songs`;
    };
    input.addEventListener('input', update);
    update();
  }

  selectLanguage(new URLSearchParams(window.location.search).get('lang'));
})();
