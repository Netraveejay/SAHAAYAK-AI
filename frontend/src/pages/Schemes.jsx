import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getSchemeName, getSchemeDesc, getSchemeBenefits } from '../utils/schemeI18n';
import { getApiBase } from '../services/apiService';

export default function Schemes() {
  const { user, authFetch } = useAuth();
  const { t, lang } = useLanguage();
  const [allSchemes, setAllSchemes] = useState([]);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [aiExplanation, setAiExplanation] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(null);

  const profiles = user?.profiles || [];

  useEffect(() => {
    if (selectedProfileId && profiles.length && !profiles.some((p) => p.id === selectedProfileId)) {
      setSelectedProfileId('');
    }
  }, [profiles, selectedProfileId]);

  const handleApply = async (scheme) => {
    const name = getSchemeName(scheme, lang);
    setApplyingId(scheme.id);
    setApplyError(null);
    setApplySuccess(null);
    try {
      const profile = selectedProfileId ? profiles.find((p) => p.id === selectedProfileId) : null;
      const res = await authFetch(`${getApiBase()}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: scheme.id,
          schemeName: name,
          profileId: profile?.id || null,
          profileName: profile?.name || '—',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setApplyError(t.alreadyAppliedForScheme || 'You have already applied for this scheme. View it in Application Tracker.');
        setApplyingId(null);
        return;
      }
      if (res.ok) {
        setApplySuccess(`Successfully applied for ${name}!`);
      } else {
        const msg = data.error || data.message || (res.status === 401 ? 'Please log in again.' : 'Failed to apply.');
        setApplyError(msg);
      }
    } catch (err) {
      console.error('Apply error:', err);
      setApplyError(err.message || 'Failed to apply. Please try again.');
    }
    setApplyingId(null);
  };

  useEffect(() => {
    fetch(`${getApiBase()}/schemes`)
      .then((r) => r.json())
      .then((data) => setAllSchemes(data.schemes || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProfileId || !profiles.length) {
      setEligibleSchemes([]);
      setAiExplanation('');
      return;
    }
    const profile = profiles.find((p) => p.id === selectedProfileId);
    if (!profile) return;
    authFetch(`${getApiBase()}/schemes/eligible`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then((r) => r.json())
      .then((data) => {
        setEligibleSchemes(data.schemes || []);
        setAiExplanation(data.explanation || '');
      })
      .catch(() => {
        setEligibleSchemes([]);
        setAiExplanation('');
      });
  }, [selectedProfileId, profiles, authFetch]);

  const pageText = [t.schemes, t.eligibleSchemes, t.selectProfile].join('. ');

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>{t.schemes}</h1>
      <p style={{ marginBottom: 24 }}>{t.schemesIntro}</p>

      {applySuccess && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--success, #28a745)', background: 'var(--surface-alt, #f0fff4)' }}>
          <p style={{ margin: 0 }}>{applySuccess}</p>
          <Link to="/applications" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setApplySuccess(null)}>
            {t.myApplications}
          </Link>
        </div>
      )}

      {applyError && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--warning, #b8860b)', background: 'var(--surface-alt, #faf8f5)' }}>
          <p style={{ margin: 0 }}>{applyError}</p>
          <Link to="/applications" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setApplyError(null)}>
            {t.myApplications}
          </Link>
        </div>
      )}

      {profiles.length > 0 && (
        <div className="card">
          <label className="input-group label-only">{t.selectProfile}</label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            style={{ width: '100%', padding: 14, fontSize: '1.05rem', borderRadius: 12, border: '2px solid var(--border)' }}
          >
            <option value="">— {t.selectProfile} —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {aiExplanation && selectedProfileId && (
        <div className="card" style={{ marginTop: 16, background: 'var(--surface-alt, #f0f9ff)', borderColor: 'var(--primary, #0066cc)' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>💡 {t.aiExplanation || 'AI Explanation'}</h3>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{aiExplanation}</p>
        </div>
      )}

      {loading ? (
        <p>{t.loadingSchemes}</p>
      ) : (
        <div className="schemes-grid">
          {(selectedProfileId ? eligibleSchemes : allSchemes).map((scheme) => {
            const name = getSchemeName(scheme, lang);
            const desc = getSchemeDesc(scheme, lang);
            const benefits = getSchemeBenefits(scheme, lang);
            return (
              <div key={scheme.id} className="card scheme-card">
                <h3>{name}</h3>
                <p style={{ margin: '12px 0', fontSize: '0.95rem' }}>{desc}</p>
                <p><strong>{t.schemeBenefits}:</strong> {benefits}</p>
                <div className="scheme-card-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                  <Link to={`/schemes/${scheme.id}`} className="btn btn-secondary">
                    {t.viewDetails}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleApply(scheme)}
                    disabled={!!applyingId}
                  >
                    {applyingId === scheme.id ? t.loading : t.applyNow}
                  </button>
                  {scheme.link && (
                    <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      {t.view} (external)
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
