/* ============================================================
   Hinglish shared UI v3: theme, mobile nav, converter wiring,
   suggestions, toolbar, keyboard, actions, FAQ accordions.
   Fixes: clean emoji picker, proper voice typing, stable suggestions.
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

  /* ---------- Emoji data (clean, categorized) ---------- */
  var EMOJI_DATA = {
    "Smileys": "\u{1F600}\u{1F603}\u{1F604}\u{1F601}\u{1F606}\u{1F605}\u{1F923}\u{1F602}\u{1F642}\u{1F609}\u{1F60C}\u{1F60A}\u{1F607}\u{1F970}\u{1F618}\u{1F970}\u{1F61D}\u{1F60B}\u{1F61B}\u{1F92A}\u{1F61C}\u{1F92B}\u{1F911}\u{1F914}\u{1F910}\u{1F928}\u{1F610}\u{1F611}\u{1F60F}\u{1F612}\u{1F644}\u{1F62C}\u{1F625}\u{1F60F}\u{1F614}\u{1F62A}\u{1F634}\u{1F624}\u{1F621}\u{1F92C}\u{1F631}\u{1F913}\u{1F9D0}\u{1F610}\u{1F615}\u{1F61F}\u{1F61E}\u{1F61A}\u{1F629}\u{1F62B}\u{1F62D}\u{1F630}\u{1F628}\u{1F633}\u{1F97A}\u{1F626}\u{1F627}\u{1F622}\u{1F625}\u{1F623}\u{1F62E}\u{1F631}\u{1F62F}\u{1F62C}\u{1F912}\u{1F975}\u{1F976}\u{1F974}\u{1F635}\u{1F92F}\u{1F920}\u{1F973}\u{1F978}\u{1F60E}\u{1F913}\u{1F9D0}",
    "Gestures": "\u{1F44B}\u{1F590}\u{1F44C}\u{1F44D}\u{1F44E}\u{1F44A}\u{1F446}\u{1F447}\u{1F448}\u{1F449}\u{270A}\u{1F44F}\u{1F64C}\u{1F932}\u{1F91D}\u{270B}\u{1F4AA}\u{1F442}\u{1F443}\u{1F440}\u{1F444}\u{1F445}\u{1F48B}\u{1F483}\u{1F46B}\u{1F469}\u{1F468}\u{1F467}\u{1F466}\u{1F469}\u{1F468}\u{1F9D1}\u{1F476}\u{1F9D2}\u{1F9D3}\u{1F474}\u{1F475}\u{1F471}\u{1F9D4}\u{1F9D5}\u{1F469}\u{1F468}\u{1F9B5}\u{1F9B6}\u{1F9B7}\u{1F9B4}",
    "Hearts": "\u2764\uFE0F\u{1F9E1}\u{1F49B}\u{1F49A}\u{1F499}\u{1F5A4}\u{1F90D}\u{1F90E}\u{1F494}\u{2763}\u{1F495}\u{1F496}\u{1F497}\u{1F498}\u{1F49D}\u{1F49E}\u{1F49F}\u{1F9E0}\u{1FA75}\u{1FA76}\u{1FA77}\u{1F90E}\u{1F90D}\u{1F493}\u{1F495}",
    "Nature": "\u{1F338}\u{1F490}\u{1F337}\u{1F339}\u{1F940}\u{1F33A}\u{1F33B}\u{1F33C}\u{1F33E}\u{1F331}\u{1F33F}\u{2618}\u{1F340}\u{1F342}\u{1F343}\u{1F335}\u{1F334}\u{1F332}\u{1F333}\u{1F344}\u{2600}\u{1F31E}\u{2B50}\u{1F31F}\u{1F31C}\u{1F319}\u{2601}\u{26C5}\u{2614}\u{1F308}\u{26A1}\u{1F30A}\u{1F30D}\u{1F30E}\u{1F30F}\u{1F310}\u{1F525}\u{2728}\u{1F31A}\u{1F31B}\u{1F31D}\u{1F31E}\u{1F309}\u{1F30B}\u{1F30C}\u{1F308}\u{2744}\u{2744}\u{26C4}\u{2603}\u{1F330}\u{1F33F}\u{1F343}\u{1F342}\u{1F341}\u{1F344}\u{1F33E}\u{1F349}\u{1F34A}\u{1F34B}\u{1F34C}\u{1F34D}\u{1F34E}\u{1F34F}\u{1F350}\u{1F351}\u{1F352}\u{1F353}\u{1F345}\u{1F346}\u{1F33D}\u{1F336}\u{1F337}\u{1F338}\u{1F339}\u{1F33A}\u{1F33B}\u{1F33C}\u{1F331}\u{1F332}\u{1F333}\u{1F334}\u{1F335}\u{1F30A}\u{1F305}\u{1F304}\u{1F306}\u{1F307}\u{1F303}\u{2B50}\u{2728}\u{1F308}\u{2601}\u{26C5}\u{2600}\u{2B50}\u{1F31F}\u{2734}\u{2733}\u{2735}\u{2736}\u{2737}\u{2738}\u{2747}\u{274E}\u{2749}\u{274A}\u{274B}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}\u{25FC}\u{25FD}\u{25FE}\u{2B1B}\u{2B1C}\u{3030}\u{303D}\u{2763}\u{2764}\u{2665}\u{2666}\u{2660}\u{2663}\u{2605}\u{2606}\u{2194}\u{2195}\u{2197}\u{2198}\u{2199}\u{2196}\u{2B05}\u{27A1}\u{2B06}\u{2B07}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}\u{25FC}\u{25FD}\u{25FE}\u{2B1B}\u{2B1C}\u{3030}\u{303D}\u{2763}\u{2764}\u{2665}\u{2666}\u{2660}\u{2663}\u{2605}\u{2606}\u{2194}\u{2195}\u{2197}\u{2198}\u{2199}\u{2196}\u{2B05}\u{27A1}\u{2B06}\u{2B07}\u{2934}\u{2935}",
    "Objects": "\u{1F389}\u{1F38A}\u{1F388}\u{1F381}\u{1F380}\u{1F3C6}\u{1F947}\u{1F948}\u{1F949}\u{26BD}\u{26BE}\u{26BE}\u{1F3C0}\u{1F3C8}\u{1F3B3}\u{1F3A3}\u{1F3AE}\u{1F3AF}\u{1F9E9}\u{1F3AD}\u{1F3A8}\u{1F3AC}\u{1F3A4}\u{1F3A7}\u{1F3B5}\u{1F941}\u{1F3B8}\u{1F3B9}\u{1F3BA}\u{1F3BB}\u{270D}\u{1F58C}\u{1F58D}\u{1F4DD}\u{1F4BC}\u{1F4C1}\u{1F4C2}\u{1F4C4}\u{1F4C5}\u{1F4C6}\u{1F4CB}\u{1F4CA}\u{1F4C8}\u{1F4C9}\u{1F4CC}\u{1F4CD}\u{1F4CE}\u{1F510}\u{1F511}\u{1F527}\u{1F529}\u{2699}\u{1F4A1}\u{1F526}\u{1F56F}\u{1F4B0}\u{1F4B3}\u{1F4B4}\u{1F4B5}\u{1F4B6}\u{1F4B7}\u{1F4B8}\u{1F4B9}\u{1F4BA}\u{1F4BB}\u{1F4BC}\u{1F4BD}\u{1F4BE}\u{1F4BF}\u{1F4C0}\u{1F5A5}\u{1F5A8}\u{2328}\u{1F5B1}\u{1F4F1}\u{1F4F2}\u{1F4DF}\u{1F4DE}\u{1F4E0}\u{1F4FA}\u{1F4FB}\u{1F50A}\u{1F50B}\u{1F50C}\u{26A1}\u{1F50D}\u{1F50E}\u{1F50F}\u{1F510}\u{1F512}\u{1F513}\u{1F514}\u{1F515}\u{1F516}\u{1F517}\u{1F518}\u{1F519}\u{1F51A}\u{1F51B}\u{1F51C}\u{1F51D}\u{1F51E}\u{1F51F}\u{1F520}\u{1F521}\u{1F522}\u{1F523}\u{1F524}\u{1F525}\u{1F526}\u{1F527}\u{1F528}\u{1F529}\u{1F52A}\u{1F52B}\u{1F52E}\u{1F52F}\u{1F530}\u{1F531}\u{1F532}\u{1F533}\u{1F534}\u{1F535}\u{1F536}\u{1F537}\u{1F538}\u{1F539}\u{1F53A}\u{1F53B}\u{1F53C}\u{1F53D}\u{1F53E}\u{1F53F}\u{1F540}\u{1F541}\u{1F542}\u{1F543}\u{1F544}\u{1F545}\u{1F546}\u{1F547}\u{1F548}\u{1F549}\u{1F54A}\u{1F54B}\u{1F54C}\u{1F54D}\u{1F54E}\u{1F54F}\u{1F550}\u{1F551}\u{1F552}\u{1F553}\u{1F554}\u{1F555}\u{1F556}\u{1F557}\u{1F558}\u{1F559}\u{1F55A}\u{1F55B}\u{1F55C}\u{1F55D}\u{1F55E}\u{1F55F}\u{1F560}\u{1F561}\u{1F562}\u{1F563}\u{1F564}\u{1F565}\u{1F566}\u{1F567}\u{1F568}\u{1F569}\u{1F56A}\u{1F56B}\u{1F56C}\u{1F56D}\u{1F56E}\u{1F56F}\u{1F570}\u{1F571}\u{1F572}\u{1F573}\u{1F574}\u{1F575}\u{1F576}\u{1F577}\u{1F578}\u{1F579}\u{1F57A}\u{1F57B}\u{1F57C}\u{1F57D}\u{1F57E}\u{1F57F}\u{1F580}\u{1F581}\u{1F582}\u{1F583}\u{1F584}\u{1F585}\u{1F586}\u{1F587}\u{1F588}\u{1F589}\u{1F58A}\u{1F58B}\u{1F58C}\u{1F58D}\u{1F58E}\u{1F58F}\u{1F590}\u{1F591}\u{1F592}\u{1F593}\u{1F594}\u{1F595}\u{1F596}\u{1F597}\u{1F598}\u{1F599}\u{1F59A}\u{1F59B}\u{1F59C}\u{1F59D}\u{1F59E}\u{1F59F}\u{1F5A0}\u{1F5A1}\u{1F5A2}\u{1F5A3}\u{1F5A4}\u{1F5A5}\u{1F5A6}\u{1F5A7}\u{1F5A8}\u{1F5A9}\u{1F5AA}\u{1F5AB}\u{1F5AC}\u{1F5AD}\u{1F5AE}\u{1F5AF}\u{1F5B0}\u{1F5B1}\u{1F5B2}\u{1F5B3}\u{1F5B4}\u{1F5B5}\u{1F5B6}\u{1F5B7}\u{1F5B8}\u{1F5B9}\u{1F5BA}\u{1F5BB}\u{1F5BC}\u{1F5BD}\u{1F5BE}\u{1F5BF}\u{1F5C0}\u{1F5C1}\u{1F5C2}\u{1F5C3}\u{1F5C4}\u{1F5C5}\u{1F5C6}\u{1F5C7}\u{1F5C8}\u{1F5C9}\u{1F5CA}\u{1F5CB}\u{1F5CC}\u{1F5CD}\u{1F5CE}\u{1F5CF}\u{1F5D0}\u{1F5D1}\u{1F5D2}\u{1F5D3}\u{1F5D4}\u{1F5D5}\u{1F5D6}\u{1F5D7}\u{1F5D8}\u{1F5D9}\u{1F5DA}\u{1F5DB}\u{1F5DC}\u{1F5DD}\u{1F5DE}\u{1F5DF}\u{1F5E0}\u{1F5E1}\u{1F5E2}\u{1F5E3}\u{1F5E4}\u{1F5E5}\u{1F5E6}\u{1F5E7}\u{1F5E8}\u{1F5E9}\u{1F5EA}\u{1F5EB}\u{1F5EC}\u{1F5ED}\u{1F5EE}\u{1F5EF}\u{1F5F0}\u{1F5F1}\u{1F5F2}\u{1F5F3}\u{1F5F4}\u{1F5F5}\u{1F5F6}\u{1F5F7}\u{1F5F8}\u{1F5F9}\u{1F5FA}\u{1F5FB}\u{1F5FC}\u{1F5FD}\u{1F5FE}\u{1F5FF}\u{2611}\u{2614}\u{2615}\u{2648}\u{2649}\u{264A}\u{264B}\u{264C}\u{264D}\u{264E}\u{264F}\u{2650}\u{2651}\u{2652}\u{2653}\u{2660}\u{2663}\u{2665}\u{2666}\u{267B}\u{2693}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2B05}\u{2B06}\u{2B07}\u{2934}\u{2935}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{23CF}\u{23E9}\u{23EA}\u{23EB}\u{23EC}\u{23ED}\u{23EE}\u{23EF}\u{23F0}\u{23F1}\u{23F2}\u{23F3}\u{23F8}\u{23F9}\u{23FA}\u{26AB}\u{26AA}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}",
    "Flags": "\u{1F1E6}\u{1F1E8}\u{1F1E6}\u{1F1FA}\u{1F1E6}\u{1F1F2}\u{1F1E6}\u{1F1EA}\u{1F1E6}\u{1F1F7}\u{1F1E6}\u{1F1FB}\u{1F1E6}\u{1F1F1}\u{1F1E6}\u{1F1F0}\u{1F1E6}\u{1F1EC}\u{1F1E6}\u{1F1EE}\u{1F1E6}\u{1F1F6}\u{1F1E6}\u{1F1FA}\u{1F1E6}\u{1F1F8}\u{1F1E7}\u{1F1E9}\u{1F1E7}\u{1F1E7}\u{1F1E7}\u{1F1E9}\u{1F1E7}\u{1F1EA}\u{1F1E7}\u{1F1EC}\u{1F1E7}\u{1F1ED}\u{1F1E7}\u{1F1EE}\u{1F1E7}\u{1F1F2}\u{1F1E7}\u{1F1F4}\u{1F1E7}\u{1F1F8}\u{1F1E7}\u{1F1F9}\u{1F1E7}\u{1F1FB}\u{1F1E7}\u{1F1FC}\u{1F1E8}\u{1F1E8}\u{1F1E8}\u{1F1E9}\u{1F1E8}\u{1F1EB}\u{1F1E8}\u{1F1F1}\u{1F1E8}\u{1F1F3}\u{1F1E8}\u{1F1F4}\u{1F1E8}\u{1F1F5}\u{1F1E8}\u{1F1F7}\u{1F1E8}\u{1F1F8}\u{1F1E8}\u{1F1F9}\u{1F1E8}\u{1F1FB}\u{1F1E8}\u{1F1FC}\u{1F1E8}\u{1F1FD}\u{1F1E8}\u{1F1FE}\u{1F1E8}\u{1F1FF}\u{1F1E9}\u{1F1EA}\u{1F1E9}\u{1F1EC}\u{1F1E9}\u{1F1EF}\u{1F1E9}\u{1F1F0}\u{1F1E9}\u{1F1F2}\u{1F1E9}\u{1F1F4}\u{1F1E9}\u{1F1FF}\u{1F1EA}\u{1F1E6}\u{1F1EA}\u{1F1EA}\u{1F1EA}\u{1F1EC}\u{1F1EA}\u{1F1F7}\u{1F1EA}\u{1F1F8}\u{1F1EA}\u{1F1F9}\u{1F1EA}\u{1F1FA}\u{1F1EC}\u{1F1E6}\u{1F1EC}\u{1F1E7}\u{1F1EC}\u{1F1E9}\u{1F1EC}\u{1F1EA}\u{1F1EC}\u{1F1EC}\u{1F1ED}\u{1F1EC}\u{1F1EE}\u{1F1EC}\u{1F1F1}\u{1F1EC}\u{1F1F2}\u{1F1EC}\u{1F1F3}\u{1F1EC}\u{1F1F5}\u{1F1EC}\u{1F1F7}\u{1F1EC}\u{1F1F8}\u{1F1EC}\u{1F1F9}\u{1F1EC}\u{1F1FA}\u{1F1EC}\u{1F1FC}\u{1F1EC}\u{1F1FE}\u{1F1ED}\u{1F1F0}\u{1F1ED}\u{1F1F2}\u{1F1ED}\u{1F1F3}\u{1F1ED}\u{1F1F7}\u{1F1ED}\u{1F1F9}\u{1F1ED}\u{1F1FA}\u{1F1EE}\u{1F1E8}\u{1F1EE}\u{1F1E9}\u{1F1EE}\u{1F1EA}\u{1F1EE}\u{1F1F1}\u{1F1EE}\u{1F1F2}\u{1F1EE}\u{1F1F6}\u{1F1EE}\u{1F1F7}\u{1F1EE}\u{1F1F8}\u{1F1EE}\u{1F1F9}\u{1F1EE}\u{1F1FA}\u{1F1EE}\u{1F1FF}\u{1F1EF}\u{1F1EA}\u{1F1EF}\u{1F1F2}\u{1F1EF}\u{1F1F5}\u{1F1F0}\u{1F1E8}\u{1F1F0}\u{1F1EC}\u{1F1F0}\u{1F1ED}\u{1F1F0}\u{1F1EE}\u{1F1F0}\u{1F1F2}\u{1F1F0}\u{1F1F3}\u{1F1F0}\u{1F1F5}\u{1F1F0}\u{1F1F7}\u{1F1F0}\u{1F1FC}\u{1F1F0}\u{1F1FE}\u{1F1F0}\u{1F1FF}\u{1F1F1}\u{1F1E6}\u{1F1F1}\u{1F1E7}\u{1F1F1}\u{1F1E8}\u{1F1F1}\u{1F1EE}\u{1F1F1}\u{1F1F0}\u{1F1F1}\u{1F1F7}\u{1F1F1}\u{1F1F8}\u{1F1F1}\u{1F1F9}\u{1F1F1}\u{1F1FA}\u{1F1F1}\u{1F1FB}\u{1F1F1}\u{1F1FE}\u{1F1F2}\u{1F1E8}\u{1F1F2}\u{1F1E9}\u{1F1F2}\u{1F1EA}\u{1F1F2}\u{1F1EB}\u{1F1F2}\u{1F1EC}\u{1F1F2}\u{1F1ED}\u{1F1F2}\u{1F1F0}\u{1F1F2}\u{1F1F1}\u{1F1F2}\u{1F1F2}\u{1F1F3}\u{1F1F2}\u{1F1F4}\u{1F1F2}\u{1F1F5}\u{1F1F2}\u{1F1F6}\u{1F1F2}\u{1F1F7}\u{1F1F2}\u{1F1F8}\u{1F1F2}\u{1F1F9}\u{1F1F2}\u{1F1FA}\u{1F1F2}\u{1F1FB}\u{1F1F2}\u{1F1FC}\u{1F1F2}\u{1F1FD}\u{1F1F2}\u{1F1FE}\u{1F1F2}\u{1F1FF}\u{1F1F3}\u{1F1E6}\u{1F1F3}\u{1F1E8}\u{1F1F3}\u{1F1EA}\u{1F1F3}\u{1F1EC}\u{1F1F3}\u{1F1EE}\u{1F1F3}\u{1F1F1}\u{1F1F3}\u{1F1F4}\u{1F1F3}\u{1F1F5}\u{1F1F3}\u{1F1F7}\u{1F1F3}\u{1F1FA}\u{1F1F3}\u{1F1FF}\u{1F1F4}\u{1F1E8}\u{1F1F4}\u{1F1EC}\u{1F1F4}\u{1F1F3}\u{1F1F4}\u{1F1F5}\u{1F1F4}\u{1F1F7}\u{1F1F4}\u{1F1F8}\u{1F1F4}\u{1F1F9}\u{1F1F4}\u{1F1FA}\u{1F1F4}\u{1F1FB}\u{1F1F4}\u{1F1FE}\u{1F1F5}\u{1F1E6}\u{1F1F5}\u{1F1E8}\u{1F1F5}\u{1F1EB}\u{1F1F5}\u{1F1EC}\u{1F1F5}\u{1F1ED}\u{1F1F5}\u{1F1F0}\u{1F1F5}\u{1F1F1}\u{1F1F5}\u{1F1F2}\u{1F1F5}\u{1F1F3}\u{1F1F5}\u{1F1F5}\u{1F1F5}\u{1F1F7}\u{1F1F5}\u{1F1F8}\u{1F1F5}\u{1F1F9}\u{1F1F5}\u{1F1FB}\u{1F1F5}\u{1F1FD}\u{1F1F5}\u{1F1FE}\u{1F1F5}\u{1F1FF}\u{1F1F6}\u{1F1E6}\u{1F1F6}\u{1F1E7}\u{1F1F6}\u{1F1E8}\u{1F1F6}\u{1F1E9}\u{1F1F6}\u{1F1EA}\u{1F1F6}\u{1F1EB}\u{1F1F6}\u{1F1EC}\u{1F1F6}\u{1F1ED}\u{1F1F6}\u{1F1EE}\u{1F1F6}\u{1F1EF}\u{1F1F6}\u{1F1F0}\u{1F1F6}\u{1F1F1}\u{1F1F6}\u{1F1F2}\u{1F1F6}\u{1F1F3}\u{1F1F6}\u{1F1F4}\u{1F1F6}\u{1F1F5}\u{1F1F6}\u{1F1F6}\u{1F1F6}\u{1F1F7}\u{1F1F6}\u{1F1F8}\u{1F1F6}\u{1F1F9}\u{1F1F6}\u{1F1FA}\u{1F1F6}\u{1F1FB}\u{1F1F6}\u{1F1FC}\u{1F1F6}\u{1F1FD}\u{1F1F6}\u{1F1FE}\u{1F1F6}\u{1F1FF}\u{1F1F7}\u{1F1EA}\u{1F1F7}\u{1F1F4}\u{1F1F7}\u{1F1F8}\u{1F1F7}\u{1F1FA}\u{1F1F7}\u{1F1FC}\u{1F1F8}\u{1F1E6}\u{1F1F8}\u{1F1E7}\u{1F1F8}\u{1F1E8}\u{1F1F8}\u{1F1E9}\u{1F1F8}\u{1F1EA}\u{1F1F8}\u{1F1EB}\u{1F1F8}\u{1F1EC}\u{1F1F8}\u{1F1ED}\u{1F1F8}\u{1F1EE}\u{1F1F8}\u{1F1EF}\u{1F1F8}\u{1F1F0}\u{1F1F8}\u{1F1F1}\u{1F1F8}\u{1F1F2}\u{1F1F8}\u{1F1F3}\u{1F1F8}\u{1F1F4}\u{1F1F8}\u{1F1F5}\u{1F1F8}\u{1F1F7}\u{1F1F8}\u{1F1F8}\u{1F1F8}\u{1F1F9}\u{1F1F8}\u{1F1FA}\u{1F1F8}\u{1F1FB}\u{1F1F8}\u{1F1FC}\u{1F1F8}\u{1F1FD}\u{1F1F8}\u{1F1FE}\u{1F1F8}\u{1F1FF}\u{1F1F9}\u{1F1E6}\u{1F1F9}\u{1F1E8}\u{1F1F9}\u{1F1EA}\u{1F1F9}\u{1F1EB}\u{1F1F9}\u{1F1EC}\u{1F1F9}\u{1F1ED}\u{1F1F9}\u{1F1EE}\u{1F1F9}\u{1F1EF}\u{1F1F9}\u{1F1F0}\u{1F1F9}\u{1F1F1}\u{1F1F9}\u{1F1F2}\u{1F1F9}\u{1F1F3}\u{1F1F9}\u{1F1F4}\u{1F1F9}\u{1F1F5}\u{1F1F9}\u{1F1F6}\u{1F1F9}\u{1F1F7}\u{1F1F9}\u{1F1F8}\u{1F1F9}\u{1F1F9}\u{1F1F9}\u{1F1FA}\u{1F1F9}\u{1F1FB}\u{1F1F9}\u{1F1FC}\u{1F1F9}\u{1F1FD}\u{1F1F9}\u{1F1FE}\u{1F1F9}\u{1F1FF}\u{1F1FA}\u{1F1E6}\u{1F1FA}\u{1F1E8}\u{1F1FA}\u{1F1EC}\u{1F1FA}\u{1F1F2}\u{1F1FA}\u{1F1F3}\u{1F1FA}\u{1F1F5}\u{1F1FA}\u{1F1F8}\u{1F1FA}\u{1F1FE}\u{1F1FA}\u{1F1FF}\u{1F1FB}\u{1F1E6}\u{1F1FB}\u{1F1E8}\u{1F1FB}\u{1F1EA}\u{1F1FB}\u{1F1EC}\u{1F1FB}\u{1F1EE}\u{1F1FB}\u{1F1F3}\u{1F1FB}\u{1F1F4}\u{1F1FB}\u{1F1F8}\u{1F1FB}\u{1F1FA}\u{1F1FB}\u{1F1FC}\u{1F1FB}\u{1F1FE}\u{1F1FB}\u{1F1FF}\u{1F1FC}\u{1F1E6}\u{1F1FC}\u{1F1EA}\u{1F1FC}\u{1F1F8}\u{1F1FC}\u{1F1EB}\u{1F1FC}\u{1F1F3}\u{1F1FC}\u{1F1F4}\u{1F1FC}\u{1F1F8}\u{1F1FC}\u{1F1F9}\u{1F1FC}\u{1F1FB}\u{1F1FC}\u{1F1FE}\u{1F1FC}\u{1F1FF}\u{1F1FD}\u{1F1F0}\u{1F1FD}\u{1F1F2}\u{1F1FD}\u{1F1F3}\u{1F1FD}\u{1F1F5}\u{1F1FD}\u{1F1F7}\u{1F1FD}\u{1F1F8}\u{1F1FD}\u{1F1F9}\u{1F1FD}\u{1F1FA}\u{1F1FD}\u{1F1FE}\u{1F1FD}\u{1F1FF}\u{1F1FE}\u{1F1E6}\u{1F1FE}\u{1F1EA}\u{1F1FE}\u{1F1EC}\u{1F1FE}\u{1F1F2}\u{1F1FE}\u{1F1F6}\u{1F1FE}\u{1F1F8}\u{1F1FE}\u{1F1F9}\u{1F1FE}\u{1F1FB}\u{1F1FE}\u{1F1FC}\u{1F1FE}\u{1F1FD}\u{1F1FE}\u{1F1FF}\u{1F1FF}\u{1F1E6}\u{1F1FF}\u{1F1E8}\u{1F1FF}\u{1F1EC}\u{1F1FF}\u{1F1F0}\u{1F1FF}\u{1F1F2}\u{1F1FF}\u{1F1F3}\u{1F1FF}\u{1F1F5}\u{1F1FF}\u{1F1F7}\u{1F1FF}\u{1F1F8}\u{1F1FF}\u{1F1F9}\u{1F1FF}\u{1F1FA}\u{1F1FF}\u{1F1FC}"
  };

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

      var direction = null;
      Array.prototype.forEach.call(dirTabs, function (t) {
        if (t.getAttribute("aria-selected") === "true") direction = t.getAttribute("data-direction");
      });
      if (!direction) direction = "hinglish-to-hindi";
      var scope = "sentence";
      var hinglishMode = true;

      /* --- Build toolbar --- */
      var toolbar = document.createElement("div");
      toolbar.className = "tool-toolbar";
      toolbar.innerHTML =
        '<button class="tb-btn" data-tb-action="voice" title="Use your device microphone to speak Hindi">&#x1F3A4; Speak</button>' +
        '<span class="tb-sep"></span>' +
        '<button class="tb-btn" data-tb-toggle="fullstop" title="Toggle . to 1 (Purn Viram)">&#x0964;</button>' +
        '<button class="tb-btn" data-tb-toggle="numbers" title="Toggle 123 to Devanagari numbers">&#x0967;&#x0968;&#x0969;</button>' +
        '<span class="tb-sep"></span>' +
        '<button class="tb-btn" data-tb-action="emoji" title="Insert emoji">&#x1F60A;</button>' +
        '<button class="tb-btn" data-tb-action="keyboard" title="On-screen Devanagari keyboard">&#x2328; Keyboard</button>';
      w.insertBefore(toolbar, w.querySelector(".scope-row"));

      var tbFullstop = toolbar.querySelector("[data-tb-toggle='fullstop']");
      var tbNumbers = toolbar.querySelector("[data-tb-toggle='numbers']");
      var tbVoice = toolbar.querySelector("[data-tb-action='voice']");
      var tbEmoji = toolbar.querySelector("[data-tb-action='emoji']");
      var tbKeyboard = toolbar.querySelector("[data-tb-action='keyboard']");

      var fullstopOn = false;
      var numbersOn = false;
      var voiceActive = false;
      var recognition = null;

      /* Full-stop toggle */
      if (tbFullstop) tbFullstop.addEventListener("click", function () {
        fullstopOn = !fullstopOn;
        tbFullstop.classList.toggle("active", fullstopOn);
        showToast(fullstopOn ? "Purn Viram ON" : "Purn Viram OFF");
      });

      /* Number toggle */
      if (tbNumbers) tbNumbers.addEventListener("click", function () {
        numbersOn = !numbersOn;
        tbNumbers.classList.toggle("active", numbersOn);
        showToast(numbersOn ? "Devanagari numbers" : "Normal numbers");
      });

      /* Voice typing — uses system built-in speech recognition (Windows/Mac/Mobile) */
      if (tbVoice) tbVoice.addEventListener("click", function () {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
          showToast("Speech not supported — try Chrome or Edge browser");
          return;
        }
        if (voiceActive) {
          if (recognition) { try { recognition.stop(); } catch (e) {} recognition = null; }
          voiceActive = false;
          tbVoice.classList.remove("active");
          tbVoice.innerHTML = "&#x1F3A4; Speak";
          showToast("Mic stopped");
          return;
        }
        try {
          recognition = new SR();
          recognition.lang = hinglishMode ? "hi-IN" : "en-US";
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
          recognition.onstart = function () {
            voiceActive = true;
            tbVoice.classList.add("active");
            tbVoice.innerHTML = "&#x1F3A4; Listening...";
            showToast("Speak now — your device mic is active");
          };
          recognition.onresult = function (e) {
            var finalText = "";
            for (var i = e.resultIndex; i < e.results.length; i++) {
              if (e.results[i].isFinal) {
                finalText += e.results[i][0].transcript;
              }
            }
            if (finalText) {
              inArea.value += (inArea.value && !/\s$/.test(inArea.value) ? " " : "") + finalText;
              inArea.dispatchEvent(new Event("input"));
            }
          };
          recognition.onerror = function (e) {
            if (e.error === "no-speech") { showToast("No speech detected — try again"); }
            else if (e.error === "not-allowed") { showToast("Mic access denied — allow mic in browser settings"); }
            else if (e.error === "network") { showToast("Speech requires internet connection"); }
            else if (e.error !== "aborted") { showToast("Speech error: " + e.error); }
            voiceActive = false;
            tbVoice.classList.remove("active");
            tbVoice.innerHTML = "&#x1F3A4; Speak";
          };
          recognition.onend = function () {
            voiceActive = false;
            tbVoice.classList.remove("active");
            tbVoice.innerHTML = "&#x1F3A4; Speak";
          };
          recognition.start();
        } catch (e) {
          showToast("Could not start speech recognition");
        }
      });

      /* Emoji picker */
      var emojiPicker = null;
      function closeEmojiPicker() {
        if (emojiPicker) {
          emojiPicker.style.display = "none";
          tbEmoji.classList.remove("active");
        }
      }
      function buildEmojiPicker() {
        emojiPicker = document.createElement("div");
        emojiPicker.className = "emoji-popup";
        emojiPicker.style.display = "none";
        var html = '<div class="emoji-tabs">';
        var catNames = Object.keys(EMOJI_DATA);
        catNames.forEach(function (cat, i) {
          html += '<button class="emoji-tab' + (i === 0 ? " active" : "") + '" data-ecat="' + cat + '">' + cat + "</button>";
        });
        html += '</div><div class="emoji-grid" data-emoji-grid></div>';
        emojiPicker.innerHTML = html;
        toolbar.appendChild(emojiPicker);
        renderEmojiCat(catNames[0]);
        var tabs = emojiPicker.querySelectorAll(".emoji-tab");
        Array.prototype.forEach.call(tabs, function (tab) {
          tab.addEventListener("click", function () {
            Array.prototype.forEach.call(tabs, function (t) { t.classList.remove("active"); });
            tab.classList.add("active");
            renderEmojiCat(tab.getAttribute("data-ecat"));
          });
        });
        /* Prevent emoji popup from closing when clicking inside it */
        emojiPicker.addEventListener("click", function (e) {
          e.stopPropagation();
        });
      }
      function renderEmojiCat(cat) {
        var grid = emojiPicker.querySelector("[data-emoji-grid]");
        if (!grid) return;
        grid.innerHTML = "";
        var raw = EMOJI_DATA[cat] || "";
        var emojis = Array.from ? Array.from(raw) : raw.split("");
        emojis.forEach(function (ch) {
          if (ch === " " || ch === "\u200D") return;
          var btn = document.createElement("button");
          btn.className = "emoji-btn";
          btn.textContent = ch;
          btn.addEventListener("click", function () {
            inArea.value += this.textContent;
            inArea.dispatchEvent(new Event("input"));
            inArea.focus();
            closeEmojiPicker();
          });
          grid.appendChild(btn);
        });
      }
      if (tbEmoji) tbEmoji.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!emojiPicker) buildEmojiPicker();
        var isVisible = emojiPicker.style.display === "block";
        if (isVisible) {
          closeEmojiPicker();
        } else {
          emojiPicker.style.display = "block";
          tbEmoji.classList.add("active");
        }
      });
      /* Close emoji picker when clicking anywhere outside */
      document.addEventListener("click", function (e) {
        if (emojiPicker && emojiPicker.style.display === "block" && !emojiPicker.contains(e.target) && !tbEmoji.contains(e.target)) {
          closeEmojiPicker();
        }
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
          li.addEventListener("mousedown", function (e) {
            e.preventDefault();
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
        var wordStart = before.lastIndexOf(" ");
        if (wordStart === -1) wordStart = 0; else wordStart += 1;
        var prefix = val.slice(0, wordStart);
        var suffix = val.slice(pos).replace(/^\S+/, "");
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
        } else if (e.key === "Enter" && sugSelectedIdx >= 0 && sugSelectedIdx < sugWords.length) {
          e.preventDefault();
          var val = inArea.value;
          var pos = inArea.selectionStart;
          var before = val.slice(0, pos);
          var wordStart = before.lastIndexOf(" ");
          if (wordStart === -1) wordStart = 0; else wordStart += 1;
          applySuggestion(sugWords[sugSelectedIdx], val.slice(wordStart, pos));
          return true;
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
          statsEl.innerHTML = "<strong>" + chars + "</strong> chars \u00B7 <strong>" + tokens + "</strong> words \u00B7 <strong>" + res.details.length + "</strong> mapped";
        }
        if (placeholderEl) placeholderEl.style.display = "none";
        outEl.textContent = res.output || "";
        if (bannerEl && scope === "word" && res.details.length) {
          if (bannerText) {
            bannerText.innerHTML = res.details.slice(0, 5).map(function (d) {
              return "<strong>" + esc(d.from) + "</strong> \u2192 " + esc(d.to);
            }).join("  \u00B7  ");
          }
          bannerEl.classList.add("show");
        }
        if (!silent && res.output) showToast("Converted!");
      }

      /* --- Swap (only 2 directions) --- */
      function doSwap() {
        direction = direction === "hinglish-to-hindi" ? "hindi-to-hinglish" : "hinglish-to-hindi";
        var myOut = outEl.textContent;
        inArea.value = myOut;
        outEl.textContent = "";
        if (placeholderEl) placeholderEl.style.display = "";
        inArea.dispatchEvent(new Event("input"));
        Array.prototype.forEach.call(dirTabs, function (o) {
          o.setAttribute("aria-selected", o.getAttribute("data-direction") === direction ? "true" : "false");
        });
        updateLabels();
        showToast("Swapped direction");
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
        showToast("Input cleared");
      }
      function doClearOutput() {
        outEl.textContent = "";
        if (placeholderEl) placeholderEl.style.display = "";
        if (statsEl) statsEl.innerHTML = "";
        if (bannerEl) bannerEl.classList.remove("show");
        showToast("Output cleared");
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
        showToast("Cleared all");
      }

      /* --- Copy --- */
      function doCopy() {
        var text = outEl.textContent || "";
        if (!text) { showToast("Nothing to copy"); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { showToast("Copied!"); });
        } else {
          var ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          showToast("Copied!");
        }
      }

      /* --- Download .txt --- */
      function doDownloadTxt() {
        var text = outEl.textContent || "";
        if (!text) { showToast("Nothing to download"); return; }
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "hinglish-output.txt";
        a.click();
        URL.revokeObjectURL(a.href);
        showToast("Downloaded .txt");
      }

      /* --- Share WhatsApp --- */
      function doShareWhatsApp() {
        var text = outEl.textContent || inArea.value || "";
        if (!text) { showToast("Nothing to share"); return; }
        window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(text), "_blank");
      }

      /* --- Email --- */
      function doEmail() {
        var text = outEl.textContent || inArea.value || "";
        if (!text) { showToast("Nothing to email"); return; }
        window.location.href = "mailto:?subject=Hinglish%20Text&body=" + encodeURIComponent(text);
      }

      /* --- localStorage save/restore --- */
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
        '<button class="act-btn" data-act="whatsapp" title="Share on WhatsApp">WhatsApp</button>' +
        '<button class="act-btn" data-act="email" title="Share via email">Email</button>' +
        '<span class="act-counter" data-word-counter></span>';
      w.appendChild(actionBar);

      actionBar.querySelector("[data-act='copy']").addEventListener("click", doCopy);
      actionBar.querySelector("[data-act='txt']").addEventListener("click", doDownloadTxt);
      actionBar.querySelector("[data-act='whatsapp']").addEventListener("click", doShareWhatsApp);
      actionBar.querySelector("[data-act='email']").addEventListener("click", doEmail);

      var wordCounter = actionBar.querySelector("[data-word-counter]");

      /* --- Input handler --- */
      inArea.addEventListener("input", function () {
        if (convertBtn) convertBtn.disabled = !inArea.value.trim();
        saveLocal();
        if (wordCounter) {
          var wc = inArea.value.trim() ? inArea.value.trim().split(/\s+/).length : 0;
          var cc = inArea.value.length;
          wordCounter.textContent = wc + " words \u00B7 " + cc + " chars";
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
          if (/\s$/.test(before) && before.trim().length > 0) {
            var prevSpace = before.trimEnd().lastIndexOf(" ");
            var prevWord = (prevSpace === -1 ? before.trimEnd() : before.trimEnd().slice(prevSpace + 1));
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