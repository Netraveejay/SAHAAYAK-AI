import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getApiBase } from '../services/apiService';

export default function Profiles() {
  const { user, refreshProfiles, setUserProfiles, authFetch } = useAuth();
  const { t } = useLanguage();
  const [profiles, setProfiles] = React.useState([]);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  useEffect(() => {
    setProfiles(user?.profiles || []);
  }, [user?.profiles]);

  const deleteProfile = async (id) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await authFetch(`${getApiBase()}/profiles/${id}`, { method: 'DELETE' });
      const nextProfiles = (user?.profiles || []).filter((p) => p.id !== id);
      setUserProfiles(nextProfiles);
      await refreshProfiles();
    } catch (e) {
      alert(t.deleteFailed);
    }
  };

  const pageText = [t.myProfiles, t.addProfile, profiles.length ? `${profiles.length} ${t.profilesCount}` : t.noProfiles].join('. ');

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>{t.myProfiles}</h1>
      <p style={{ marginBottom: 24 }}>{t.manageProfiles}</p>

      <div className="card">
        <Link to="/profiles/new" className="btn btn-primary" style={{ marginBottom: 20 }}>
          {t.addProfile}
        </Link>

        {profiles.length === 0 ? (
          <p>{t.noProfiles}</p>
        ) : (
          <ul className="profile-list">
            {profiles.map((p) => (
              <li key={p.id} className="profile-card card">
                <div>
                  <strong>{p.name}</strong> — {p.age} {t.yrs}, {p.gender}, {p.state}
                  <br />
                  <small>{p.occupation}, ₹{p.annualIncome?.toLocaleString()}/yr, {p.category}</small>
                  <br />
                  <small>{t.farmerLabel}: {p.isFarmer ? t.yes : t.no}, {t.disabilityLabel}: {p.hasDisability ? t.yes : t.no}</small>
                </div>
                <div className="profile-actions">
                  <Link to={`/profiles/edit/${p.id}`} className="btn btn-secondary">
                    {t.editProfile}
                  </Link>
                  <button type="button" className="btn btn-secondary" onClick={() => deleteProfile(p.id)}>
                    {t.deleteProfile}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
