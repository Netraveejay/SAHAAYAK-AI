import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getSchemeName, getSchemeBenefits } from '../utils/schemeI18n';

import { getApiBase } from '../services/apiService';

export default function Home() {
  const { user, token, refreshProfiles, authFetch } = useAuth();
  const { t, lang } = useLanguage();
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [loading, setLoading] = useState(false);

  const profiles = user?.profiles || [];

  useEffect(() => {
    if (selectedProfileId && profiles.length && !profiles.some((p) => p.id === selectedProfileId)) {
      setSelectedProfileId('');
    }
  }, [profiles, selectedProfileId]);

  useEffect(() => {
    if (selectedProfileId && profiles.length) {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      if (profile) {
        setLoading(true);
        authFetch(`${getApiBase()}/schemes/eligible`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        })
          .then((r) => r.json())
          .then((data) => setEligibleSchemes(data.schemes || []))
          .catch(() => setEligibleSchemes([]))
          .finally(() => setLoading(false));
      }
    } else {
      setEligibleSchemes([]);
    }
  }, [selectedProfileId, profiles, authFetch]);

  const pageText = [
    t.appName,
    t.tagline,
    t.eligibleSchemes,
    t.selectProfile,
    profiles.length ? profiles.map((p) => p.name).join(', ') : t.noProfiles,
  ].join('. ');

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>{t.home}</h1>
      <p style={{ marginBottom: 24, color: 'var(--text-muted)' }}>{t.tagline}</p>

      {profiles.length === 0 ? (
        <div className="card">
          <p style={{ marginBottom: 20 }}>{t.noProfiles}</p>
          <Link to="/profiles/new" className="btn btn-primary">
            {t.addProfile}
          </Link>
        </div>
      ) : (
        <>
          <div className="card">
            <label htmlFor="profile-select" className="input-group label-only">{t.selectProfile}</label>
            <select
              id="profile-select"
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              style={{ padding: 14, fontSize: '1.05rem', borderRadius: 12, border: '2px solid var(--border)' }}
            >
              <option value="">— {t.selectProfile} —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age} {t.yrs}, {p.category})
                </option>
              ))}
            </select>
          </div>

          {selectedProfileId && (
            <div className="card">
              <h2 style={{ marginBottom: 16 }}>{t.eligibleSchemes}</h2>
              {loading ? (
                <p>{t.loading}</p>
              ) : eligibleSchemes.length === 0 ? (
                <p>{t.noEligible}</p>
              ) : (
                <ul className="scheme-list">
                  {eligibleSchemes.slice(0, 5).map((s) => (
                    <li key={s.id} className="scheme-item">
                      <strong>{getSchemeName(s, lang)}</strong>
                      <span>{getSchemeBenefits(s, lang)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/schemes" className="btn btn-primary" style={{ marginTop: 16 }}>
                {t.viewAllSchemes}
              </Link>
            </div>
          )}

          <div className="card">
            <Link to="/profiles/new" className="btn btn-secondary" style={{ marginRight: 12 }}>
              {t.addProfile}
            </Link>
            <Link to="/profiles" className="btn btn-secondary" style={{ marginRight: 12 }}>
              {t.myProfiles}
            </Link>
            <Link to="/applications" className="btn btn-primary">
              {t.myApplications}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
