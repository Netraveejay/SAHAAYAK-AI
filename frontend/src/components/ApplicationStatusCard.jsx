import React, { useState } from 'react';
import { translations } from '../i18n/translations';
import { speakInstruction } from '../utils/speak';
import { formatNameForLang } from '../utils/transliterate';
import { getSchemeName } from '../utils/schemeI18n';

function labelForLang(lang, key, fallback) {
  return translations[lang]?.[key] || fallback;
}

const STATUS_CLASS = {
  Draft: 'status-draft',
  Submitted: 'status-submitted',
  'Under Review': 'status-under-review',
  Approved: 'status-approved',
  Rejected: 'status-rejected',
};

const STATUS_VALUES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

function getStatusLabel(s, t) {
  if (!t) return s;
  if (s === 'Draft') return t.statusDraft || s;
  if (s === 'Submitted') return t.statusSubmitted || s;
  if (s === 'Under Review') return t.statusUnderReview || s;
  if (s === 'Approved') return t.statusApproved || s;
  if (s === 'Rejected') return t.statusRejected || s;
  return s;
}

/**
 * Displays a single application with scheme name, profile name (if any), date, and status badge.
 * Status colors: Draft=gray, Submitted=blue, Under Review=orange, Approved=green, Rejected=red.
 * When there is no profile (profileName "—" or empty), the Profile line is hidden.
 * Optional onStatusChange(id, newStatus) for PATCH updates.
 */
export function ApplicationStatusCard({ application, schemes = [], defaultProfileName, onStatusChange, t = {}, lang = 'en' }) {
  const { id, schemeId, schemeName: storedSchemeName, profileName: rawProfileName, dateApplied, status } = application;
  const [updating, setUpdating] = useState(false);
  const scheme = Array.isArray(schemes) && schemeId ? schemes.find((s) => s.id === schemeId) : null;
  const schemeName = scheme ? getSchemeName(scheme, lang) : (storedSchemeName || '');
  const statusClass = STATUS_CLASS[status] || 'status-draft';
  const profileLabelText = labelForLang(lang, 'profileLabel', t.profileLabel || 'Profile');
  const defaultApplicantText = labelForLang(lang, 'defaultApplicant', t.defaultApplicant || 'Applicant');
  const dateLabelText = labelForLang(lang, 'dateApplied', t.dateApplied || 'Date');
  const noProfileValue = rawProfileName === '—' || rawProfileName === '-' || !rawProfileName || String(rawProfileName).trim() === '';
  const hasProfile = !noProfileValue;
  const profileNameRaw = hasProfile ? rawProfileName : (defaultProfileName || defaultApplicantText);
  const profileName = formatNameForLang(profileNameRaw, lang);
  const displayDate =
    dateApplied instanceof Date
      ? dateApplied.toLocaleDateString()
      : dateApplied
        ? new Date(dateApplied).toLocaleDateString()
        : '—';

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    if (!STATUS_VALUES.includes(newStatus) || newStatus === status) return;
    if (typeof onStatusChange !== 'function') return;
    setUpdating(true);
    onStatusChange(id, newStatus).finally(() => setUpdating(false));
  };

  const handleSpeakCard = () => {
    const statusLabel = getStatusLabel(status, t);
    const statusLabelKey = labelForLang(lang, 'applicationStatus', t.applicationStatus || 'Status');
    const profilePart = hasProfile ? `${profileLabelText}: ${profileName}. ` : '';
    const msg = `${schemeName}. ${profilePart}${dateLabelText}: ${displayDate}. ${statusLabelKey}: ${statusLabel}.`;
    speakInstruction(msg, lang);
  };

  return (
    <li className="application-status-card-wrapper">
      <article className={`application-status-card ${statusClass}`}>
        <h3 className="application-card-scheme">{schemeName}</h3>
        {hasProfile && (
          <p className="application-card-profile">
            <strong>{profileLabelText}:</strong> {profileName}
          </p>
        )}
        <p className="application-card-date">
          <strong>{dateLabelText}:</strong> {displayDate}
        </p>
        <p className="application-card-status">
          <span className={`status-badge ${statusClass}`}>{getStatusLabel(status, t)}</span>
          {onStatusChange && (
            <select
              value={status}
              onChange={handleStatusChange}
              disabled={updating}
              className="application-status-select"
              aria-label={t.changeStatus || 'Change status'}
            >
              {STATUS_VALUES.map((s) => (
                <option key={s} value={s}>{getStatusLabel(s, t)}</option>
              ))}
            </select>
          )}
        </p>
        <button
          type="button"
          className="btn btn-secondary application-card-listen"
          onClick={handleSpeakCard}
          aria-label={labelForLang(lang, 'listenPage', t.listenPage || 'Listen to page')}
        >
          {labelForLang(lang, 'listenPage', t.listenPage || 'Listen')}
        </button>
      </article>
    </li>
  );
}
