/* ============================================================
   Hinglish converter engine v2
   - Google Input Tools API for Hinglish→Hindi (real-time)
   - Offline fallback with ITRANS transliteration
   - 4 conversion directions
   Exposed globals: HINGLISH_CONVERTER
   ============================================================ */
(function (global) {
  "use strict";

  function getDict(name) {
    var root = (typeof window !== "undefined" ? window.HIN : global.HIN) || {};
    return root[name] || {};
  }

  /* ---------- Vowel tokens: [standalone, matra] ---------- */
  var VOWELS = {
    "aa": ["आ", "ा"], "ae": ["ऍ", "ॅ"],
    "ii": ["ई", "ी"], "ee": ["ई", "ी"],
    "uu": ["ऊ", "ू"], "oo": ["ऊ", "ू"],
    "ri": ["ऋ", "ृ"], "ai": ["ऐ", "ै"],
    "au": ["औ", "ौ"], "ou": ["औ", "ौ"],
    "a": ["अ", ""], "i": ["इ", "ि"], "u": ["उ", "ु"],
    "e": ["ए", "े"], "o": ["ओ", "ो"],
    "M": ["ं", "ं"], "N": ["ं", "ं"], "H": ["ः", "ः"]
  };

  var CONS = {
    "ksh": "क्ष", "ks": "क्ष", "x": "क्ष",
    "gyn": "ज्ञ", "gy": "ज्ञ", "j~n": "ज्ञ",
    "shr": "श्र",
    "Tra": "त्र", "tir": "त्र",
    "kh": "ख", "gh": "घ", "ng": "ङ", "Ng": "ङ",
    "chh": "छ", "Ch": "छ",
    "jh": "झ", "ny": "ञ",
    "TT": "ट", "Thh": "ठ", "Dh": "ढ", "NN": "ण",
    "th": "थ", "dh": "ध",
    "ph": "फ", "bh": "भ",
    "sh": "श", "Sh": "ष", "SHh": "ष",
    "q": "क़", "z": "ज़", "f": "फ़", "F": "फ़",
    "k": "क", "g": "ग", "c": "च", "j": "ज",
    "T": "ट", "D": "ड", "N": "ण",
    "t": "त", "d": "द", "n": "न",
    "p": "प", "b": "ब", "m": "म",
    "y": "य", "r": "र", "l": "ल",
    "v": "व", "w": "व", "s": "स", "h": "ह"
  };

  var DEVA = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
    "ष": "sh", "स": "s", "ह": "h", "ळ": "l",
    "क़": "q", "ख़": "kh", "ग़": "g", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f",
    "क्ष": "ksh", "त्र": "tr", "ज्ञ": "gy",
    "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u",
    "ऊ": "oo", "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au",
    "ा": "aa", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo",
    "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
    "ं": "n", "ँ": "n", "ः": "h", "्": ""
  };

  var keysSorted = [];
  (function buildKeys() {
    var all = {};
    Object.keys(CONS).forEach(function (k) { all[k] = 1; });
    Object.keys(VOWELS).forEach(function (k) { all[k] = 1; });
    keysSorted = Object.keys(all).sort(function (a, b) { return b.length - a.length; });
  })();

  /* ---------- Latin → Devanagari (offline fallback) ---------- */
  function latinToDevanagari(text) {
    var lower = String(text).toLowerCase();
    var out = "";
    var prevCons = false;
    var i = 0;
    while (i < lower.length) {
      var key = null;
      for (var k = 0; k < keysSorted.length; k++) {
        if (lower.startsWith(keysSorted[k], i)) { key = keysSorted[k]; break; }
      }
      if (key) {
        i += key.length;
        if (VOWELS[key]) {
          if (prevCons && VOWELS[key][1] !== "") { out += VOWELS[key][1]; }
          else if (prevCons && VOWELS[key][1] === "" && key === "a") { /* inherent a */ }
          else if (!prevCons) { out += VOWELS[key][0]; }
          prevCons = false;
        } else if (CONS[key]) {
          if (prevCons) out += "्";
          out += CONS[key];
          prevCons = true;
        }
      } else {
        var ch = lower[i]; i++;
        if (/\s/.test(ch)) { out += ch; prevCons = false; }
        else if (/[a-z0-9]/.test(ch)) {
          if (prevCons) { out += "्"; }
          out += ch;
          prevCons = false;
        } else {
          if (prevCons) { prevCons = false; }
          out += ch;
        }
      }
    }
    return out;
  }

  /* ---------- Devanagari → Latin ---------- */
  function devanagariToLatin(text) {
    var out = "";
    var i = 0;
    while (i < text.length) {
      var ch = text[i];
      if (ch === "अ") { out += (text[i + 1] === "ं" ? "an" : "a"); i++; continue; }
      if (DEVA[ch]) { out += DEVA[ch]; i++; continue; }
      if (DEVA.hasOwnProperty(ch)) { out += DEVA[ch]; i++; continue; }
      if (ch === "।" || ch === "॥") { out += ". "; i++; continue; }
      if (/\s/.test(ch)) { out += ch; i++; continue; }
      out += ch; i++;
    }
    return out.trim();
  }

  /* ---------- Google Input Tools API ---------- */
  var activeRequest = null;
  var suggestionCache = {};

  function fetchSuggestions(word, callback) {
    if (!word || word.length < 1) { callback([]); return; }
    var cached = suggestionCache[word.toLowerCase()];
    if (cached) { callback(cached); return; }

    if (activeRequest) { activeRequest.abort(); }
    var xhr = new XMLHttpRequest();
    var url = "https://inputtools.google.com/request?text=" +
      encodeURIComponent(word) +
      "&itc=hi-t-i0-und&num=5&cs=1&cp=0&ie=utf-8&oe=utf-8&app=demopage";
    xhr.open("GET", url, true);
    xhr.timeout = 3000;
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        try {
          var resp = JSON.parse(xhr.responseText);
          var suggestions = (resp[1] && resp[1][1]) ? resp[1][1] : [];
          suggestionCache[word.toLowerCase()] = suggestions;
          callback(suggestions);
        } catch (e) {
          callback([latinToDevanagari(word)]);
        }
      } else {
        callback([latinToDevanagari(word)]);
      }
    };
    xhr.onerror = function () { callback([latinToDevanagari(word)]); };
    xhr.ontimeout = function () { callback([latinToDevanagari(word)]); };
    activeRequest = xhr;
    xhr.send();
  }

  /* ---------- Direction-aware conversion (2 directions only) ---------- */
  function convert(text, direction) {
    var input = String(text || "");
    if (!input.trim()) return { output: "", details: [] };

    if (direction === "hinglish-to-hindi") {
      var pieces = input.split(/(\s+)/);
      var out = [];
      var details = [];
      var hh = getDict("hinglishHindi");
      pieces.forEach(function (piece) {
        if (/^\s*$/.test(piece)) { out.push(piece); return; }
        var word = piece.trim();
        var punct = piece.replace(word, "");
        var key = word.toLowerCase();
        var hindi = hh[key];
        if (!hindi) hindi = latinToDevanagari(word);
        out.push(hindi + punct);
        if (word !== hindi) {
          details.push({ from: word, to: hindi });
        }
      });
      return { output: out.join(""), details: details, mode: "hi" };
    }

    /* hindi-to-hinglish */
    return { output: devanagariToLatin(input), details: [], mode: "la" };
  }

  /* ---------- Devanagari keyboard data ---------- */
  var keyboardData = {
    vowels: ["अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ", "अं", "अः", "ऋ"],
    matras: ["ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "ं", "ः", "ँ"],
    consonants: ["क", "ख", "ग", "घ", "ङ", "च", "छ", "ज", "झ", "ञ",
                  "ट", "ठ", "ड", "ढ", "ण", "त", "थ", "द", "ध", "न",
                  "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श",
                  "ष", "स", "ह", "ळ"],
    conjuncts: ["क्ष", "त्र", "ज्ञ"],
    extra: ["क़", "ख़", "ग़", "ज़", "ड़", "ढ़", "फ़"],
    numbers: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
    punctuation: ["।", "॥", "ॐ", "॰", "₹"]
  };

  global.HINGLISH_CONVERTER = {
    latinToDevanagari: latinToDevanagari,
    devanagariToLatin: devanagariToLatin,
    convert: convert,
    fetchSuggestions: fetchSuggestions,
    suggestionCache: suggestionCache,
    keyboardData: keyboardData,
    labels: {
      "hinglish-to-hindi": ["Hinglish", "\u0939\u093F\u0928\u094D\u0926\u0940"],
      "hindi-to-hinglish": ["\u0939\u093F\u0928\u094D\u0926\u0940", "Hinglish"]
    }
  };
})(typeof window !== "undefined" ? window : this);