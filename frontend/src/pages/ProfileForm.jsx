import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import { speakInstruction } from '../utils/speak';
import { FieldMicButton } from '../components/FieldMicButton';
import { getApiBase } from '../services/apiService';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Others'
];

export default function ProfileForm({ edit }) {
  const { user, authFetch, refreshProfiles } = useAuth();
  const { t, lang } = useLanguage();
  const voice = useVoice();
  const setVoiceTarget = voice?.setVoiceTarget;
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    state: '',
    occupation: '',
    annualIncome: '',
    category: 'General',
    isFarmer: 'No',
    hasDisability: 'No',
  });

  const isEdit = edit && id;
  const profile = user?.profiles?.find((p) => p.id === id);

  useEffect(() => {
    if (isEdit && profile) {
      setForm({
        name: profile.name || '',
        age: profile.age ?? '',
        gender: profile.gender || 'Male',
        state: profile.state || '',
        occupation: profile.occupation || '',
        annualIncome: profile.annualIncome ?? '',
        category: profile.category || 'General',
        isFarmer: profile.isFarmer ? 'Yes' : 'No',
        hasDisability: profile.hasDisability ? 'Yes' : 'No',
      });
    }
  }, [isEdit, profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const bindField = (name, instructionKey, options = {}) => {
    const isSelect = options.isSelect;
    const mapVoiceToValue = options.mapVoiceToValue;
    return {
      onFocus: () => {
        const instruction = t[instructionKey];
        if (instruction) speakInstruction(instruction, lang);
        setVoiceTarget?.((voiceText) => {
          if (mapVoiceToValue) {
            const value = mapVoiceToValue(voiceText);
            if (value !== undefined) setForm((f) => ({ ...f, [name]: value }));
          } else {
            setForm((f) => ({ ...f, [name]: voiceText.trim() }));
          }
        });
      },
      onBlur: () => setVoiceTarget?.(null),
    };
  };

  const matchGender = (v) => {
    const s = (v || '').toLowerCase();
    if (s.includes('male') && !s.includes('female')) return 'Male';
    if (s.includes('female')) return 'Female';
    if (s.includes('other')) return 'Other';
    return undefined;
  };
  const matchCategory = (v) => {
    const s = (v || '').toLowerCase().replace(/\s/g, '');
    if (s.includes('general')) return 'General';
    if (s.includes('obc')) return 'OBC';
    if (s.includes('sc') || s.includes('s c')) return 'SC';
    if (s.includes('st') || s.includes('s t')) return 'ST';
    return undefined;
  };
  const matchYesNo = (v) => {
    const s = (v || '').toLowerCase();
    if (s.includes('yes') || s.includes('haan') || s.includes('ஆம்')) return 'Yes';
    if (s.includes('no') || s.includes('nahi') || s.includes('இல்லை')) return 'No';
    return undefined;
  };
  const matchState = (voiceText) => {
    const s = (voiceText || '').toLowerCase().trim();
    if (!s) return undefined;
    const found = INDIAN_STATES.find((state) => state.toLowerCase().includes(s) || s.includes(state.toLowerCase()));
    return found || undefined;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        age: Number(form.age) || 0,
        gender: form.gender,
        state: form.state,
        occupation: form.occupation.trim(),
        annualIncome: Number(form.annualIncome) || 0,
        category: form.category,
        isFarmer: form.isFarmer === 'Yes',
        hasDisability: form.hasDisability === 'Yes',
      };
      if (isEdit) {
        await authFetch(`${getApiBase()}/profiles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await authFetch(`${getApiBase()}/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await refreshProfiles();
      navigate('/profiles');
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const pageText = [t.addProfile, t.profileName, t.age, t.gender, t.state, t.occupation, t.annualIncome, t.category, t.isFarmer, t.hasDisability].join('. ');

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{isEdit ? t.editProfile : t.addProfile}</h1>

      <form onSubmit={handleSubmit} className="card">
        <div className="input-group">
          <label htmlFor="name">{t.profileName}</label>
          <div className="input-with-mic">
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              {...bindField('name', 'nameInstruction')}
            />
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => setForm((f) => ({ ...f, name: (v || '').trim() })))} />
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="age">{t.age}</label>
          <div className="input-with-mic">
            <input
              id="age"
              name="age"
              type="number"
              min={1}
              max={120}
              value={form.age}
              onChange={handleChange}
              required
              {...bindField('age', 'ageInstruction', {
                mapVoiceToValue: (v) => (v || '').replace(/\D/g, '').slice(0, 3) || undefined,
              })}
            />
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => setForm((f) => ({ ...f, age: (v || '').replace(/\D/g, '').slice(0, 3) })))} />
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="gender">{t.gender}</label>
          <div className="input-with-mic">
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              {...bindField('gender', 'genderInstruction', { mapVoiceToValue: matchGender })}
            >
              <option value="Male">{t.male}</option>
              <option value="Female">{t.female}</option>
              <option value="Other">{t.otherGender}</option>
            </select>
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => {
              const val = matchGender(v);
              if (val) setForm((f) => ({ ...f, gender: val }));
            })} />
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="state">{t.state}</label>
          <div className="input-with-mic">
            <select
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              required
              {...bindField('state', 'stateInstruction', { mapVoiceToValue: matchState })}
            >
              <option value="">{t.selectState}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => {
              const val = matchState(v);
              if (val) setForm((f) => ({ ...f, state: val }));
            })} />
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="occupation">{t.occupation}</label>
          <div className="input-with-mic">
            <input
              id="occupation"
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
              required
              {...bindField('occupation', 'occupationInstruction')}
            />
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => setForm((f) => ({ ...f, occupation: (v || '').trim() })))} />
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="annualIncome">{t.annualIncome}</label>
          <div className="input-with-mic">
            <input
              id="annualIncome"
              name="annualIncome"
              type="number"
              min={0}
              value={form.annualIncome}
              onChange={handleChange}
              required
              {...bindField('annualIncome', 'annualIncomeInstruction', {
                mapVoiceToValue: (v) => (v || '').replace(/\D/g, '').slice(0, 10) || undefined,
              })}
            />
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => setForm((f) => ({ ...f, annualIncome: (v || '').replace(/\D/g, '').slice(0, 10) })))} />
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="category">{t.category}</label>
          <div className="input-with-mic">
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              {...bindField('category', 'categoryInstruction', { mapVoiceToValue: matchCategory })}
            >
              <option value="General">{t.general}</option>
              <option value="OBC">{t.obc}</option>
              <option value="SC">{t.sc}</option>
              <option value="ST">{t.st}</option>
            </select>
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => {
              const val = matchCategory(v);
              if (val) setForm((f) => ({ ...f, category: val }));
            })} />
          </div>
        </div>
        <div className="input-group">
          <label>{t.isFarmer}</label>
          <div className="input-with-mic" style={{ alignItems: 'center' }}>
            <div
              className="radio-group"
              style={{ flex: 1 }}
              onFocusCapture={() => {
                speakInstruction(t.isFarmerInstruction, lang);
                setVoiceTarget?.((voiceText) => {
                  const val = matchYesNo(voiceText);
                  if (val) setForm((f) => ({ ...f, isFarmer: val }));
                });
              }}
              onBlurCapture={() => setVoiceTarget?.(null)}
            >
              <label><input type="radio" name="isFarmer" value="Yes" checked={form.isFarmer === 'Yes'} onChange={handleChange} /> {t.yes}</label>
              <label><input type="radio" name="isFarmer" value="No" checked={form.isFarmer === 'No'} onChange={handleChange} /> {t.no}</label>
            </div>
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => {
              const val = matchYesNo(v);
              if (val) setForm((f) => ({ ...f, isFarmer: val }));
            })} />
          </div>
        </div>
        <div className="input-group">
          <label>{t.hasDisability}</label>
          <div className="input-with-mic" style={{ alignItems: 'center' }}>
            <div
              className="radio-group"
              style={{ flex: 1 }}
              onFocusCapture={() => {
                speakInstruction(t.hasDisabilityInstruction, lang);
                setVoiceTarget?.((voiceText) => {
                  const val = matchYesNo(voiceText);
                  if (val) setForm((f) => ({ ...f, hasDisability: val }));
                });
              }}
              onBlurCapture={() => setVoiceTarget?.(null)}
            >
              <label><input type="radio" name="hasDisability" value="Yes" checked={form.hasDisability === 'Yes'} onChange={handleChange} /> {t.yes}</label>
              <label><input type="radio" name="hasDisability" value="No" checked={form.hasDisability === 'No'} onChange={handleChange} /> {t.no}</label>
            </div>
            <FieldMicButton onRegisterTarget={(setTarget) => setTarget((v) => {
              const val = matchYesNo(v);
              if (val) setForm((f) => ({ ...f, hasDisability: val }));
            })} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? '...' : t.saveProfile}
        </button>
      </form>
    </div>
  );
}
