import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://r8bzfdhqij.execute-api.ap-south-1.amazonaws.com/Prod/api';

const translations = {
  en: {
    title: 'AI Recommendations',
    selectProfile: 'Select Profile',
    getRecommendations: 'Get Recommendations',
    loading: 'Getting recommendations...',
    schemeName: 'Recommended Scheme',
    benefits: 'Benefits',
    whyEligible: 'Why You Are Eligible',
    playAudio: 'Play Audio Explanation',
    stopAudio: 'Stop Audio',
    error: 'Failed to get recommendations',
    noProfiles: 'No profiles found. Add a profile first.',
    selectProfileFirst: 'Please select a profile',
  },
  ta: {
    title: 'AI பரிந்துரைகள்',
    selectProfile: 'சுயவிவரத்தைத் தேர்ந்தெடுக்கவும்',
    getRecommendations: 'பரிந்துரைகளைப் பெறுங்கள்',
    loading: 'பரிந்துரைகளைப் பெறுகிறது...',
    schemeName: 'பரிந்துரைக்கப்பட்ட திட்டம்',
    benefits: 'நன்மைகள்',
    whyEligible: 'நீங்கள் ஏன் தகுதியானவர்',
    playAudio: 'ஆடியோ விளக்கத்தை இயக்கவும்',
    stopAudio: 'ஆடியோவை நிறுத்து',
    error: 'பரிந்துரைகளைப் பெற முடியவில்லை',
    noProfiles: 'சுயவிவரங்கள் இல்லை. முதலில் சுயவிவரத்தைச் சேர்க்கவும்.',
    selectProfileFirst: 'தயவுசெய்து சுயவிவரத்தைத் தேர்ந்தெடுக்கவும்',
  },
};

export default function Recommendations() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const t = translations[language] || translations.en;

  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/profiles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selectedProfile) {
      setError(t.selectProfileFirst);
      return;
    }

    setLoading(true);
    setError('');
    setRecommendation(null);

    const profile = profiles.find((p) => p.id === selectedProfile);
    if (!profile) return;

    try {
      const res = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile: {
            age: profile.age,
            gender: profile.gender,
            state: profile.state,
            occupation: profile.occupation,
            annualIncome: profile.annualIncome,
            category: profile.category,
            isFarmer: profile.isFarmer,
            hasDisability: profile.hasDisability,
          },
          language: language === 'ta' ? 'tamil' : 'english',
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      setRecommendation(data);
    } catch (err) {
      setError(t.error);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (!recommendation?.audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(recommendation.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setError('Audio playback failed');
      };
    }

    audioRef.current.play();
    setIsPlaying(true);
  };

  const parseExplanation = (text) => {
    if (!text) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)))
      .map((line) => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{t.title}</h1>

      {profiles.length === 0 ? (
        <p style={styles.noProfiles}>{t.noProfiles}</p>
      ) : (
        <>
          <div style={styles.selectGroup}>
            <label style={styles.label}>{t.selectProfile}</label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              style={styles.select}
            >
              <option value="">{t.selectProfile}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age} yrs)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGetRecommendations}
            disabled={loading || !selectedProfile}
            style={{
              ...styles.button,
              ...(loading || !selectedProfile ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? t.loading : t.getRecommendations}
          </button>
        </>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {recommendation && (
        <div style={styles.card}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t.schemeName}</h2>
            <p style={styles.schemeName}>{recommendation.schemeName}</p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t.benefits}</h3>
            <p style={styles.text}>{recommendation.benefits}</p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t.whyEligible}</h3>
            <ul style={styles.list}>
              {parseExplanation(recommendation.explanationText).map((item, idx) => (
                <li key={idx} style={styles.listItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {recommendation.audioUrl && (
            <button onClick={handlePlayAudio} style={styles.audioButton}>
              {isPlaying ? '⏸ ' + t.stopAudio : '▶ ' + t.playAudio}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#1a472a',
    textAlign: 'center',
  },
  selectGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333',
  },
  select: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    borderRadius: '8px',
    border: '2px solid #ccc',
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    padding: '18px',
    fontSize: '22px',
    fontWeight: 'bold',
    backgroundColor: '#2e7d32',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  error: {
    padding: '16px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '18px',
    textAlign: 'center',
  },
  noProfiles: {
    fontSize: '20px',
    color: '#666',
    textAlign: 'center',
    padding: '40px 20px',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1a472a',
    marginBottom: '12px',
  },
  schemeName: {
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  text: {
    fontSize: '20px',
    lineHeight: '1.6',
    color: '#333',
  },
  list: {
    paddingLeft: '20px',
    margin: 0,
  },
  listItem: {
    fontSize: '20px',
    lineHeight: '1.8',
    color: '#333',
    marginBottom: '12px',
  },
  audioButton: {
    width: '100%',
    padding: '18px',
    fontSize: '22px',
    fontWeight: 'bold',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
  },
};
