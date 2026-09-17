/* ============================================================
   Hinglish caption generator
   Builds Hinglish captions from templates + user tone/emoji.
   Exposed: HINGLISH_CAPTIONS
   ============================================================ */
(function (global) {
  "use strict";

  var HIN = (global.HIN || {});
  var templates = (HIN.captions || {}).templates || {};
  var emojis = (HIN.captions || {}).emojis || [];
  var moodList = (HIN.captions || {}).moods || [];

  function generate(mood, count) {
    mood = mood || "motivation";
    count = count || 4;
    var pool = templates[mood] || templates.motivation;
    var results = [];
    var used = {};
    for (var i = 0; i < Math.min(count, pool.length); i++) {
      var idx = Math.floor(Math.random() * pool.length);
      if (used[idx]) { i--; continue; }
      used[idx] = true;
      var line = pool[idx];
      if (Math.random() > 0.4 && emojis.length) {
        line = line + " " + emojis[Math.floor(Math.random() * emojis.length)];
      }
      results.push(line);
    }
    return results;
  }

  /* Wire up a caption generator block on the page. */
  function init(root) {
    root = root || document;
    var boxes = root.querySelectorAll("[data-caption-generator]");
    Array.prototype.forEach.call(boxes, function (box) {
      var moodSel = box.querySelector("[data-caption-mood]");
      var countSel = box.querySelector("[data-caption-count]");
      var genBtn = box.querySelector("[data-caption-generate]");
      var listEl = box.querySelector("[data-caption-list]");
      var copyBtn = box.querySelector("[data-caption-copy]");
      if (!moodSel || !genBtn || !listEl) return;

      if (moodSel) moodSel.innerHTML = moodList
        .map(function (m) { return '<option value="' + m + '">' + m + "</option>"; })
        .join("");

      genBtn.addEventListener("click", function () {
        var mood = moodSel ? moodSel.value : "motivation";
        var count = countSel ? parseInt(countSel.value, 10) || 4 : 4;
        var items = generate(mood, count);
        listEl.innerHTML = "";
        items.forEach(function (text) {
          var li = document.createElement("li");
          li.className = "caption-item";
          li.textContent = text;
          listEl.appendChild(li);
        });
      });

      if (copyBtn) {
        copyBtn.addEventListener("click", function () {
          var text = Array.prototype.map.call(listEl.querySelectorAll(".caption-item"), function (li) {
            return li.textContent;
          }).join("\n");
          if (!text) return;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
              copyBtn.textContent = "Copied";
              setTimeout(function () { copyBtn.textContent = "Copy all"; }, 1500);
            });
          } else {
            copyBtn.textContent = "Select text & copy";
            setTimeout(function () { copyBtn.textContent = "Copy all"; }, 1500);
          }
        });
      }

      genBtn.click();
    });
  }

  global.HINGLISH_CAPTIONS = { init: init, generate: generate, moods: moodList };
})(typeof window !== "undefined" ? window : this);