import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';

export function VoiceBar({ textToSpeak = '', onVoiceResult }) {
  const { t, language } = useLanguage();
  const voice = useVoice();
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const speak = useCallback(async () => {
    const toSpeak = textToSpeak || document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 5000);
    if (!toSpeak) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setSpeaking(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: toSpeak, language })
      });
      const data = await res.json();
      
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      console.error('Polly error:', err);
      setSpeaking(false);
    }
  }, [textToSpeak, language]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setSpeaking(false);
    }
  }, []);

  const listening = voice?.listening ?? false;

  return (
    <div className="voice-bar" role="group" aria-label="Voice controls">
      <button
        type="button"
        className="voice-btn"
        onClick={speaking ? stopSpeaking : speak}
        title={t.listen}
        aria-label={t.listen}
      >
        {speaking ? '⏹' : '🔊'}
      </button>
      {onVoiceResult && (
        <button
          type="button"
          className={`voice-btn ${listening ? 'listening' : ''}`}
          onClick={listening ? voice?.stopListening : voice?.startListening}
          title={t.speak}
          aria-label={t.speak}
        >
          🎤
        </button>
      )}
    </div>
  );
}
