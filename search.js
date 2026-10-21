(function () {
  "use strict";
  if (window.__studioPeopleSearchLoaded) return;
  window.__studioPeopleSearchLoaded = true;

  const scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : new URL("search.js", window.location.href).href;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = new URL("search.css?v=1", scriptUrl).href;
  document.head.appendChild(css);

  const isEnglish = window.location.pathname.split("/").includes("en");
  const root = "";
  const pages = [
    { path: root + "index.html", type: isEnglish ? "PAGE" : "ページ", title: isEnglish ? "Home" : "ホーム" },
    { path: root + "article.html", type: isEnglish ? "ARTICLES" : "記事一覧", title: isEnglish ? "Articles" : "記事一覧" },
    { path: root + "catalog.html", type: isEnglish ? "CATALOG" : "カタログ", title: isEnglish ? "Stationery Catalog" : "文房具カタログ" },
    { path: root + "mechanical-pencil.html", type: isEnglish ? "CATALOG" : "カタログ", title: isEnglish ? "Mechanical Pencil" : "シャープペンシル" },
    { path: root + "ball-point-pen.html", type: isEnglish ? "CATALOG" : "カタログ", title: isEnglish ? "Ball Point Pen" : "ボールペン" },
    { path: root + "fountain-pen.html", type: isEnglish ? "CATALOG" : "カタログ", title: isEnglish ? "Fountain Pen" : "万年筆" },
    { path: root + "about.html", type: isEnglish ? "PAGE" : "ページ", title: isEnglish ? "About" : "このサイトについて" },
    { path: root + "1.html", type: isEnglish ? "ARTICLE" : "記事", title: "" },
    { path: root + "2.html", type: isEnglish ? "ARTICLE" : "記事", title: "" },
    { path: root + "3.html", type: isEnglish ? "ARTICLE" : "記事", title: "" }
  ];

  // Kana-aware search: unify hiragana/katakana and add a romaji-to-kana variant.
  const normalize = value => String(value || "").normalize("NFKC").toLocaleLowerCase()
    .replace(/[\s\u3000]+/g, " ").trim()
    .replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));

  const romajiKana = {
    kya:"きゃ",kyu:"きゅ",kyo:"きょ",sha:"しゃ",shu:"しゅ",sho:"しょ",sya:"しゃ",syu:"しゅ",syo:"しょ",
    cha:"ちゃ",chu:"ちゅ",cho:"ちょ",tya:"ちゃ",tyu:"ちゅ",tyo:"ちょ",nya:"にゃ",nyu:"にゅ",nyo:"にょ",
    hya:"ひゃ",hyu:"ひゅ",hyo:"ひょ",mya:"みゃ",myu:"みゅ",myo:"みょ",rya:"りゃ",ryu:"りゅ",ryo:"りょ",
    gya:"ぎゃ",gyu:"ぎゅ",gyo:"ぎょ",ja:"じゃ",ju:"じゅ",jo:"じょ",zya:"じゃ",zyu:"じゅ",zyo:"じょ",
    bya:"びゃ",byu:"びゅ",byo:"びょ",pya:"ぴゃ",pyu:"ぴゅ",pyo:"ぴょ",
    shi:"し",chi:"ち",tsu:"つ",ji:"じ",fu:"ふ",si:"し",ti:"ち",tu:"つ",hu:"ふ",
    ka:"か",ki:"き",ku:"く",ke:"け",ko:"こ",ga:"が",gi:"ぎ",gu:"ぐ",ge:"げ",go:"ご",
    sa:"さ",su:"す",se:"せ",so:"そ",za:"ざ",zi:"じ",zu:"ず",ze:"ぜ",zo:"ぞ",
    ta:"た",te:"て",to:"と",da:"だ",di:"ぢ",du:"づ",de:"で",do:"ど",
    na:"な",ni:"に",nu:"ぬ",ne:"ね",no:"の",ha:"は",hi:"ひ",he:"へ",ho:"ほ",
    ma:"ま",mi:"み",mu:"む",me:"め",mo:"も",ya:"や",yu:"ゆ",yo:"よ",
    ra:"ら",ri:"り",ru:"る",re:"れ",ro:"ろ",wa:"わ",wi:"うぃ",we:"うぇ",wo:"を",
    ba:"ば",bi:"び",bu:"ぶ",be:"べ",bo:"ぼ",pa:"ぱ",pi:"ぴ",pu:"ぷ",pe:"ぺ",po:"ぽ",
    a:"あ",i:"い",u:"う",e:"え",o:"お",n:"ん"
  };
  const romajiToKana = value => {
    const s = String(value || "").toLocaleLowerCase();
    let out = "", i = 0;
    while (i < s.length) {
      if (/[bcdfghjklmpqrstvwxyz]/.test(s[i]) && s[i] === s[i + 1] && s[i] !== "n") {
        out += "っ"; i++; continue;
      }
      if (s[i] === "n" && (s[i + 1] === "'" || (s[i + 1] && !/[aiueoy]/.test(s[i + 1])))) {
        out += "ん"; i += s[i + 1] === "'" ? 2 : 1; continue;
      }
      let found = false;
      for (const size of [3, 2, 1]) {
        const part = s.slice(i, i + size);
        if (romajiKana[part]) { out += romajiKana[part]; i += size; found = true; break; }
      }
      if (!found) { out += s[i]; i++; }
    }
    return normalize(out);
  };
  // Explicit aliases for brand names whose Japanese spelling cannot be reliably inferred from romaji.
  const searchAliases = [
    { keys: ["staedtler", "ステッドラー"], aliases: ["ステッドラー", "すてっどらー"] },
    { keys: ["pentel", "ぺんてる", "ペンテル"], aliases: ["ぺんてる", "ペンテル"] }
  ];
  const withSearchAliases = value => {
    let result = String(value || "");
    const normalized = normalize(result);
    searchAliases.forEach(entry => {
      if (entry.keys.some(key => normalized.includes(normalize(key)))) {
        result += " " + entry.aliases.join(" ");
      }
    });
    return result;
  };

  const currentPath = path => new URL(path, window.location.href).pathname;
  let indexPromise = null;
  let closeSearch = function () {};

  function buildIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = Promise.all(pages.map(async page => {
      try {
        const response = await fetch(page.path, { credentials: "same-origin" });
        if (!response.ok) return [];
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const url = new URL(page.path, window.location.href).pathname;
        const results = [];
        const title = (doc.querySelector("h1") && doc.querySelector("h1").textContent.trim())
          || (doc.querySelector("title") && doc.querySelector("title").textContent.trim())
          || page.title;
        const description = (doc.querySelector(".hero .description") && doc.querySelector(".hero .description").textContent.trim()) || "";
        if (page.type !== (isEnglish ? "CATALOG" : "カタログ") || !doc.querySelector(".stationery-card")) {
          results.push({
            id: "page:" + url, kind: "page", title: page.title || title, subtitle: description || title,
            type: page.type || "PAGE", url, searchable: [page.title, title, description, doc.title].join(" ")
          });
        }
        doc.querySelectorAll(".stationery-card").forEach((card, i) => {
          const nameNode = card.querySelector(".stationery-card-name");
          if (!nameNode) return;
          const name = nameNode.textContent.replace(/\s+/g, " ").trim();
          const section = card.closest(".series-section");
          const maker = section && section.querySelector(".series-maker") ? section.querySelector(".series-maker").textContent.trim() : "";
          const series = section && section.querySelector(".series-title") ? section.querySelector(".series-title").textContent.trim() : "";
          const group = card.closest(".series-products");
          const context = (group && group.textContent || "").replace(/\s+/g, " ").trim();
          const category = page.title;
          results.push({
            id: "product:" + url + ":" + i + ":" + name, kind: "product", title: name,
            subtitle: [maker, series || category].filter(Boolean).join(" · "),
            type: isEnglish ? "PRODUCT" : "商品", url, cardName: name,
            searchable: withSearchAliases([name, maker, series, category, doc.title].join(" "))
          });
        });
        return results;
      } catch (_) {
        return [];
      }
    })).then(groups => groups.flat());
    return indexPromise;
  }

  function init() {
    const menuButton = document.getElementById("menuButton");
    const settingsButton = document.getElementById("spSettingsButton");
    const header = document.querySelector("header");
    if (!menuButton || !header || document.getElementById("spSearchButton")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sp-search-button";
    button.id = "spSearchButton";
    button.setAttribute("aria-label", isEnglish ? "Open site search" : "サイト内検索を開く");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "spGlobalSearchPanel");
    button.title = isEnglish ? "Search" : "検索";
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 15.5 4.2 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    menuButton.insertAdjacentElement("beforebegin", button);

    const panel = document.createElement("section");
    panel.className = "sp-global-search-panel";
    panel.id = "spGlobalSearchPanel";
    panel.setAttribute("aria-label", isEnglish ? "Site search" : "サイト内検索");
    panel.innerHTML = `
      <div class="sp-search-inner">
        <div class="sp-search-input-row">
          <svg class="sp-search-input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 15.5 4.2 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <input class="sp-search-input" id="spSearchInput" type="search" autocomplete="off" spellcheck="false" placeholder="${isEnglish ? "Search products, articles, makers…" : "商品名・メーカー名・記事を検索…"}" aria-label="${isEnglish ? "Search the site" : "サイト内を検索"}">
          <button class="sp-search-clear" id="spSearchClear" type="button" aria-label="${isEnglish ? "Clear search" : "入力を消去"}" hidden>×</button>
        </div>
        <div class="sp-search-meta"><span id="spSearchHeading">${isEnglish ? "SEARCH" : "検索"}</span><span id="spSearchCount"></span></div>
        <div class="sp-search-results" id="spSearchResults" aria-live="polite" aria-busy="false">
          <div class="sp-search-empty">${isEnglish ? "Start typing to search the catalog and site pages." : "キーワードを入力すると、商品やページが見つかります。"}</div>
        </div>
      </div>`;
    header.insertAdjacentElement("afterend", panel);

    const input = panel.querySelector("#spSearchInput");
    const clear = panel.querySelector("#spSearchClear");
    const resultsBox = panel.querySelector("#spSearchResults");
    const count = panel.querySelector("#spSearchCount");
    const heading = panel.querySelector("#spSearchHeading");
    let searchRun = 0;

    function setOpen(open, focusInput) {
      panel.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? (isEnglish ? "Close site search" : "検索を閉じる") : (isEnglish ? "Open site search" : "サイト内検索を開く"));
      button.title = open ? (isEnglish ? "Close search" : "検索を閉じる") : (isEnglish ? "Search" : "検索");
      button.innerHTML = open
        ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 15.5 4.2 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      if (open) {
        const rect = header.getBoundingClientRect();
        panel.style.top = Math.max(0, rect.bottom) + "px";
        if (focusInput) window.setTimeout(() => input.focus(), 80);
      } else {
        input.blur();
      }
    }
    closeSearch = () => setOpen(false, false);

    function renderMessage(message, className) {
      resultsBox.innerHTML = "";
      const item = document.createElement("div");
      item.className = className || "sp-search-empty";
      item.textContent = message;
      resultsBox.appendChild(item);
      count.textContent = "";
    }

    function openProduct(result) {
      const targetPath = currentPath(result.url);
      const targetName = normalize(result.cardName);
      const findCard = () => Array.from(document.querySelectorAll(".stationery-card")).find(card => {
        const name = card.querySelector(".stationery-card-name");
        return name && normalize(name.textContent) === targetName;
      });
      if (window.location.pathname === targetPath) {
        const card = findCard();
        const link = card && card.querySelector(".stationery-card-link");
        setOpen(false, false);
        if (link) link.click();
        return;
      }
      try { sessionStorage.setItem("studioPeople.pendingSearchProduct", JSON.stringify({ path: targetPath, name: result.cardName })); } catch (_) {}
      window.location.href = result.url;
    }

    function selectResult(result) {
      if (result.kind === "product") {
        openProduct(result);
        return;
      }
      setOpen(false, false);
      window.location.href = result.url;
    }

    function renderResults(items, query) {
      resultsBox.innerHTML = "";
      count.textContent = isEnglish ? String(items.length) : items.length + "件";
      if (!items.length) {
        renderMessage(isEnglish ? "No matching results. Try another keyword." : "一致する結果がありません。別のキーワードを試してください。");
        return;
      }
      items.slice(0, 16).forEach(result => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "sp-search-result";
        const icon = result.kind === "product"
          ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 20 4.5-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m14.8 6.7 3 3" stroke="currentColor" stroke-width="1.6"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3.8h8l4 4V20H6V3.8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 4v4h4M9 12h6M9 15.5h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
        item.innerHTML = '<span class="sp-search-result-icon">' + icon + '</span><span class="sp-search-result-copy"><span class="sp-search-result-title"></span><span class="sp-search-result-subtitle"></span><span class="sp-search-result-type"></span></span>';
        item.querySelector(".sp-search-result-title").textContent = result.title;
        item.querySelector(".sp-search-result-subtitle").textContent = result.subtitle || result.url.replace(/^.*\//, "");
        item.querySelector(".sp-search-result-type").textContent = result.type;
        item.addEventListener("click", () => selectResult(result));
        resultsBox.appendChild(item);
      });
    }

    async function search() {
      const query = normalize(input.value);
      clear.hidden = !input.value;
      const run = ++searchRun;
      if (!query) {
        renderMessage(isEnglish ? "Start typing to search the catalog and site pages." : "キーワードを入力すると、商品やページが見つかります。");
        heading.textContent = isEnglish ? "SEARCH" : "検索";
        return;
      }
      heading.textContent = isEnglish ? "RESULTS" : "検索結果";
      resultsBox.innerHTML = '<div class="sp-search-loading">' + (isEnglish ? "Searching…" : "検索中…") + '</div>';
      resultsBox.setAttribute("aria-busy", "true");
      const index = await buildIndex();
      if (run !== searchRun) return;
      const queryKana = romajiToKana(query);
      const matches = index.filter(item => {
        const searchable = normalize(item.searchable);
        const searchableKana = romajiToKana(searchable);
        return searchable.includes(query) || searchable.includes(queryKana) ||
          searchableKana.includes(query) || searchableKana.includes(queryKana);
      });
      matches.sort((a, b) => {
        const aTitle = normalize(a.title), bTitle = normalize(b.title);
        const aExact = aTitle === query ? 0 : aTitle.startsWith(query) ? 1 : 2;
        const bExact = bTitle === query ? 0 : bTitle.startsWith(query) ? 1 : 2;
        if (aExact !== bExact) return aExact - bExact;
        if (a.kind !== b.kind) return a.kind === "product" ? -1 : 1;
        return a.title.localeCompare(b.title);
      });
      renderResults(matches, query);
      resultsBox.setAttribute("aria-busy", "false");
    }

    button.addEventListener("click", () => {
      const open = !panel.classList.contains("is-open");
      if (open) {
        const settingsPanel = document.getElementById("spSettingsPanel");
        if (settingsPanel && settingsPanel.classList.contains("active")) {
          const settingsClose = document.getElementById("spSettingsClose");
          if (settingsClose) settingsClose.click();
        }
        if (menuButton.classList.contains("active")) menuButton.click();
      }
      setOpen(open, open);
    });
    input.addEventListener("input", search);
    clear.addEventListener("click", () => { input.value = ""; search(); input.focus(); });
    menuButton.addEventListener("click", closeSearch);
    if (settingsButton) settingsButton.addEventListener("click", closeSearch);
    document.addEventListener("click", event => {
      if (panel.classList.contains("is-open") && !panel.contains(event.target) && !button.contains(event.target)) setOpen(false, false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        setOpen(false, false);
        button.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (panel.classList.contains("is-open")) panel.style.top = Math.max(0, header.getBoundingClientRect().bottom) + "px";
    });

    // A search result can open the matching product detail after navigating to its catalog page.
    try {
      const pending = JSON.parse(sessionStorage.getItem("studioPeople.pendingSearchProduct") || "null");
      if (pending && pending.path === window.location.pathname) {
        sessionStorage.removeItem("studioPeople.pendingSearchProduct");
        const target = normalize(pending.name);
        const card = Array.from(document.querySelectorAll(".stationery-card")).find(item => {
          const name = item.querySelector(".stationery-card-name");
          return name && normalize(name.textContent) === target;
        });
        const link = card && card.querySelector(".stationery-card-link");
        if (link) window.setTimeout(() => link.click(), 100);
      }
    } catch (_) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();