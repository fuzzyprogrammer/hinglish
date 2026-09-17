/* ============================================================
   Hinglish shared UI v2: theme, mobile nav, converter wiring,
   suggestions, toolbar, keyboard, actions, FAQ accordions.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Theme ---------- */
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

  /* ---------- Toast ---------- */
  function showToast(msg) {
    var container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    var toast = document.createElement("div");
    toast.className = "toast-ping";
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2500);
  }

  /* ---------- Escape HTML ---------- */
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
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
      var convertBtn = w.querySelector("[data-convert]");
      var inLabel = w.querySelector("[data-label-in]");
      var outLabel = w.querySelector("[data-label-out]");
      var statsEl = w.querySelector("[data-stats]");
      var bannerEl = w.querySelector("[data-result-banner]");
      var bannerText = w.querySelector("[data-result-banner-text]");
      var placeholderEl = outEl ? outEl.querySelector("[data-output-placeholder]") : null;
      var clearBtns = w.querySelectorAll("[data-clear]");
      var copyBtns = w.querySelectorAll("[data-copy]");

      if (!inArea || !outEl) return;

      /* Read default direction */
      var direction = null;
      Array.prototype.forEach.call(dirTabs, function (t) {
        if (t.getAttribute("aria-selected") === "true") direction = t.getAttribute("data-direction");
      });
      if (!direction) direction = "hinglish-to-hindi";
      var scope = "sentence";
      var hinglishMode = true; /* true = type in English to get Hindi suggestions */

      /* --- Build toolbar --- */
      var toolbar = document.createElement("div");
      toolbar.className = "tool-toolbar";
      toolbar.innerHTML =
        '<span class="tb-label">Mode:</span>' +
        '<button class="tb-btn active" data-tb-mode="hinglish" title="Hinglish mode (type English → get Hindi)">अ/abc</button>' +
        '<button class="tb-btn" data-tb-mode="english" title="English mode (no conversion)">abc</button>' +
        '<span class="tb-sep"></span>' +
        '<button class="tb-btn" data-tb-toggle="fullstop" title="Toggle . → । in Hindi mode">।</button>' +
        '<button class="tb-btn" data-tb-toggle="numbers" title="Toggle 123 → १२३">१२३</button>' +
        '<span class="tb-sep"></span>' +
        '<button class="tb-btn" data-tb-action="voice" title="Voice typing (Web Speech API)">🎤</button>' +
        '<button class="tb-btn" data-tb-action="emoji" title="Insert emoji">😊</button>' +
        '<button class="tb-btn" data-tb-action="keyboard" title="On-screen Devanagari keyboard">⌨</button>';
      w.insertBefore(toolbar, w.querySelector(".scope-row"));

      var tbModeBtns = toolbar.querySelectorAll("[data-tb-mode]");
      var tbFullstop = toolbar.querySelector("[data-tb-toggle='fullstop']");
      var tbNumbers = toolbar.querySelector("[data-tb-toggle='numbers']");
      var tbVoice = toolbar.querySelector("[data-tb-action='voice']");
      var tbEmoji = toolbar.querySelector("[data-tb-action='emoji']");
      var tbKeyboard = toolbar.querySelector("[data-tb-action='keyboard']");

      var fullstopOn = false;
      var numbersOn = false;
      var voiceActive = false;
      var recognition = null;

      /* Mode toggle */
      Array.prototype.forEach.call(tbModeBtns, function (btn) {
        btn.addEventListener("click", function () {
          var mode = btn.getAttribute("data-tb-mode");
          hinglishMode = (mode === "hinglish");
          Array.prototype.forEach.call(tbModeBtns, function (b) {
            b.classList.toggle("active", b.getAttribute("data-tb-mode") === mode);
          });
          showToast(hinglishMode ? "अ/abc — Hinglish mode" : "abc — English mode");
        });
      });

      /* Full-stop toggle */
      if (tbFullstop) tbFullstop.addEventListener("click", function () {
        fullstopOn = !fullstopOn;
        tbFullstop.classList.toggle("active", fullstopOn);
        showToast(fullstopOn ? "। mode ON" : "। mode OFF");
      });

      /* Number toggle */
      if (tbNumbers) tbNumbers.addEventListener("click", function () {
        numbersOn = !numbersOn;
        tbNumbers.classList.toggle("active", numbersOn);
        showToast(numbersOn ? "Devanagari numbers ON" : "Normal numbers ON");
      });

      /* Voice typing */
      if (tbVoice) tbVoice.addEventListener("click", function () {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
          showToast("⚠ Voice typing not supported in this browser");
          return;
        }
        if (voiceActive) {
          if (recognition) recognition.stop();
          voiceActive = false;
          tbVoice.classList.remove("active");
          showToast("🎤 Voice typing stopped");
          return;
        }
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SR();
        recognition.lang = hinglishMode ? "hi-IN" : "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = function (e) {
          var transcript = "";
          for (var i = e.resultIndex; i < e.results.length; i++) {
            transcript += e.results[i][0].transcript;
          }
          inArea.value += transcript;
          inArea.dispatchEvent(new Event("input"));
        };
        recognition.onerror = function () { showToast("⚠ Voice error — try again"); };
        recognition.onend = function () {
          if (voiceActive) recognition.start();
        };
        recognition.start();
        voiceActive = true;
        tbVoice.classList.add("active");
        showToast("🎤 Listening...");
      });

      /* Emoji picker */
      var emojiPicker = null;
      if (tbEmoji) tbEmoji.addEventListener("click", function () {
        if (emojiPicker && emojiPicker.parentNode) {
          emojiPicker.parentNode.removeChild(emojiPicker);
          emojiPicker = null;
          return;
        }
        var emojis = "😀😂🤣😍🥰😎🤩🤔😮😢😡🥳😴🤯🙌💪🔥❤️💯✨🎉👏🙏😏🙄😬🤯🫡🤩🥳😎😊🥰😍🤩😎🥳😊😅🤣😂😁🤔😏🙄😬😮‍💨🤯🫠😴🥱😪😮😪😢😭😤😡🤬😈👿💀👻👽🤖💩🤡👹👺😸😺😻🙀😿😾😼😽🙀😿😾😸😺😻🙀😿😾😼😽🙀😿😾";
        emojiPicker = document.createElement("div");
        emojiPicker.className = "suggestion-list show";
        emojiPicker.style.flexWrap = "wrap";
        emojiPicker.style.maxWidth = "320px";
        emojiPicker.style.padding = "8px";
        for (var i = 0; i < emojis.length; i++) {
          var span = document.createElement("li");
          span.textContent = emojis[i];
          span.style.padding = "5px 7px";
          span.style.fontSize = "1.3rem";
          span.style.cursor = "pointer";
          span.addEventListener("click", function () {
            inArea.value += this.textContent;
            inArea.dispatchEvent(new Event("input"));
            inArea.focus();
          });
          emojiPicker.appendChild(span);
        }
        toolbar.appendChild(emojiPicker);
      });

      /* On-screen keyboard */
      var kbEl = null;
      if (tbKeyboard) tbKeyboard.addEventListener("click", function () {
        if (kbEl && kbEl.classList.contains("show")) {
          kbEl.classList.remove("show");
          tbKeyboard.classList.remove("active");
          return;
        }
        if (!kbEl) {
          kbEl = document.createElement("div");
          kbEl.className = "deva-keyboard";
          var kb = window.HINGLISH_CONVERTER.keyboardData;
          if (kb) {
            var sections = [
              { title: "Vowels", keys: kb.vowels },
              { title: "Matras", keys: kb.matras },
              { title: "Consonants", keys: kb.consonants },
              { title: "Additional", keys: kb.extra },
              { title: "Punctuation", keys: kb.punctuation }
            ];
            sections.forEach(function (sec) {
              var div = document.createElement("div");
              div.className = "kb-section";
              div.innerHTML = '<div class="kb-title">' + sec.title + '</div><div class="kb-row"></div>';
              var row = div.querySelector(".kb-row");
              sec.keys.forEach(function (k) {
                var btn = document.createElement("button");
                btn.className = "kb-key";
                btn.textContent = k;
                btn.addEventListener("click", function () {
                  var pos = inArea.selectionStart || inArea.value.length;
                  inArea.value = inArea.value.slice(0, pos) + k + inArea.value.slice(pos);
                  inArea.dispatchEvent(new Event("input"));
                  inArea.focus();
                  inArea.setSelectionRange(pos + k.length, pos + k.length);
                });
                row.appendChild(btn);
              });
              kbEl.appendChild(div);
            });
          }
          w.appendChild(kbEl);
        }
        kbEl.classList.toggle("show");
        tbKeyboard.classList.toggle("active");
      });

      /* --- Suggestion dropdown --- */
      var sugList = null;
      var sugSelectedIdx = -1;
      var sugWords = [];

      function showSuggestions(suggestions, word) {
        if (!sugList) {
          sugList = document.createElement("ul");
          sugList.className = "suggestion-list";
          w.appendChild(sugList);
        }
        sugList.innerHTML = "";
        sugWords = suggestions;
        sugSelectedIdx = 0;
        suggestions.forEach(function (s, idx) {
          var li = document.createElement("li");
          li.innerHTML = '<span class="sug-hi">' + esc(s) + '</span><span class="sug-en">' + esc(word) + '</span>';
          if (idx === 0) li.className = "selected";
          li.addEventListener("click", function () {
            applySuggestion(s, word);
          });
          sugList.appendChild(li);
        });
        sugList.classList.add("show");
      }

      function hideSuggestions() {
        if (sugList) sugList.classList.remove("show");
        sugSelectedIdx = -1;
        sugWords = [];
      }

      function applySuggestion(suggestion, originalWord) {
        var val = inArea.value;
        var pos = inArea.selectionStart;
        var before = val.slice(0, pos);
        var after = val.slice(pos);
        /* Find the start of the current word */
        var wordStart = before.lastIndexOf(" ");
        if (wordStart === -1) wordStart = 0; else wordStart += 1;
        var prefix = val.slice(0, wordStart);
        var suffix = after.replace(/^\S+/, "");
        inArea.value = prefix + suggestion + " " + suffix;
        var newPos = prefix.length + suggestion.length + 1;
        inArea.setSelectionRange(newPos, newPos);
        inArea.dispatchEvent(new Event("input"));
        hideSuggestions();
        inArea.focus();
      }

      function handleSuggestionKeys(e) {
        if (!sugList || !sugList.classList.contains("show")) return false;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          sugSelectedIdx = Math.min(sugSelectedIdx + 1, sugWords.length - 1);
          updateSugHighlight();
          return true;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          sugSelectedIdx = Math.max(sugSelectedIdx - 1, 0);
          updateSugHighlight();
          return true;
        } else if (e.key === "Enter" || e.key === " ") {
          if (sugSelectedIdx >= 0 && sugSelectedIdx < sugWords.length) {
            e.preventDefault();
            var val = inArea.value;
            var pos = inArea.selectionStart;
            var before = val.slice(0, pos);
            var wordStart = before.lastIndexOf(" ");
            if (wordStart === -1) wordStart = 0; else wordStart += 1;
            var originalWord = val.slice(wordStart, pos);
            applySuggestion(sugWords[sugSelectedIdx], originalWord);
            return true;
          }
        } else if (e.key === "Escape") {
          hideSuggestions();
          return true;
        }
        return false;
      }

      function updateSugHighlight() {
        if (!sugList) return;
        var items = sugList.querySelectorAll("li");
        Array.prototype.forEach.call(items, function (li, i) {
          li.classList.toggle("selected", i === sugSelectedIdx);
        });
      }

      /* --- Tab switching --- */
      Array.prototype.forEach.call(dirTabs, function (t) {
        t.addEventListener("click", function () {
          direction = t.getAttribute("data-direction");
          Array.prototype.forEach.call(dirTabs, function (o) {
            o.setAttribute("aria-selected", o === t ? "true" : "false");
          });
          updateLabels();
          run(true);
        });
      });
      Array.prototype.forEach.call(segBtns, function (s) {
        s.addEventListener("click", function () {
          scope = s.getAttribute("data-scope");
          Array.prototype.forEach.call(segBtns, function (o) {
            o.setAttribute("aria-pressed", o === s ? "true" : "false");
          });
          showToast("Scope: " + scope.toUpperCase());
          run(true);
        });
      });

      function updateLabels() {
        var d = direction || "hinglish-to-hindi";
        var lab = window.HINGLISH_CONVERTER.labels[d];
        if (lab) {
          if (inLabel) inLabel.innerHTML = '<span class="dot dot--saffron"></span>' + lab[0];
          if (outLabel) outLabel.innerHTML = '<span class="dot dot--teal"></span>' + lab[1];
        }
      }

      function run(silent) {
        var res = window.HINGLISH_CONVERTER.convert(inArea.value, direction);
        if (bannerEl) bannerEl.classList.remove("show");
        if (statsEl) {
          var chars = (res.output || "").length;
          var tokens = (res.output || "").split(/\s+/).filter(Boolean).length;
          statsEl.innerHTML = "<strong>" + chars + "</strong> chars · <strong>" + tokens + "</strong> words · <strong>" + res.details.length + "</strong> mapped";
        }
        if (placeholderEl) placeholderEl.style.display = "none";
        outEl.textContent = res.output || "";
        if (bannerEl && scope === "word" && res.details.length) {
          if (bannerText) {
            bannerText.innerHTML = res.details.slice(0, 5).map(function (d) {
              return "<strong>" + esc(d.from) + "</strong> → " + esc(d.to);
            }).join("  ·  ");
          }
          bannerEl.classList.add("show");
        }
        if (!silent && res.output) showToast("✨ Converted!");
      }

      /* --- Swap --- */
      function doSwap() {
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
        showToast("🔄 Swapped direction");
      }

      /* --- Clear --- */
      function doClearInput() {
        inArea.value = "";
        outEl.textContent = "";
        if (placeholderEl) placeholderEl.style.display = "";
        if (statsEl) statsEl.innerHTML = "";
        if (bannerEl) bannerEl.classList.remove("show");
        if (convertBtn) convertBtn.disabled = true;
        hideSuggestions();
        saveLocal();
        showToast("🧹 Input cleared");
      }
      function doClearOutput() {
        outEl.textContent = "";
        if (placeholderEl) placeholderEl.style.display = "";
        if (statsEl) statsEl.innerHTML = "";
        if (bannerEl) bannerEl.classList.remove("show");
        showToast("🧹 Output cleared");
      }
      function doClearAll() {
        inArea.value = "";
        outEl.textContent = "";
        if (placeholderEl) placeholderEl.style.display = "";
        if (statsEl) statsEl.innerHTML = "";
        if (bannerEl) bannerEl.classList.remove("show");
        if (convertBtn) convertBtn.disabled = true;
        hideSuggestions();
        saveLocal();
        showToast("🧹 Cleared all");
      }

      /* --- Copy --- */
      function doCopy() {
        var text = outEl.textContent || "";
        if (!text) { showToast("⚠ Nothing to copy"); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { showToast("📋 Copied!"); });
        } else {
          var ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          showToast("📋 Copied!");
        }
      }

      /* --- Download .txt --- */
      function doDownloadTxt() {
        var text = outEl.textContent || "";
        if (!text) { showToast("⚠ Nothing to download"); return; }
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "hinglish-output.txt";
        a.click();
        URL.revokeObjectURL(a.href);
        showToast("📥 Downloaded .txt");
      }

      /* --- Share WhatsApp --- */
      function doShareWhatsApp() {
        var text = outEl.textContent || inArea.value || "";
        if (!text) { showToast("⚠ Nothing to share"); return; }
        window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(text), "_blank");
        showToast("📤 Opening WhatsApp...");
      }

      /* --- Email --- */
      function doEmail() {
        var text = outEl.textContent || inArea.value || "";
        if (!text) { showToast("⚠ Nothing to email"); return; }
        window.location.href = "mailto:?subject=Hinglish%20Text&body=" + encodeURIComponent(text);
        showToast("📧 Opening email...");
      }

      /* --- localStorage save/restore --- */
      var LS_KEY = "hinglish_editor_" + (direction || "default");
      function saveLocal() {
        try { localStorage.setItem("hinglish_editor_text", inArea.value); } catch (e) { /* ignore */ }
      }
      function restoreLocal() {
        try {
          var saved = localStorage.getItem("hinglish_editor_text");
          if (saved && !inArea.value) { inArea.value = saved; inArea.dispatchEvent(new Event("input")); }
        } catch (e) { /* ignore */ }
      }

      /* --- Wire buttons --- */
      if (swapBtn) swapBtn.addEventListener("click", doSwap);
      Array.prototype.forEach.call(copyBtns, function (btn) {
        btn.addEventListener("click", doCopy);
      });
      Array.prototype.forEach.call(clearBtns, function (btn, idx) {
        btn.addEventListener("click", idx === 0 ? doClearInput : doClearOutput);
      });

      /* --- Build action bar --- */
      var actionBar = document.createElement("div");
      actionBar.className = "action-bar";
      actionBar.innerHTML =
        '<button class="act-btn" data-act="copy" title="Copy output"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>Copy</button>' +
        '<button class="act-btn" data-act="txt" title="Download as .txt"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>.txt</button>' +
        '<button class="act-btn" data-act="whatsapp" title="Share on WhatsApp">💬 WhatsApp</button>' +
        '<button class="act-btn" data-act="email" title="Share via email">📧 Email</button>' +
        '<span class="act-counter" data-word-counter></span>';
      w.appendChild(actionBar);

      actionBar.querySelector("[data-act='copy']").addEventListener("click", doCopy);
      actionBar.querySelector("[data-act='txt']").addEventListener("click", doDownloadTxt);
      actionBar.querySelector("[data-act='whatsapp']").addEventListener("click", doShareWhatsApp);
      actionBar.querySelector("[data-act='email']").addEventListener("click", doEmail);

      var wordCounter = actionBar.querySelector("[data-word-counter]");

      /* --- Input handler (with suggestions) --- */
      inArea.addEventListener("input", function () {
        if (convertBtn) convertBtn.disabled = !inArea.value.trim();
        saveLocal();
        /* Word counter */
        if (wordCounter) {
          var wc = inArea.value.trim() ? inArea.value.trim().split(/\s+/).length : 0;
          var cc = inArea.value.length;
          wordCounter.textContent = wc + " words · " + cc + " chars";
        }
        /* Auto-convert */
        if (inArea.value.trim()) run(true); else {
          outEl.textContent = "";
          if (placeholderEl) placeholderEl.style.display = "";
          if (statsEl) statsEl.innerHTML = "";
        }
        /* Google Input Tools suggestions on SPACE */
        if (hinglishMode && direction === "hinglish-to-hindi") {
          var val = inArea.value;
          var pos = inArea.selectionStart;
          var before = val.slice(0, pos);
          var lastSpace = before.lastIndexOf(" ");
          var currentWord = (lastSpace === -1 ? before : before.slice(lastSpace + 1)).trim();
          if (currentWord.length >= 2 && /\s$/.test(val.slice(0, pos))) {
            /* Space was just pressed — fetch suggestions for the previous word */
            var prevSpace = before.slice(0, -1).lastIndexOf(" ");
            var prevWord = (prevSpace === -1 ? before.slice(0, -1) : before.slice(prevSpace + 1, -1)).trim();
            if (prevWord.length >= 2) {
              window.HINGLISH_CONVERTER.fetchSuggestions(prevWord, function (suggestions) {
                if (suggestions.length > 1) {
                  showSuggestions(suggestions, prevWord);
                }
              });
            }
          }
        }
      });

      /* --- Keyboard shortcuts in textarea --- */
      inArea.addEventListener("keydown", function (e) {
        /* Handle suggestion navigation first */
        if (sugList && sugList.classList.contains("show")) {
          if (handleSuggestionKeys(e)) return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(false); }
        else if (e.altKey && (e.key === "s" || e.key === "S")) { e.preventDefault(); doSwap(); }
        else if (e.altKey && (e.key === "c" || e.key === "C")) { e.preventDefault(); doCopy(); }
        else if (e.altKey && (e.key === "x" || e.key === "X")) { e.preventDefault(); doClearAll(); }
      });

      /* Close suggestions on blur */
      inArea.addEventListener("blur", function () {
        setTimeout(hideSuggestions, 200);
      });

      /* --- Convert button --- */
      if (convertBtn) {
        convertBtn.disabled = !(inArea.value || "").trim();
        convertBtn.addEventListener("click", function () { run(false); });
      }

      updateLabels();
      restoreLocal();
    });
  }

  /* ---------- Init ---------- */
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