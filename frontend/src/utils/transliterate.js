/**
 * Transliterate Indic script (Tamil, Hindi, etc.) to Latin when displaying in English.
 * Keeps names in original script when the selected language is not English.
 */

// Tamil (U+0B80–U+0BFF) to Latin – common consonants and vowels for names
const TAMIL_TO_LATIN = {
  '\u0B85': 'a', '\u0B86': 'aa', '\u0B87': 'i', '\u0B88': 'ee', '\u0B89': 'u', '\u0B8A': 'oo',
  '\u0B8E': 'e', '\u0B8F': 'ae', '\u0B90': 'ai', '\u0B92': 'o', '\u0B93': 'o', '\u0B94': 'au',
  '\u0B95': 'k', '\u0B99': 'ng', '\u0B9A': 'ch', '\u0B9C': 'j', '\u0B9E': 'ny',
  '\u0B9F': 't', '\u0BA3': 'n', '\u0BA4': 'th', '\u0BA8': 'n', '\u0BAA': 'p', '\u0BAE': 'm',
  '\u0BAF': 'y', '\u0BB0': 'r', '\u0BB1': 'r', '\u0BB2': 'l', '\u0BB3': 'l', '\u0BB4': 'zh',
  '\u0BB5': 'v', '\u0BB7': 'l', '\u0BB8': 's', '\u0BB9': 'h',
  '\u0BBE': 'a', '\u0BBF': 'i', '\u0BC0': 'i', '\u0BC1': 'u', '\u0BC2': 'u',
  '\u0BC6': 'e', '\u0BC7': 'e', '\u0BC8': 'i', '\u0BCA': 'o', '\u0BCB': 'o', '\u0BCC': 'u',
  '\u0BCD': '', // pulli (vowel killer)
  '\u0B82': 'm', // anusvara
  '\u0BA9': 'n', // ன (NNA) for names like நேத்ரா
};
const TAMIL_RANGE = /[\u0B80-\u0BFF]/;

function isIndicScript(str) {
  if (!str || typeof str !== 'string') return false;
  return TAMIL_RANGE.test(str) || /[\u0900-\u097F]/.test(str); // Tamil or Devanagari
}

function tamilToLatin(str) {
  if (!str || typeof str !== 'string') return str;
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    const mapped = TAMIL_TO_LATIN[c];
    if (mapped !== undefined) out += mapped;
    else if (/[\u0B80-\u0BFF]/.test(c)) {
      // Fallback: approximate Tamil to Latin (basic)
      const fallback = {
        '\u0B95': 'k', '\u0B96': 'kh', '\u0B97': 'g', '\u0B98': 'gh', '\u0B99': 'ng',
        '\u0B9A': 'ch', '\u0B9B': 'ch', '\u0B9C': 'j', '\u0B9E': 'ny',
        '\u0B9F': 't', '\u0BA0': 't', '\u0BA1': 't', '\u0BA2': 't', '\u0BA3': 'n', '\u0BA4': 'th', '\u0BA5': 'th', '\u0BA8': 'n', '\u0BA9': 'n',
        '\u0BAA': 'p', '\u0BAB': 'p', '\u0BAE': 'm', '\u0BAF': 'y', '\u0BB0': 'r', '\u0BB1': 'r', '\u0BB2': 'l', '\u0BB3': 'l', '\u0BB4': 'zh', '\u0BB5': 'v', '\u0BB7': 'l', '\u0BB8': 's', '\u0BB9': 'h',
        '\u0B83': 'h',
      }[c];
      out += fallback != null ? fallback : c;
    } else {
      out += c;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

function capitalizeWords(str) {
  return str.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

/**
 * Return the name formatted for the given language.
 * When lang is 'en' and the name is in Indic script (Tamil, Hindi), transliterate to Latin.
 * Otherwise return the name as-is.
 */
export function formatNameForLang(name, lang) {
  if (!name || typeof name !== 'string') return name;
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (lang !== 'en') return trimmed;
  if (!isIndicScript(trimmed)) return trimmed;
  const latin = tamilToLatin(trimmed);
  const result = latin || trimmed;
  return capitalizeWords(result);
}
