/* ============================================================
   Hinglish converter engine
   - latinToDevanagari: Hinglish (roman) → Hindi (ITRANS-style)
   - devanagariToLatin: Hindi → romanized Hinglish
   - convert(): direction-aware hybrid (dictionary + translit)
   Exposed globals: HINGLISH_CONVERTER
   ============================================================ */
(function (global) {
  "use strict";

  var HIN = (global.HIN || {});

  /* ---------- Vowel tokens: [standalone, matra] ---------- */
  var VOWELS = {
    "aa": ["आ", "ा"], "ae": ["ऍ", "ॅ"],
    "ii": ["ई", "ी"], "ee": ["ई", "ी"],
    "uu": ["ऊ", "ू"], "oo": ["ऊ", "ू"],
    "ri": ["ऋ", "ृ"], "ai": ["ऐ", "ै"],
    "au": ["औ", "ौ"], "ou": ["औ", "ौ"],
    "ou": ["औ", "ौ"],
    "a": ["अ", ""],  "i": ["इ", "ि"], "u": ["उ", "ु"],
    "e": ["ए", "े"], "o": ["ओ", "ो"],
    "M": ["ं", "ं"], "N": ["ं", "ं"], "H": ["ः", "ः"]
  };

  /* ---------- Consonant tokens (longest-match) ---------- */
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

  /* Letter-token (stroke) lookup for Devanagari → Latin */
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
    "ऊ": "oo", "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "अं": "an", "अः": "ah"
  };
  var MATRA = {
    "ा": "aa", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo",
    "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
    "ं": "n", "ँ": "n", "ः": "h", "्": ""
  };
  var DIGITS = { "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9" };

  /* Keys sorted by length desc for longest-match tokenizing */
  var keysSorted = [];
  (function buildKeys() {
    var all = {};
    Object.keys(CONS).forEach(function (k) { all[k] = 1; });
    Object.keys(VOWELS).forEach(function (k) { all[k] = 1; });
    keysSorted = Object.keys(all).sort(function (a, b) { return b.length - a.length; });
  })();

  /* ---------- Latin (Hinglish) → Devanagari ---------- */
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
          /* remnant unknown latin letter (e.g. standalone) — keep it */
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

  /* ---------- Devanagari → Latin (Hinglish) ---------- */
  function devanagariToLatin(text) {
    var out = "";
    var i = 0;
    var runVowel = false; // the standalone vowel rules handle it below
    while (i < text.length) {
      var ch = text[i];
      if (ch === "अ") { out += (text[i + 1] === "ं" ? "an" : "a"); i++; continue; }
      if (DEVA[ch]) { out += DEVA[ch]; i++; continue; }
      if (MATRA.hasOwnProperty(ch)) { out += MATRA[ch]; i++; continue; }
      if (DIGITS[ch]) { out += DIGITS[ch]; i++; continue; }
      if (ch === "।" || ch === "॥") { out += ". "; i++; continue; }
      if (/\s/.test(ch)) { out += ch; i++; continue; }
      out += ch; i++;
    }
    return out.trim();
  }

  /* ---------- Direction-aware conversion ---------- */
  function convert(text, direction) {
    var input = String(text || "");
    if (!input.trim()) return { output: "", details: [] };

    if (direction === "hinglish-to-hindi") {
      var pieces = input.split(/(\s+)/);
      var out = [];
      var details = [];
      pieces.forEach(function (piece) {
        if (/^\s*$/.test(piece)) { out.push(piece); return; }
        var word = piece.trim();
        var punct = piece.replace(word, "");
        var hindi = HIN.hinglishHindi[word.toLowerCase()];
        if (!hindi) hindi = latinToDevanagari(word);
        out.push(hindi + punct);
        if (word.toLowerCase() !== hindi) {
          details.push({ from: word, to: hindi });
        }
      });
      return { output: out.join(""), details: details, mode: "hi" };
    }

    if (direction === "hindi-to-hinglish") {
      return { output: devanagariToLatin(input), details: [], mode: "la" };
    }

    if (direction === "hinglish-to-english") {
      var words = input.split(/(\s+)/);
      var out2 = [];
      var details2 = [];
      words.forEach(function (w) {
        if (/^\s*$/.test(w)) { out2.push(w); return; }
        var key = w.toLowerCase().replace(/[^a-z ]/g, "").trim();
        if (key) {
          var en = HIN.hinglishEnglish[key];
          if (en) { out2.push(en); details2.push({ from: w, to: en }); return; }
        }
        out2.push(w);
      });
      return { output: out2.join(" "), details: details2, mode: "en" };
    }

    /* english-to-hinglish */
    var toks = input.split(/(\s+)/);
    var res = [];
    var det = [];
    toks.forEach(function (w) {
      if (/^\s*$/.test(w)) { res.push(w); return; }
      var key = w.toLowerCase().replace(/[^a-z]/g, "");
      if (key) {
        var hi = HIN.englishHinglish[key];
        if (hi) { res.push(hi); det.push({ from: w, to: hi }); return; }
      }
      res.push(w);
    });
    return { output: res.join(" "), details: det, mode: "en" };
  }

  function wordVariantCount(text, direction) {
    if (direction === "hinglish-to-hindi" && HIN.hinglishHindi[text.toLowerCase()]) return 2;
    return 0;
  }

  global.HINGLISH_CONVERTER = {
    latinToDevanagari: latinToDevanagari,
    devanagariToLatin: devanagariToLatin,
    convert: convert,
    wordVariantCount: wordVariantCount,
    labels: {
      "hinglish-to-hindi": ["Hinglish", "हिंदी"],
      "hindi-to-hinglish": ["हिंदी", "Hinglish"],
      "hinglish-to-english": ["Hinglish", "English"],
      "english-to-hinglish": ["English", "Hinglish"]
    }
  };
})(typeof window !== "undefined" ? window : this);