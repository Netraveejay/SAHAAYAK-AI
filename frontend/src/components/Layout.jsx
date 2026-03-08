import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import { VoiceBar } from './VoiceBar';
import { LanguageDropdown } from './LanguageDropdown';

export function Layout({ children, pageText }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const voice = useVoice();
  const location = useLocation();
  const [voiceResult, setVoiceResult] = useState('');

  useEffect(() => {
    voice?.setOnResultCallback?.(setVoiceResult);
  }, [voice?.setOnResultCallback]);

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            {t.appName}
          </Link>
          <div className="header-actions">
            <LanguageDropdown id="lang-select-header" />
            <VoiceBar textToSpeak={pageText} onVoiceResult={!!voice?.startListening} />
            {user ? (
              <button type="button" className="btn btn-secondary" onClick={logout}>
                {t.logout}
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary">
                {t.login}
              </Link>
            )}
          </div>
        </div>
      </header>
      {user && (
        <nav className="nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>{t.home}</Link>
          <Link to="/profiles" className={location.pathname === '/profiles' ? 'active' : ''}>{t.myProfiles}</Link>
          <Link to="/schemes" className={location.pathname === '/schemes' ? 'active' : ''}>{t.schemes}</Link>
          <Link to="/documents" className={location.pathname === '/documents' ? 'active' : ''}>{t.documents}</Link>
          <Link to="/applications" className={location.pathname === '/applications' ? 'active' : ''}>{t.myApplications}</Link>
        </nav>
      )}
      {voiceResult && (
        <div className="voice-result-banner" role="status">
          Voice: {voiceResult}
        </div>
      )}
      <main className="main">
        {children}
      </main>
    </div>
  );
}
