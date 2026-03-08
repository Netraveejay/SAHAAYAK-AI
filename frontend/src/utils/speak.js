/**
 * Speak text using browser speech synthesis (same pattern as your format).
 */
const speak = (text, lang = 'en') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const textStr = (text != null ? String(text) : '').trim();
  if (!textStr) return;

  const msg = new SpeechSynthesisUtterance(textStr);
  const locale = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' }[lang] || 'en-IN';
  msg.lang = locale;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
};

export function speakInstruction(text, lang = 'en') {
  speak(text, lang);
}

/**
 * Call once on first user interaction (e.g. page load or first click) so Chrome
 * loads voices. Then speakInstruction() will have voices available.
 */
export function warmupSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
}
