(function () {
  "use strict";
  const STORAGE_KEY = "studioPeople.settings.v1";
  const DEFAULTS = { theme: "standard", motion: true, language: "ja" };
  const THEMES = ["standard", "midnight", "dark", "sky", "mono-black", "mono-white", "greige", "play-button-minimal", "galaxy", "editorial"];

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return {
        theme: saved && THEMES.includes(saved.theme) ? saved.theme : DEFAULTS.theme,
        motion: saved && typeof saved.motion === "boolean" ? saved.motion : DEFAULTS.motion,
        language: saved && ["ja", "en"].includes(saved.language) ? saved.language : (window.location.pathname.split("/").includes("en") ? "en" : DEFAULTS.language)
      };
    } catch (_) { return { ...DEFAULTS, language: window.location.pathname.split("/").includes("en") ? "en" : DEFAULTS.language }; }
  }

  function saveSettings(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (_) {}
  }

  const SETTINGS_SCRIPT_URL = document.currentScript ? document.currentScript.src : window.location.href;

  function init() {
    const menuButton = document.getElementById("menuButton");
    if (!menuButton || !document.body) return;

    let settings = loadSettings();
    const currentIsEnglish = window.location.pathname.split("/").includes("en");
    if ((settings.language === "en") !== currentIsEnglish) {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      const file = pathParts[pathParts.length - 1] === "en" ? "index.html" : (pathParts[pathParts.length - 1] || "index.html");
      const target = settings.language === "en" ? "/en/" + file : "/" + file;
      window.location.replace(target);
      return;
    }
    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "sp-settings-button";
    settingsButton.id = "spSettingsButton";
    settingsButton.setAttribute("aria-label", settings.language === "en" ? "Open settings" : "設定を開く");
    settingsButton.setAttribute("aria-expanded", "false");
    settingsButton.setAttribute("aria-controls", "spSettingsPanel");
    settingsButton.title = settings.language === "en" ? "Settings" : "設定";
    settingsButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z" stroke="currentColor" stroke-width="1.7" transform="translate(2 -1)"/><path d="m19.4 13.5 1.1.8-1.1 1.9-1.3-.5a7.8 7.8 0 0 1-1.6.9l-.2 1.4h-2.2l-.3-1.4a7.8 7.8 0 0 1-1.7-.5l-1.1.8-1.9-1.1.5-1.3a7.8 7.8 0 0 1-.9-1.6l-1.4-.2v-2.2l1.4-.3a7.8 7.8 0 0 1 .5-1.7l-.8-1.1 1.1-1.9 1.3.5a7.8 7.8 0 0 1 1.6-.9l.2-1.4h2.2l.3 1.4a7.8 7.8 0 0 1 1.7.5l1.1-.8 1.9 1.1-.5 1.3a7.8 7.8 0 0 1 .9 1.6l1.4.2v2.2l-1.4.3" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" /></svg>';
    menuButton.insertAdjacentElement("beforebegin", settingsButton);

    // Load the shared site-wide search on every page.
    if (!document.getElementById("spGlobalSearchScript")) {
      const searchScript = document.createElement("script");
      searchScript.id = "spGlobalSearchScript";
      searchScript.src = new URL("search.js?v=2", SETTINGS_SCRIPT_URL).href;
      document.body.appendChild(searchScript);
    }

    const backdrop = document.createElement("div");
    backdrop.className = "sp-settings-backdrop";
    backdrop.id = "spSettingsBackdrop";
    backdrop.setAttribute("aria-hidden", "true");

    const panel = document.createElement("aside");
    panel.className = "sp-settings-panel";
    panel.id = "spSettingsPanel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "spSettingsTitle");
    panel.innerHTML = `
      <div class="sp-settings-header">
        <div class="sp-settings-heading">
          <h2 class="sp-settings-title" id="spSettingsTitle">Settings</h2>
          <p class="sp-settings-subtitle">STUDIO PEOPLE / PERSONALIZE</p>
        </div>
        <button class="sp-settings-close" type="button" id="spSettingsClose" aria-label="設定を閉じる">×</button>
      </div>
      <section class="sp-settings-section">
        <h3 class="sp-settings-section-title">Language / 言語</h3>
        <p class="sp-settings-section-caption">Choose the language used by the site / サイトの表示言語を選びます。</p>
        <div class="sp-theme-grid sp-language-grid">
          <button type="button" class="sp-theme-option" data-sp-language-choice="ja" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">日本語</span><span class="sp-theme-desc">Japanese</span></span></button>
          <button type="button" class="sp-theme-option" data-sp-language-choice="en" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">English</span><span class="sp-theme-desc">英語</span></span></button>
        </div>
      </section>
      <section class="sp-settings-section">
        <h3 class="sp-settings-section-title">外観・テーマカラー</h3>
        <p class="sp-settings-section-caption">Studio Peopleの色合いを切り替えます。</p>
        <div class="sp-theme-grid">
          <button type="button" class="sp-theme-option sp-theme-standard" data-sp-theme-choice="standard" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Standard</span><span class="sp-theme-desc">白 × 青</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-midnight" data-sp-theme-choice="midnight" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Midnight</span><span class="sp-theme-desc">深いネイビー</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-dark" data-sp-theme-choice="dark" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Dark</span><span class="sp-theme-desc">暗色 × 水色</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-sky" data-sp-theme-choice="sky" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Sky</span><span class="sp-theme-desc">淡い空色</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-mono-black" data-sp-theme-choice="mono-black" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Mono Black</span><span class="sp-theme-desc">黒 × グレー</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-mono-white" data-sp-theme-choice="mono-white" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Mono White</span><span class="sp-theme-desc">白 × ブラック</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-greige" data-sp-theme-choice="greige" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Greige</span><span class="sp-theme-desc">ベージュ × チャコール</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-play-button-minimal" data-sp-theme-choice="play-button-minimal" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Play Button Minimal</span><span class="sp-theme-desc">レッド × ホワイト × グラファイト</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-galaxy" data-sp-theme-choice="galaxy" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">GALAXY Color</span><span class="sp-theme-desc">Deep Space / 青紫の星雲</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-editorial" data-sp-theme-choice="editorial" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">EDITORIAL</span><span class="sp-theme-desc">PRINT JOURNAL / 紙の雑誌</span></span></button>
        </div>
      </section>
      <section class="sp-settings-section">
        <h3 class="sp-settings-section-title">モーション</h3>
        <p class="sp-settings-section-caption">アニメーションを好みに合わせて調整できます。</p>
        <div class="sp-settings-row">
          <div class="sp-settings-row-copy"><span class="sp-settings-row-title">モーション演出</span><span class="sp-settings-row-description">見出しやボタンなどの動きを有効にする</span></div>
          <button type="button" class="sp-switch" id="spMotionToggle" role="switch" aria-label="モーション演出" aria-checked="true"></button>
        </div>
      </section>
      <section class="sp-settings-section">
        <button type="button" class="sp-settings-reset" id="spSettingsReset">設定を初期状態に戻す</button>
        <p class="sp-settings-footnote">設定はこのブラウザに保存され、次回の訪問時にも適用されます。</p>
      </section>`;
    if (settings.language === "en") {
      panel.querySelector("#spSettingsTitle").textContent = "Settings";
      panel.querySelector("#spSettingsClose").setAttribute("aria-label", "Close settings");
      panel.querySelector(".sp-settings-subtitle").textContent = "STUDIO PEOPLE / PERSONALIZE";
      const sectionTitles = panel.querySelectorAll(".sp-settings-section-title");
      if (sectionTitles[0]) sectionTitles[0].textContent = "Language";
      if (sectionTitles[1]) sectionTitles[1].textContent = "Appearance & theme";
      if (sectionTitles[2]) sectionTitles[2].textContent = "Motion";
      const captions = panel.querySelectorAll(".sp-settings-section-caption");
      if (captions[0]) captions[0].textContent = "Choose the language used by the site.";
      if (captions[1]) captions[1].textContent = "Change the look and color palette of Studio People.";
      if (captions[2]) captions[2].textContent = "Adjust animations to your preference.";
      const themeDescriptions = {
        "standard": "White × Blue",
        "midnight": "Deep navy",
        "dark": "Dark × Light blue",
        "sky": "Pale sky blue",
        "mono-black": "Black × Gray",
        "mono-white": "White × Black",
        "greige": "Beige × Charcoal",
        "play-button-minimal": "Red × White × Graphite",
        "galaxy": "Deep Space / Blue-violet nebula",
        "editorial": "PRINT JOURNAL / Paper magazine"
      };
      panel.querySelectorAll("[data-sp-theme-choice]").forEach(function (button) {
        const description = button.querySelector(".sp-theme-desc");
        if (description && themeDescriptions[button.dataset.spThemeChoice]) description.textContent = themeDescriptions[button.dataset.spThemeChoice];
      });
      const motionTitle = panel.querySelector(".sp-settings-row-title");
      const motionDescription = panel.querySelector(".sp-settings-row-description");
      if (motionTitle) motionTitle.textContent = "Motion effects";
      if (motionDescription) motionDescription.textContent = "Enable movement in headings, buttons, and other elements";
      panel.querySelector("#spMotionToggle").setAttribute("aria-label", "Motion effects");
      panel.querySelector("#spSettingsReset").textContent = "Reset settings";
      panel.querySelector(".sp-settings-footnote").textContent = "Settings are saved in this browser and applied on your next visit.";
      panel.querySelector(".sp-settings-reset").setAttribute("aria-label", "Reset settings");
    }

    document.body.append(backdrop, panel);

    const menuPanel = document.getElementById("menuPanel");
    const closeButton = document.getElementById("spSettingsClose");
    const motionToggle = document.getElementById("spMotionToggle");
    const resetButton = document.getElementById("spSettingsReset");
    const themeButtons = Array.from(panel.querySelectorAll("[data-sp-theme-choice]"));
    const languageButtons = Array.from(panel.querySelectorAll("[data-sp-language-choice]"));

    function applySettings(persist) {
      document.body.dataset.spTheme = settings.theme;
      let editorialStylesheet = document.getElementById("spEditorialStylesheet");
      if (!editorialStylesheet) {
        editorialStylesheet = document.createElement("link");
        editorialStylesheet.id = "spEditorialStylesheet";
        editorialStylesheet.rel = "stylesheet";
        editorialStylesheet.href = new URL("editorial.css?v=1", SETTINGS_SCRIPT_URL).href;
        document.head.appendChild(editorialStylesheet);
      }
      let galaxyStylesheet = document.getElementById("spGalaxyStylesheet");
      if (!galaxyStylesheet) {
        galaxyStylesheet = document.createElement("link");
        galaxyStylesheet.id = "spGalaxyStylesheet";
        galaxyStylesheet.rel = "stylesheet";
        galaxyStylesheet.href = new URL("galaxy.css?v=1", SETTINGS_SCRIPT_URL).href;
        document.head.appendChild(galaxyStylesheet);
      }
      document.body.classList.toggle("sp-reduce-motion", !settings.motion);
      themeButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.spThemeChoice === settings.theme));
      });
      motionToggle.setAttribute("aria-checked", String(settings.motion));
      languageButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.spLanguageChoice === settings.language));
      });
      if (persist) saveSettings(settings);
    }

    function closeSettings(returnFocus) {
      panel.classList.remove("active");
      backdrop.classList.remove("active");
      settingsButton.setAttribute("aria-expanded", "false");
      settingsButton.setAttribute("aria-label", settings.language === "en" ? "Open settings" : "設定を開く");
      backdrop.setAttribute("aria-hidden", "true");
      if (returnFocus) settingsButton.focus({ preventScroll: true });
    }

    function openSettings() {
      if (menuPanel && menuPanel.classList.contains("active")) menuButton.click();
      panel.classList.add("active");
      backdrop.classList.add("active");
      settingsButton.setAttribute("aria-expanded", "true");
      settingsButton.setAttribute("aria-label", settings.language === "en" ? "Close settings" : "設定を閉じる");
      backdrop.setAttribute("aria-hidden", "false");
      closeButton.focus({ preventScroll: true });
    }

    settingsButton.addEventListener("click", function () {
      if (panel.classList.contains("active")) closeSettings(false);
      else openSettings();
    });
    menuButton.addEventListener("click", function () {
      if (panel.classList.contains("active")) closeSettings(false);
    }, true);
    closeButton.addEventListener("click", function () { closeSettings(true); });
    backdrop.addEventListener("click", function () { closeSettings(true); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("active")) closeSettings(true);
    });
    themeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        settings.theme = button.dataset.spThemeChoice;
        applySettings(true);
      });
    });
    languageButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        settings.language = button.dataset.spLanguageChoice;
        saveSettings(settings);
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        const file = pathParts[pathParts.length - 1] === "en" ? "index.html" : (pathParts[pathParts.length - 1] || "index.html");
        const target = settings.language === "en" ? "/en/" + file : "/" + file;
        window.location.href = target;
      });
    });
    motionToggle.addEventListener("click", function () {
      settings.motion = !settings.motion;
      applySettings(true);
    });
    resetButton.addEventListener("click", function () {
      settings = { ...DEFAULTS };
      applySettings(true);
      if (currentIsEnglish) {
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        const file = pathParts[pathParts.length - 1] === "en" ? "index.html" : (pathParts[pathParts.length - 1] || "index.html");
        window.location.href = "/" + file;
      }
    });

    applySettings(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

/* Studio People — opening animation, aligned to the real page layout */
(function () {
  "use strict";

  var SETTINGS_KEY = "studioPeople.settings.v1";
  var TOTAL_MS = 3000;
  /* Temporary tuning mode: play on every page visit/reload. */
  var PLAY_EVERY_VISIT = true;
  var DAILY_KEY = "studioPeople.dailyOpening.v1";

  function shouldSkip() {
    if (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    if (document.body.classList.contains("sp-reduce-motion")) return true;

    try {
      var settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      if (settings && settings.motion === false) return true;
      if (!PLAY_EVERY_VISIT) {
        var now = new Date();
        var today = now.getFullYear() + "-" +
          String(now.getMonth() + 1).padStart(2, "0") + "-" +
          String(now.getDate()).padStart(2, "0");
        if (localStorage.getItem(DAILY_KEY) === today) return true;
        localStorage.setItem(DAILY_KEY, today);
      }
    } catch (_) {
      if (!PLAY_EVERY_VISIT) return true;
    }
    return false;
  }

  function startOpening() {
    if (!document.body || shouldSkip()) return;

    var headerLogo = document.querySelector("header .logo");
    var homeTitle = document.querySelector(".hero h1");
    if (!headerLogo) return;

    var style = document.createElement("style");
    style.id = "sp-daily-opening-style";
    style.textContent = [
      "body.sp-opening-active header{animation:none!important;transform:none!important;}",
      "body.sp-opening-active .hero>*{animation:none!important;transform:none!important;}",
      "body.sp-opening-active .sp-opening-hidden{opacity:0!important;visibility:hidden!important;}",
      "body.sp-opening-settled header{animation:none!important;transform:none!important;}",
      "body.sp-opening-settled .hero>*{animation:none!important;transform:none!important;opacity:1!important;}",
      "#sp-daily-opening{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden;background:#fff;}",
      "#sp-daily-opening .sp-opening-curtain{position:absolute;inset:0;background:#fff;transform:translateY(0);will-change:transform;}",
      "#sp-daily-opening .sp-opening-logo,#sp-daily-opening .sp-opening-tagline{position:fixed;margin:0;will-change:left,top,font-size,transform;}",
      "#sp-daily-opening .sp-opening-logo{white-space:nowrap;font-family:'Bodoni Moda','Times New Roman',serif;font-size:clamp(2.1rem,7vw,4.2rem);font-weight:400;letter-spacing:0;line-height:1;color:#426791;}",
      "#sp-daily-opening .sp-opening-tagline{display:block;width:max-content;max-width:calc(100vw - 40px);white-space:normal;text-align:left;font-family:sans-serif;font-weight:700;color:#294967;}",
      "#sp-daily-opening .sp-opening-char{opacity:0;}",
      "@media(max-width:380px){#sp-daily-opening .sp-opening-logo{font-size:2rem}}"
    ].join("\n");
    document.head.appendChild(style);
    document.body.classList.add("sp-opening-active");

    headerLogo.classList.add("sp-opening-hidden");
    if (homeTitle) homeTitle.classList.add("sp-opening-hidden");

    var overlay = document.createElement("div");
    overlay.id = "sp-daily-opening";
    overlay.setAttribute("aria-hidden", "true");
    var curtain = document.createElement("div");
    curtain.className = "sp-opening-curtain";
    var logo = document.createElement("p");
    logo.className = "sp-opening-logo";
    logo.textContent = "Studio People";
    overlay.appendChild(curtain);
    overlay.appendChild(logo);

    var tagline = null;
    if (homeTitle) {
      tagline = document.createElement("p");
      tagline.className = "sp-opening-tagline";
      tagline.setAttribute("aria-label", "文房具を、ちょっと深く。");
      Array.from("文房具を、ちょっと深く。").forEach(function (character, index) {
        if (index === 5) tagline.appendChild(document.createElement("br"));
        var span = document.createElement("span");
        span.className = "sp-opening-char";
        span.textContent = character;
        tagline.appendChild(span);
      });
      overlay.appendChild(tagline);
    }
    document.body.appendChild(overlay);

    if (typeof logo.animate !== "function") {
      overlay.remove();
      style.remove();
      document.body.classList.remove("sp-opening-active");
      headerLogo.classList.remove("sp-opening-hidden");
      if (homeTitle) homeTitle.classList.remove("sp-opening-hidden");
      return;
    }

    /* Wait for the reset layout to be measured, avoiding animated/off-screen coordinates. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var headerRect = headerLogo.getBoundingClientRect();
        var headerStyle = window.getComputedStyle(headerLogo);
        var headerX = headerRect.left + headerRect.width / 2;
        var headerY = headerRect.top + headerRect.height / 2;
        var headerFontSize = parseFloat(headerStyle.fontSize) || 50;

        var startX = window.innerWidth / 2;
        var startY = window.innerHeight / 2;
        /* Keep the logo the same size throughout; animate its position only. */
        var logoFontSize = headerFontSize;
        logo.style.left = startX + "px";
        logo.style.top = startY + "px";
        logo.style.fontSize = logoFontSize + "px";
        logo.style.transform = "translate(-50%,-50%)";

        logo.animate([
          { left: startX + "px", top: startY + "px", fontSize: logoFontSize + "px", transform: "translate(-50%,-50%)", offset: 0 },
          { left: startX + "px", top: startY + "px", fontSize: logoFontSize + "px", transform: "translate(-50%,-50%)", offset: 0.14 },
          { left: headerX + "px", top: headerY + "px", fontSize: logoFontSize + "px", transform: "translate(-50%,-50%)", offset: 0.9 },
          { left: headerX + "px", top: headerY + "px", fontSize: logoFontSize + "px", transform: "translate(-50%,-50%)", offset: 1 }
        ], {
          duration: 2250,
          delay: 80,
          easing: "cubic-bezier(.65,0,.35,1)",
          fill: "forwards"
        });

        if (tagline) {
          /* Keep the tagline stationary: only the Studio People logo travels to the header. */
          tagline.style.left = startX + "px";
          tagline.style.top = (startY + 64) + "px";
          tagline.style.fontSize = "16px";
          tagline.style.lineHeight = "1.5";
          tagline.style.letterSpacing = ".02em";
          tagline.style.transform = "translate(-50%,-50%)";
          tagline.style.opacity = "1";

          Array.from(tagline.querySelectorAll(".sp-opening-char")).forEach(function (span, index) {
            span.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: 150,
              delay: 260 + index * 42,
              easing: "ease-out",
              fill: "forwards"
            });
          });
        }

        window.setTimeout(function () {
          if (tagline) {
            tagline.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: 180,
              easing: "ease-out",
              fill: "forwards"
            });
          }
          headerLogo.classList.remove("sp-opening-hidden");
          if (homeTitle) homeTitle.classList.remove("sp-opening-hidden");
          curtain.animate([
            { transform: "translateY(0)" },
            { transform: "translateY(-100%)" }
          ], {
            duration: 650,
            easing: "cubic-bezier(.65,0,.35,1)",
            fill: "forwards"
          });
        }, 2300);

        window.setTimeout(function () {
          overlay.remove();
          document.body.classList.remove("sp-opening-active");
          document.body.classList.add("sp-opening-settled");
          headerLogo.classList.remove("sp-opening-hidden");
          if (homeTitle) homeTitle.classList.remove("sp-opening-hidden");
        }, TOTAL_MS);
      });
    });
  }

  /* settings.js is loaded after the page markup; start immediately so the page's
     own entrance animations cannot appear before the white opening curtain. */
  if (document.body) {
    startOpening();
  } else {
    document.addEventListener("DOMContentLoaded", startOpening, { once: true });
  }
})();
