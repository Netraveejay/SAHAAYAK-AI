import React, { createContext, useContext, useRef, useCallback, useState } from 'react';

const VoiceContext = createContext(null);

export function VoiceProvider({ children }) {
  const voiceTargetRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);

  const setVoiceTarget = useCallback((fn) => {
    voiceTargetRef.current = fn;
  }, []);

  const setOnResultCallback = useCallback((cb) => {
    onResultCallbackRef.current = cb;
  }, []);

  const applyVoiceResult = useCallback((transcript) => {
    if (voiceTargetRef.current) {
      voiceTargetRef.current(transcript);
      voiceTargetRef.current = null;
    }
    onResultCallbackRef.current?.(transcript);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert('Voice input not supported in this browser. Try Chrome.');
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    const recognition = new SpeechRecognition();
    const docLang = document.documentElement?.lang || 'en';
    recognition.lang = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' }[docLang] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      applyVoiceResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [applyVoiceResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  return (
    <VoiceContext.Provider value={{ setVoiceTarget, setOnResultCallback, applyVoiceResult, startListening, stopListening, listening }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  return ctx;
}
