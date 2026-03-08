import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../i18n/translations';
import { ApplicationStatusCard } from '../components/ApplicationStatusCard';
import { speakInstruction } from '../utils/speak';
import { formatNameForLang } from '../utils/transliterate';
import { getApiBase } from '../services/apiService';

const STATUS_VALUES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

function textForLang(lang, key, fallback) {
  return translations[lang]?.[key] || fallback;
}

export default function ApplicationTracker() {

  const { user, authFetch, refreshProfiles } = useAuth();
  const { t, lang } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilesRefreshed, setProfilesRefreshed] = useState(false);
  const [minLoadingDone, setMinLoadingDone] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  const hasSpokenIntro = useRef(false);
  const hasShownContent = useRef(false);

  const rawProfiles = Array.isArray(user?.profiles) ? user.profiles : [];
  const uniqueProfiles = Array.from(
    new Map(rawProfiles.filter((p) => p && p.id).map((p) => [p.id, p])).values()
  );
  const hasProfiles = uniqueProfiles.length > 0;
  const defaultApplicantText = textForLang(lang, 'defaultApplicant', 'Applicant');
  const profileNameRaw = uniqueProfiles[0]?.name || defaultApplicantText;
  const profileName = formatNameForLang(profileNameRaw, lang);

  useEffect(() => {
    if (selectedProfileId && uniqueProfiles.length && !uniqueProfiles.some((p) => p.id === selectedProfileId)) {
      setSelectedProfileId('');
    }
  }, [selectedProfileId, uniqueProfiles]);

  const hasDefaultedSingleProfile = useRef(false);
  useEffect(() => {
    if (uniqueProfiles.length === 1 && !hasDefaultedSingleProfile.current) {
      hasDefaultedSingleProfile.current = true;
      setSelectedProfileId(uniqueProfiles[0].id);
    }
  }, [uniqueProfiles]);


  /*
  ---------------------------
  Fetch Applications (Stable)
  ---------------------------
  */
  const loadApplications = useCallback(() => {

    setLoading(true);

    authFetch(`${getApiBase()}/applications`)
      .then((r) => r.ok ? r.json() : { applications: [] })
      .then((data) => {

        setApplications(data.applications || []);

      })
      .catch(() => {

        setApplications([]);

      })
      .finally(() => {

        setLoading(false);

      });

  }, [authFetch]);


  /*
  ---------------------------
  Minimum loading delay
  ---------------------------
  */
  useEffect(() => {

    const timer = setTimeout(() => {

      setMinLoadingDone(true);

    }, 500);

    return () => clearTimeout(timer);

  }, []);


  /*
  ---------------------------
  Refresh Profiles ONCE per page load
  ---------------------------
  */
  useEffect(() => {
    if (profilesRefreshed) return;
    refreshProfiles()
      .then(() => setProfilesRefreshed(true))
      .catch(() => setProfilesRefreshed(true));
  }, [profilesRefreshed, refreshProfiles]);


  /*
  ---------------------------
  Load applications
  ---------------------------
  */
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    fetch(`${getApiBase()}/schemes`)
      .then((r) => r.ok ? r.json() : { schemes: [] })
      .then((data) => setSchemes(data.schemes || []))
      .catch(() => setSchemes([]));
  }, []);


  /*
  ---------------------------
  Speak intro ONCE
  ---------------------------
  */
  useEffect(() => {

    if (!profilesRefreshed) return;
    if (loading) return;
    if (hasSpokenIntro.current) return;

    hasSpokenIntro.current = true;

    const timer = setTimeout(() => {

      if (!hasProfiles) {

        speakInstruction(

          textForLang(lang, 'noProfilesFound', 'No profiles found.')
          + ' '
          + textForLang(lang, 'noProfiles', 'Add a profile to get started.'),

          lang

        );

        return;

      }

      const profileCount = uniqueProfiles.length;
      const appCountDedup = applications.length ? new Set(applications.map((a) => a.schemeId)).size : 0;

      const msg =
        appCountDedup === 0
          ? textForLang(
              lang,
              'trackerIntroVoiceNone',
              'Application Tracker. You have no applications yet.'
            )
          : textForLang(
              lang,
              'trackerIntroVoice',
              'Application Tracker. You have {profileCount} profile and {appCount} scheme application(s).'
            )
            .replace('{profileCount}', profileCount)
            .replace('{appCount}', appCountDedup);

      speakInstruction(msg, lang);

    }, 400);

    return () => clearTimeout(timer);

  }, [
    profilesRefreshed,
    loading,
    applications.length,
    lang,
    hasProfiles
  ]);


  /*
  ---------------------------
  Listen button
  ---------------------------
  */
  const handleListenPage = () => {

    if (!hasProfiles) {

      speakInstruction(

        textForLang(lang, 'noProfilesFound', 'No profiles found.')
        + ' '
        + textForLang(lang, 'noProfiles', 'Add a profile to get started.'),

        lang

      );

      return;

    }

    const filtered = selectedProfileId
      ? normalized.filter((app) => app.profileId === selectedProfileId)
      : normalized;
    const appCountDedup = filtered.length;
    const profileCount = uniqueProfiles.length;
    let msg =
      appCountDedup === 0
        ? textForLang(lang, 'trackerIntroVoiceNone', 'Application Tracker. You have no applications yet.')
        : textForLang(
            lang,
            'trackerIntroVoice',
            'Application Tracker. You have {profileCount} profile and {appCount} scheme application(s).'
          )
          .replace('{profileCount}', profileCount)
          .replace('{appCount}', appCountDedup);
    if (selectedProfileId && selectedProfile && appCountDedup > 0) {
      const name = formatNameForLang(selectedProfile.name, lang);
      msg = `${msg} ${(translations[lang]?.trackerShowingFor || 'Showing applications for {name}.').replace('{name}', name)}`;
    }
    speakInstruction(msg, lang);
  };


  /*
  ---------------------------
  Status change
  ---------------------------
  */
  const handleStatusChange = (appId, newStatus) => {

    return authFetch(`${getApiBase()}/applications/${appId}`, {

      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        status: newStatus
      })

    })
    .then((r) => {

      if (r.ok)
        loadApplications();

    });

  };


  /*
  ---------------------------
  Normalize applications and deduplicate by scheme (same scheme in different languages = one application)
  ---------------------------
  */
  const normalized = (() => {
    const withDates = applications.map((app) => ({
      ...app,
      status: STATUS_VALUES.includes(app.status) ? app.status : 'Draft',
      dateApplied: app.dateApplied || app.createdAt || app.updatedAt,
    }));
    const byScheme = new Map();
    const sorted = [...withDates].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
    for (const app of sorted) {
      if (!byScheme.has(app.schemeId)) byScheme.set(app.schemeId, app);
    }
    return Array.from(byScheme.values());
  })();

  const currentProfileIds = new Set(uniqueProfiles.map((p) => p.id));
  const filteredByProfile = selectedProfileId
    ? normalized.filter((app) => app.profileId === selectedProfileId)
    : normalized.filter((app) => app.profileId && currentProfileIds.has(app.profileId));

  const selectedProfile = selectedProfileId ? uniqueProfiles.find((p) => p.id === selectedProfileId) : null;
  const displayProfileNameRaw = selectedProfile?.name || profileNameRaw;
  const displayProfileName = selectedProfileId ? formatNameForLang(displayProfileNameRaw, lang) : null;

  /*
  ---------------------------
  Ready state: wait for profiles + min delay; if we have profiles, also wait for applications
  ---------------------------
  */
  const ready =
    profilesRefreshed &&
    minLoadingDone &&
    (!hasProfiles || !loading);

  if (ready) hasShownContent.current = true;

  const showLoadingScreen = !hasShownContent.current || !ready;

  /*
  ---------------------------
  Loading UI — only until first time content is ready; then never again (stops flicker)
  ---------------------------
  */
  if (showLoadingScreen) {
    return (
      <div className="application-tracker-page">
        <h1>{textForLang(lang, 'applicationTracker', 'Application Tracker')}</h1>
        <p>{t.loading}</p>
      </div>
    );
  }


  /*
  ---------------------------
  No profiles UI
  ---------------------------
  */
  if (!hasProfiles) {

    return (

      <div className="application-tracker-page">

        <h1>
          {textForLang(lang, 'applicationTracker', 'Application Tracker')}
        </h1>

        <div className="card">

          <p>
            {textForLang(lang, 'noProfilesFound', 'No profiles found.')}
          </p>

          <p>
            {textForLang(lang, 'noProfiles', 'Add profile to continue')}
          </p>

          <Link
            to="/profiles/new"
            className="btn btn-primary"
          >
            {textForLang(lang, 'addProfile', 'Add Profile')}
          </Link>

        </div>

      </div>

    );

  }


  /*
  ---------------------------
  Main UI
  ---------------------------
  */
  return (
    <div className="application-tracker-page">
      <h1>
        {textForLang(lang, 'applicationTracker', 'Application Tracker')}
      </h1>

      {uniqueProfiles.length > 0 && (
        <div className="card" style={{ marginTop: 16, marginBottom: 12 }}>
          <label className="input-group label-only">{textForLang(lang, 'selectProfile', 'Select a profile')}</label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            style={{ width: '100%', padding: 14, fontSize: '1.05rem', borderRadius: 12, border: '2px solid var(--border)' }}
            aria-label={textForLang(lang, 'selectProfile', 'Select a profile')}
          >
            <option value="">{textForLang(lang, 'allProfiles', 'All profiles')}</option>
            {uniqueProfiles.map((p) => (
              <option key={p.id} value={p.id}>{formatNameForLang(p.name, lang)}</option>
            ))}
          </select>
        </div>
      )}

      <p style={{ fontWeight: 600 }}>
        {textForLang(lang, 'trackerGreeting', 'Your applications')}
        {selectedProfileId && displayProfileName && (
          <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
            {' '}— {displayProfileName}
          </span>
        )}
        {!selectedProfileId && profileName && profileName !== defaultApplicantText && uniqueProfiles.length === 1 && (
          <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
            {' '}— {profileName}
          </span>
        )}
      </p>

      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: 4 }}>
        {uniqueProfiles.length === 1
          ? (translations[lang]?.trackerProfileCount || '{count} profile').replace('{count}', uniqueProfiles.length)
          : (translations[lang]?.trackerProfileCountPlural || '{count} profiles').replace('{count}', uniqueProfiles.length)}
        {' · '}
        {filteredByProfile.length === 1
          ? (translations[lang]?.trackerApplicationsCount || '{count} scheme application').replace('{count}', filteredByProfile.length)
          : (translations[lang]?.trackerApplicationsCountPlural || '{count} scheme applications').replace('{count}', filteredByProfile.length)}
      </p>

      <button
        className="btn btn-secondary"
        onClick={handleListenPage}
      >
        {textForLang(lang, 'listenPage', 'Listen to page')}
      </button>

      <div style={{ marginTop: 20 }}>
        {filteredByProfile.length === 0 && !loading ? (
          <div className="card">
            <p>
              {selectedProfileId
                ? textForLang(lang, 'noApplications', 'No applications found')
                : textForLang(lang, 'noApplications', 'No applications found')}
            </p>
          </div>
        ) : (
          <ul className="applications-list">
            {filteredByProfile.map((app) => (
              <ApplicationStatusCard
                key={app.id}
                application={app}
                schemes={schemes}
                defaultProfileName={selectedProfile?.name ?? profileNameRaw}
                onStatusChange={handleStatusChange}
                t={t}
                lang={lang}
              />
            ))}

          </ul>

        )}

      </div>

    </div>

  );

}