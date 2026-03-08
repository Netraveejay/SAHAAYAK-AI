/**
 * Play voice instruction using browser speech synthesis.
 * Used by VisualAidModal for "Play Voice Instruction" button.
 * @param {string} text - Text to speak
 * @param {string} lang - Language code (e.g. "en-IN", "hi-IN")
 */
export function speakInstruction(text, lang = 'en-IN') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const textStr = (text != null ? String(text) : '').trim();
  if (!textStr) return;

  const utterance = new SpeechSynthesisUtterance(textStr);
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
