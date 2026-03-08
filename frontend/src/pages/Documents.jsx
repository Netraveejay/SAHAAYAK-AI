import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { speakInstruction } from '../utils/speak';
import { VisualAidModal } from '../components/VisualAidModal';
import { DOCUMENT_EXAMPLE_IMAGES } from '../constants/documentExamples';
import { getApiBase } from '../services/apiService';

const LANG_TO_VOICE = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' };

function getDocTypeTitle(docType, t) {
  if (docType === 'aadhaar') return t.aadhaar;
  if (docType === 'pan') return t.pan;
  if (docType === 'income_certificate') return t.incomeCertificate;
  return t.document;
}

export default function Documents() {
  const { token } = useAuth();
  const { t, lang } = useLanguage();
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('aadhaar');
  const [visualAidOpen, setVisualAidOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const getVoiceInstruction = () => {
    if (docType === 'aadhaar') return t.aadhaarVoiceInstruction;
    if (docType === 'pan') return t.panVoiceInstruction;
    if (docType === 'income_certificate') return t.incomeCertificateVoiceInstruction;
    return t.otherVoiceInstruction;
  };

  const getVoiceInstructionForEffect = () => {
    if (docType === 'aadhaar') return t.aadhaarVoiceInstruction;
    if (docType === 'pan') return t.panVoiceInstruction;
    if (docType === 'income_certificate') return t.incomeCertificateVoiceInstruction;
    return t.otherVoiceInstruction;
  };

  useEffect(() => {
    const text = getVoiceInstructionForEffect();
    if (text) speakInstruction(text, lang);
  }, [docType, lang, t.aadhaarVoiceInstruction, t.panVoiceInstruction, t.incomeCertificateVoiceInstruction, t.otherVoiceInstruction]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handlePlayInstruction = () => {
    const text = getVoiceInstruction();
    if (text) speakInstruction(text, lang);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current && stream) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      setCameraError(t.allowCamera || 'Please allow camera access to take a photo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraError('');
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || video.readyState !== 4) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const name = `capture_${docType}_${Date.now()}.jpg`;
        const f = new File([blob], name, { type: 'image/jpeg' });
        setFile(f);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage(t.selectFile);
      return;
    }
    setUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${getApiBase()}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadedFiles((prev) => [...prev, { ...data.file, docType }]);
        setFile(null);
        setMessage(t.uploadSuccess);
      } else {
        setMessage(data.error || t.uploadFailed);
      }
    } catch (err) {
      setMessage(t.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const pageText = [t.uploadDocuments, t.documentsIntro, t.aadhaarVoiceInstruction, t.panVoiceInstruction, t.incomeCertificateVoiceInstruction, t.otherVoiceInstruction].join('. ');

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>{t.documents}</h1>
      <p style={{ marginBottom: 24 }}>{t.documentsIntro}</p>

      <div className="card">
        <h2 style={{ marginBottom: 16 }}>{t.uploadDocuments}</h2>

        <div className="document-voice-instruction card" style={{ background: 'var(--bg)', marginBottom: 20 }}>
          <p style={{ marginBottom: 12, fontWeight: 600 }}>{t.listenDocInstruction}</p>
          <p style={{ marginBottom: 12, fontSize: '0.95rem' }}>
            {docType === 'aadhaar' && t.aadhaarVoiceInstruction}
            {docType === 'pan' && t.panVoiceInstruction}
            {docType === 'income_certificate' && t.incomeCertificateVoiceInstruction}
            {docType === 'other' && t.otherVoiceInstruction}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePlayInstruction}
            aria-label={t.listenDocInstruction}
          >
            🔊 {t.listenDocInstruction}
          </button>
        </div>

        <form onSubmit={handleUpload}>
          <div className="input-group">
            <label>{t.documentType}</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="aadhaar">{t.aadhaar}</option>
              <option value="pan">{t.pan}</option>
              <option value="income_certificate">{t.incomeCertificate}</option>
              <option value="other">{t.other}</option>
            </select>
          </div>
          <div className="input-group">
            <label>
              {t.file}
              <button
                type="button"
                className="visual-aid-trigger"
                onClick={(e) => { e.preventDefault(); setVisualAidOpen(true); }}
                style={{ marginLeft: 8, fontSize: '0.9rem', fontWeight: 'normal', textDecoration: 'underline', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
              >
                ({t.viewExample})
              </button>
            </label>
            <div className="document-upload-options">
              <button type="button" className="btn btn-primary doc-upload-btn" onClick={startCamera}>
                📷 {t.takePhoto}
              </button>
              <button type="button" className="btn btn-secondary doc-upload-btn" onClick={() => fileInputRef.current?.click()}>
                📁 {t.chooseFile}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden-file-input"
                aria-hidden
              />
            </div>
            {file && (
              <p className="selected-file-name" style={{ marginTop: 8 }}>
                {t.file}: {file.name}
              </p>
            )}
            {cameraError && !cameraOpen && <p className="error-msg" style={{ marginTop: 8 }}>{cameraError}</p>}
          </div>
          {cameraOpen && (
            <div className="camera-modal-overlay" role="dialog" aria-modal="true" aria-label="Camera">
              <div className="camera-modal">
                <p className="camera-instruction">{t.allowCamera}</p>
                <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
                {cameraError && <p className="error-msg" style={{ margin: 0 }}>{cameraError}</p>}
                <div className="camera-actions">
                  <button type="button" className="btn btn-secondary" onClick={stopCamera}>
                    {t.cancelCamera}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={captureFromCamera}>
                    {t.capturePhoto}
                  </button>
                </div>
              </div>
            </div>
          )}
          {message && <p className={message === t.uploadSuccess ? 'success-msg' : 'error-msg'}>{message}</p>}
          <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
            {uploading ? t.uploading : t.upload}
          </button>
        </form>
      </div>

      <VisualAidModal
        isOpen={visualAidOpen}
        onClose={() => setVisualAidOpen(false)}
        title={getDocTypeTitle(docType, t)}
        description={getVoiceInstruction()}
        imageUrl={DOCUMENT_EXAMPLE_IMAGES[docType] || DOCUMENT_EXAMPLE_IMAGES.other}
        videoUrl={undefined}
        voiceText={getVoiceInstruction()}
        voiceLang={LANG_TO_VOICE[lang] || 'en-IN'}
        playVoiceLabel={t.playVoiceInstruction}
        closeLabel={t.close}
      />

      {uploadedFiles.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 12 }}>{t.uploadedFiles}</h2>
          <ul>
            {uploadedFiles.map((f, i) => (
              <li key={i}>
                {f.docType || t.document}: {f.originalName} — <a href={f.path} target="_blank" rel="noopener noreferrer">{t.view}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
