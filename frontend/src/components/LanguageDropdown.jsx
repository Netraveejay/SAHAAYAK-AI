import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'bn', label: 'বাংলা' },
];

export function LanguageDropdown({ className = '', id = 'lang-select' }) {
  const { t, lang, setLang } = useLanguage();

  return (
    <div className={`lang-select-wrap ${className}`}>
      <label htmlFor={id} className="sr-only">{t.language}</label>
      <select
        id={id}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="lang-select"
        aria-label={t.language}
      >
        {LANGUAGES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
