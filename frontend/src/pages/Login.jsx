import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import { VoiceBar } from '../components/VoiceBar';
import { FieldMicButton } from '../components/FieldMicButton';
import { LanguageDropdown } from '../components/LanguageDropdown';
import { speakInstruction } from '../utils/speak';
import { getApiBase } from '../services/apiService';

export default function Login() {
  const { login } = useAuth();
  const { t, lang } = useLanguage();
  const voice = useVoice();
  const setVoiceTarget = voice?.setVoiceTarget;
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('mobile');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pageText = `${t.appName}. ${t.tagline}. ${step === 'mobile' ? t.enterMobile : t.enterOtp}. ${t.demoOtp}`;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(mobile)) {
      setError(t.errorInvalidMobile);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errorSendOtpFailed);
        return;
      }
      setStep('otp');
    } catch (err) {
      setError(t.errorSendOtpFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError(t.errorEnterOtp);
      return;
    }
    setLoading(true);
    try {
      await login(mobile, otp.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || t.errorInvalidOtp);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <h1>{t.appName}</h1>
        <p>{t.tagline}</p>
        <div className="login-header-controls">
          <LanguageDropdown id="lang-select-login" className="login-lang-dropdown" />
          <div className="voice-bar-wrap">
            <VoiceBar textToSpeak={pageText} onVoiceResult={!!voice?.startListening} />
          </div>
        </div>
      </div>
      <div className="login-card card">
        {step === 'mobile' ? (
          <form onSubmit={handleSendOtp}>
            <div className="input-group">
              <label htmlFor="mobile">{t.mobile}</label>
              <div className="input-with-mic">
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder={t.enterMobile}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => {
                    speakInstruction(t.mobileInstruction, lang);
                    setVoiceTarget?.((v) => setMobile((v || '').replace(/\D/g, '').slice(0, 10)));
                  }}
                  onBlur={() => setVoiceTarget?.(null)}
                  required
                />
                <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => setMobile((v || '').replace(/\D/g, '').slice(0, 10)))} />
              </div>
            </div>
            <p className="demo-hint">{t.demoOtp}</p>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? '...' : t.sendOtp}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="input-group">
              <label htmlFor="otp">{t.enterOtp}</label>
              <div className="input-with-mic">
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => {
                    speakInstruction(t.otpInstruction, lang);
                    setVoiceTarget?.((v) => setOtp((v || '').replace(/\D/g, '').slice(0, 6)));
                  }}
                  onBlur={() => setVoiceTarget?.(null)}
                  required
                />
                <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => setOtp((v || '').replace(/\D/g, '').slice(0, 6)))} />
              </div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => setStep('mobile')} style={{ marginBottom: 12 }}>
              {t.changeNumber}
            </button>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? '...' : t.verifyOtp}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
