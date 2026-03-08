import React from 'react';
import { useVoice } from '../context/VoiceContext';
import { useLanguage } from '../context/LanguageContext';

/**
 * Mic button to place next to a field. On click: registers this field as voice target and starts listening.
 * When user speaks, the transcript is autofilled into that field.
 */
export function FieldMicButton({ onRegisterTarget, disabled }) {
  const voice = useVoice();
  const { t } = useLanguage();
  const startListening = voice?.startListening;
  const stopListening = voice?.stopListening;
  const setVoiceTarget = voice?.setVoiceTarget;
  const listening = voice?.listening ?? false;

  const handleClick = () => {
    if (!onRegisterTarget || !setVoiceTarget || !startListening) return;
    if (listening) {
      stopListening?.();
      return;
    }
    onRegisterTarget(setVoiceTarget);
    startListening();
  };

  return (
    <button
      type="button"
      className={`field-mic-btn ${listening ? 'listening' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title={t.speak}
      aria-label={t.speak}
    >
      🎤
    </button>
  );
}
