/* ============================================================
   Hinglish shared UI: theme, mobile nav, converter wiring,
   FAQ accordions, copy helpers, AdSense/GA placeholders.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Theme (day/night) ---------- */
  var THEME_KEY = "hinglish-theme";
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var toggles = document.querySelectorAll("[data-theme-toggle]");
    Array.prototype.forEach.call(toggles, function (b) {
      b.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      b.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
    var theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(theme);
    var toggles = document.querySelectorAll("[data-theme-toggle]");
    Array.prototype.forEach.call(toggles, function (b) {
      b.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      });
    });
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var btn = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- FAQ accordions ---------- */
  function initFaq(scope) {
    var items = (scope || document).querySelectorAll(".faq-item");
    Array.prototype.forEach.call(items, function (item) {
      var btn = item.querySelector(".faq-q");
      var panel = item.querySelector(".faq-a");
      if (!btn || !panel) return;
      btn.setAttribute("aria-expanded", "false");
      panel.style.maxHeight = "0px";
      btn.addEventListener("click", function () {
        var open = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
      });
    });
  }

  /* ---------- Converter wiring ---------- */
  function initConverter() {
    var widgets = document.querySelectorAll("[data-converter]");
    Array.prototype.forEach.call(widgets, function (w) {
      var dirTabs = w.querySelectorAll("[data-direction]");
      var segBtns = w.querySelectorAll("[data-scope]");
      var inArea = w.querySelector("[data-input]");
      var outEl = w.querySelector("[data-output]");
      var swapBtn = w.querySelector("[data-swap]");
      var copyBtn = w.querySelector("[data-copy]");
      var clearBtn = w.querySelector("[data-clear]");
      var convertBtn = w.querySelector("[data-convert]");
      var inLabel = w.querySelector("[data-label-in]");
      var outLabel = w.querySelector("[data-label-out]");
      var statsEl = w.querySelector("[data-stats]");
      var bannerEl = w.querySelector("[data-result-banner]");
      var bannerText = w.querySelector("[data-result-banner-text]");
      var placeholderEl = outEl ? outEl.querySelector("[data-output-placeholder]") : null;

      if (!inArea || !outEl) return;
      var direction = dirTabs.length ? null : "hinglish-to-hindi";
      var scope = "sentence";

      Array.prototype.forEach.call(dirTabs, function (t) {
        t.addEventListener("click", function () {
          direction = t.getAttribute("data-direction");
          Array.prototype.forEach.call(dirTabs, function (o) {
            var sel = o === t;
            o.setAttribute("aria-selected", sel ? "true" : "false");
          });
          updateLabels();
          if (inArea.value.trim()) run();
        });
      });
      Array.prototype.forEach.call(segBtns, function (s) {
        s.addEventListener("click", function () {
          scope = s.getAttribute("data-scope");
          Array.prototype.forEach.call(segBtns, function (o) {
            o.setAttribute("aria-pressed", o === s ? "true" : "false");
          });
          if (inArea.value.trim()) run();
        });
      });

      function updateLabels() {
        var d = direction || "hinglish-to-hindi";
        var lab = window.HINGLISH_CONVERTER.labels[d];
        if (inLabel) inLabel.innerHTML = '<span class="dot dot--saffron"></span>' + lab[0];
        if (outLabel) outLabel.innerHTML = '<span class="dot dot--teal"></span>' + lab[1];
      }

      function run() {
        var res = window.HINGLISH_CONVERTER.convert(inArea.value, direction);
        if (bannerEl) bannerEl.classList.remove("show");
        if (statsEl) statsEl.innerHTML = "<strong>" + count(res.output) + "</strong> chars · <strong>" +
          count(res.output.split(/\s+/)) + "</strong> tokens · <strong>" + res.details.length +
          "</strong> mapped";
        if (placeholderEl) placeholderEl.style.display = "none";
        outEl.textContent = res.output || "";
        if (bannerEl && bannerElText(res, scope)) {
          bannerEl.classList.add("show");
        }
      }
      function bannerElText(res, sc) {
        if (sc === "word" && res.details.length) {
          if (bannerText) {
            bannerText.innerHTML = res.details.slice(0, 5).map(function (d) {
              return "<strong>" + escapeHtml(d.from) + "</strong> → " + escapeHtml(d.to);
            }).join("  ·  ");
            if (res.details.length > 5) bannerText.innerHTML += "  ·  …";
          }
          return true;
        }
        if (bannerText) bannerText.innerHTML = "";
        return res.details.length >= 3 && false;
      }

      if (swapBtn) swapBtn.addEventListener("click", function () {
        var d = direction;
        if (d === "hinglish-to-hindi") direction = "hindi-to-hinglish";
        else if (d === "hindi-to-hinglish") direction = "hinglish-to-hindi";
        else if (d === "hinglish-to-english") direction = "english-to-hinglish";
        else if (d === "english-to-hinglish") direction = "hinglish-to-english";
        var myOut = outEl.textContent;
        inArea.value = myOut;
        outEl.textContent = "";
        if (placeholderEl) placeholderEl.style.display = "";
        inArea.dispatchEvent(new Event("input"));
        Array.prototype.forEach.call(dirTabs, function (o) {
          o.setAttribute("aria-selected", o.getAttribute("data-direction") === direction ? "true" : "false");
        });
        updateLabels();
      });
      if (copyBtn) copyBtn.addEventListener("click", function () {
        var text = outEl.textContent || "";
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            var old = copyBtn.getAttribute("aria-label");
            copyBtn.setAttribute("aria-label", "Copied");
            setTimeout(function () { copyBtn.setAttribute("aria-label", old || "Copy"); }, 1200);
          });
        }
      });
      if (clearBtn) clearBtn.addEventListener("click", function () {
        inArea.value = "";
        outEl.textContent = "";
        if (placeholderEl) placeholderEl.style.display = "";
        if (statsEl) statsEl.innerHTML = "";
        if (bannerEl) bannerEl.classList.remove("show");
        if (convertBtn) convertBtn.disabled = true;
      });
      if (inArea) {
        inArea.addEventListener("input", function () {
          if (convertBtn) convertBtn.disabled = !inArea.value.trim();
          if (inArea.value.trim()) run(); else {
            outEl.textContent = "";
            if (placeholderEl) placeholderEl.style.display = "";
            if (statsEl) statsEl.innerHTML = "";
          }
        });
        if (inArea.value.trim()) run();
      }
      if (convertBtn) {
        convertBtn.disabled = !(inArea.value || "").trim();
        convertBtn.addEventListener("click", run);
      }
      updateLabels();
    });
  }

  function count(s) {
    return String(s).length;
  }
  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  /* ---------- Ad placeholder helper ---------- */
  /* When you receive your AdSense snippet, paste it directly into
     the <div class="ad-slot"> blocks in each HTML page (replace the
     placeholder text) OR replace the slot below with the auto ads code.
     No further JS wiring is required. */
  function initAds() { /* reserved */ }

  /* ---------- Analytics (Cloudflare Web Analytics) ---------- */
  /* Enable in Cloudflare dashboard: Pages > hinglish > Analytics.
     The beacon is injected by Cloudflare automatically once enabled. */

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initNav();
    initFaq(document);
    initConverter();
    waitForCaptions();
  });
  function waitForCaptions() {
    if (window.HINGLISH_CAPTIONS) window.HINGLISH_CAPTIONS.init(document);
    else setTimeout(waitForCaptions, 200);
  }
})();