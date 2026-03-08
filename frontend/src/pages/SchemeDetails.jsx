import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../i18n/translations';
import { getSchemeName, getSchemeDesc, getSchemeBenefits, getInstructionText } from '../utils/schemeI18n';
import { speakInstruction } from '../utils/speak';
import { getApiBase } from '../services/apiService';

function getStepTextForLang(lang, schemeId, index, step) {
  const steps = translations[lang]?.instructionSteps?.[schemeId];
  const fromT = Array.isArray(steps) && typeof steps[index] === 'string' ? steps[index] : null;
  if (fromT && fromT.trim()) return fromT.trim();
  if (step && typeof step === 'object') return getInstructionText(step, lang) || step.text || '';
  return typeof step === 'string' ? step : String(step ?? '');
}

const APPLICATION_STATUS_KEY = 'sahaayak_applicationStatus';

function getStoredStatus(schemeId) {
  try {
    const raw = localStorage.getItem(APPLICATION_STATUS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data[schemeId] || null;
  } catch {
    return null;
  }
}

function setStoredStatus(schemeId, status = 'Guided') {
  try {
    const raw = localStorage.getItem(APPLICATION_STATUS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[schemeId] = { schemeId, status, timestamp: new Date().toISOString() };
    localStorage.setItem(APPLICATION_STATUS_KEY, JSON.stringify(data));
  } catch (_) {}
}

export default function SchemeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guidedStatus, setGuidedStatus] = useState(null);

  const officialLink = scheme?.officialLink || scheme?.link || null;
  const videoUrl = scheme?.videoUrl || null;
  const instructions = Array.isArray(scheme?.instructions) ? scheme.instructions : [];

  // Build YouTube embed URL (works with watch, youtu.be, or existing embed URLs)
  const getYouTubeEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (/youtube\.com\/embed\//i.test(trimmed)) return trimmed;
    const m = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  };
  const youtubeEmbedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;
  const isYouTube = Boolean(youtubeEmbedUrl);

  const refreshGuidedStatus = useCallback(() => {
    if (id) setGuidedStatus(getStoredStatus(id));
  }, [id]);

  useEffect(() => {
    fetch(`${getApiBase()}/schemes`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.schemes || [];
        const found = list.find((s) => s.id === id);
        setScheme(found || null);
      })
      .catch(() => setScheme(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refreshGuidedStatus();
  }, [refreshGuidedStatus, scheme]);

  // Auto voice guidance on load: "You are viewing [Scheme Name]. Follow the instructions to apply."
  useEffect(() => {
    if (!scheme) return;
    const name = getSchemeName(scheme, lang);
    const intro = (t.viewingSchemeIntro || 'You are viewing {name}. Follow the instructions to apply.').replace(
      '{name}',
      name
    );
    speakInstruction(intro, lang);
  }, [scheme?.id, lang, t.viewingSchemeIntro]);

  const handleStepClick = (step, displayedText) => {
    const text = (typeof displayedText === 'string' && displayedText.trim()) ||
      (typeof step === 'object' && step != null ? getInstructionText(step, lang) || step.text : (typeof step === 'string' ? step : String(step)));
    if (text && String(text).trim()) speakInstruction(String(text).trim(), lang);
  };

  const handleApplyOfficial = () => {
    if (officialLink) {
      window.open(officialLink, '_blank', 'noopener,noreferrer');
      setStoredStatus(id, 'Guided');
      setGuidedStatus(getStoredStatus(id));
    }
  };

  if (loading) {
    return <p>{t.loading}</p>;
  }

  if (!scheme) {
    return (
      <div className="card">
        <p>{t.schemeNotFound}</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/schemes')}>
          {t.schemes}
        </button>
      </div>
    );
  }

  const name = getSchemeName(scheme, lang);
  const desc = getSchemeDesc(scheme, lang);
  const benefits = getSchemeBenefits(scheme, lang);
  const isGuided = guidedStatus != null;

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>{name}</h1>
      <p style={{ marginBottom: 24, fontSize: '0.95rem', color: 'var(--text-muted)' }}>{desc}</p>

      <div className="card">
        <p><strong>{t.schemeBenefits}:</strong> {benefits}</p>
      </div>

      {/* Visual Guide Section - YouTube embed or video when videoUrl exists */}
      {videoUrl && (
        <div className="card scheme-detail-section">
          <h2 className="scheme-detail-heading">{t.visualGuideTitle}</h2>
          <div className="scheme-detail-video-wrap">
            {isYouTube ? (
              <iframe
                src={youtubeEmbedUrl}
                title={t.visualGuideTitle}
                className="scheme-detail-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <video
                src={videoUrl}
                controls
                playsInline
                className="scheme-detail-video"
                aria-label={t.visualGuideTitle}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          {isYouTube && (
            <p className="scheme-detail-video-fallback">
              <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                {t.openVideoOnYouTube || 'Open video on YouTube'}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Step-by-step: How to apply on the official website - with optional visual aid per step */}
      {instructions.length > 0 && (
        <div className="card scheme-detail-section">
          <h2 className="scheme-detail-heading">{t.instructionsTitle}</h2>
          {t.instructionsSubtitle && (
            <p className="scheme-instructions-subtitle">{t.instructionsSubtitle}</p>
          )}
          <ol className="scheme-instructions-list">
            {instructions.map((step, index) => {
              const stepText = getStepTextForLang(lang, id, index, step);
              const stepImageUrl = typeof step === 'object' && step?.imageUrl;
              return (
                <li key={`${id}-step-${index}-${lang}`} className="scheme-instruction-item">
                  {stepImageUrl && (
                    <div className="scheme-instruction-image-wrap">
                      <img
                        src={stepImageUrl}
                        alt=""
                        className="scheme-instruction-image"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="scheme-instruction-step"
                    onClick={() => handleStepClick(step, stepText)}
                    aria-label={stepText || t.instructionsTitle}
                  >
                    {stepText}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Apply Now on Official Website */}
      {officialLink && (
        <div className="card scheme-detail-section">
          <button
            type="button"
            className="btn btn-primary scheme-apply-official"
            onClick={handleApplyOfficial}
          >
            {t.applyNowOfficialWebsite}
          </button>
        </div>
      )}

      {/* Application Status section */}
      <div className="card scheme-detail-section">
        <h2 className="scheme-detail-heading">{t.applicationStatus}</h2>
        <p className="scheme-status-value">
          <strong>{t.applicationStatus}:</strong>{' '}
          {isGuided ? t.statusGuided : t.statusNotStarted}
        </p>
      </div>

      <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/schemes')}>
        ← {t.schemes}
      </button>
    </div>
  );
}
