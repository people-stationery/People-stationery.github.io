(function () {
  "use strict";
  const STORAGE_KEY = "studioPeople.settings.v1";
  const DEFAULTS = { theme: "standard", motion: true };
  const THEMES = ["standard", "midnight", "dark", "sky"];

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return {
        theme: saved && THEMES.includes(saved.theme) ? saved.theme : DEFAULTS.theme,
        motion: saved && typeof saved.motion === "boolean" ? saved.motion : DEFAULTS.motion
      };
    } catch (_) { return { ...DEFAULTS }; }
  }

  function saveSettings(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (_) {}
  }

  function init() {
    const menuButton = document.getElementById("menuButton");
    if (!menuButton || !document.body) return;

    let settings = loadSettings();
    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "sp-settings-button";
    settingsButton.id = "spSettingsButton";
    settingsButton.setAttribute("aria-label", "設定を開く");
    settingsButton.setAttribute("aria-expanded", "false");
    settingsButton.setAttribute("aria-controls", "spSettingsPanel");
    settingsButton.title = "設定";
    settingsButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z" stroke="currentColor" stroke-width="1.7"/><path d="m19.4 13.5 1.1.8-1.1 1.9-1.3-.5a7.8 7.8 0 0 1-1.6.9l-.2 1.4h-2.2l-.3-1.4a7.8 7.8 0 0 1-1.7-.5l-1.1.8-1.9-1.1.5-1.3a7.8 7.8 0 0 1-.9-1.6l-1.4-.2v-2.2l1.4-.3a7.8 7.8 0 0 1 .5-1.7l-.8-1.1 1.1-1.9 1.3.5a7.8 7.8 0 0 1 1.6-.9l.2-1.4h2.2l.3 1.4a7.8 7.8 0 0 1 1.7.5l1.1-.8 1.9 1.1-.5 1.3a7.8 7.8 0 0 1 .9 1.6l1.4.2v2.2l-1.4.3" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" /></svg>';
    menuButton.insertAdjacentElement("beforebegin", settingsButton);

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
        <h3 class="sp-settings-section-title">外観・テーマカラー</h3>
        <p class="sp-settings-section-caption">Studio Peopleの色合いを切り替えます。</p>
        <div class="sp-theme-grid">
          <button type="button" class="sp-theme-option sp-theme-standard" data-sp-theme-choice="standard" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Standard</span><span class="sp-theme-desc">白 × 青</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-midnight" data-sp-theme-choice="midnight" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Midnight</span><span class="sp-theme-desc">深いネイビー</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-dark" data-sp-theme-choice="dark" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Dark</span><span class="sp-theme-desc">暗色 × 水色</span></span></button>
          <button type="button" class="sp-theme-option sp-theme-sky" data-sp-theme-choice="sky" aria-pressed="false"><span class="sp-theme-preview" aria-hidden="true"></span><span><span class="sp-theme-name">Sky</span><span class="sp-theme-desc">淡い空色</span></span></button>
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
    document.body.append(backdrop, panel);

    const menuPanel = document.getElementById("menuPanel");
    const closeButton = document.getElementById("spSettingsClose");
    const motionToggle = document.getElementById("spMotionToggle");
    const resetButton = document.getElementById("spSettingsReset");
    const themeButtons = Array.from(panel.querySelectorAll("[data-sp-theme-choice]"));

    function applySettings(persist) {
      document.body.dataset.spTheme = settings.theme;
      document.body.classList.toggle("sp-reduce-motion", !settings.motion);
      themeButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.spThemeChoice === settings.theme));
      });
      motionToggle.setAttribute("aria-checked", String(settings.motion));
      if (persist) saveSettings(settings);
    }

    function closeSettings(returnFocus) {
      panel.classList.remove("active");
      backdrop.classList.remove("active");
      settingsButton.setAttribute("aria-expanded", "false");
      settingsButton.setAttribute("aria-label", "設定を開く");
      backdrop.setAttribute("aria-hidden", "true");
      if (returnFocus) settingsButton.focus({ preventScroll: true });
    }

    function openSettings() {
      if (menuPanel && menuPanel.classList.contains("active")) menuButton.click();
      panel.classList.add("active");
      backdrop.classList.add("active");
      settingsButton.setAttribute("aria-expanded", "true");
      settingsButton.setAttribute("aria-label", "設定を閉じる");
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
    motionToggle.addEventListener("click", function () {
      settings.motion = !settings.motion;
      applySettings(true);
    });
    resetButton.addEventListener("click", function () {
      settings = { ...DEFAULTS };
      applySettings(true);
    });

    applySettings(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();