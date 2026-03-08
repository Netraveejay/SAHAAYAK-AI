import React, { useEffect } from 'react';
import { speakInstruction } from '../utils/voiceInstruction';

/**
 * Visual aid modal: example image, text instruction, voice playback, optional demo video.
 * Used when user clicks on document upload field or "View example" to guide document capture.
 */
export function VisualAidModal({
  isOpen,
  onClose,
  title,
  description,
  imageUrl,
  videoUrl,
  voiceText,
  voiceLang = 'en-IN',
  playVoiceLabel = 'Play Voice Instruction',
  closeLabel = 'Close',
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handlePlayVoice = () => {
    if (voiceText) speakInstruction(voiceText, voiceLang);
  };

  if (!isOpen) return null;

  return (
    <div
      className="visual-aid-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visual-aid-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="visual-aid-modal" onClick={(e) => e.stopPropagation()}>
        <div className="visual-aid-header">
          <h2 id="visual-aid-title" className="visual-aid-title">
            {title}
          </h2>
          <button
            type="button"
            className="visual-aid-close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>

        <div className="visual-aid-content">
          {imageUrl && (
            <div className="visual-aid-image-wrap">
              <img
                src={imageUrl}
                alt=""
                className="visual-aid-image"
                loading="lazy"
              />
            </div>
          )}
          {!imageUrl && !videoUrl && (
            <div className="visual-aid-placeholder">
              <span aria-hidden="true">📄</span>
              <p>Example document</p>
            </div>
          )}

          {videoUrl && (
            <div className="visual-aid-video-wrap">
              <video
                src={videoUrl}
                controls
                playsInline
                className="visual-aid-video"
                aria-label="Demo video"
              />
            </div>
          )}

          {description && (
            <p className="visual-aid-description">{description}</p>
          )}

          {voiceText && (
            <button
              type="button"
              className="btn btn-primary visual-aid-voice-btn"
              onClick={handlePlayVoice}
              aria-label={playVoiceLabel}
            >
              🔊 {playVoiceLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
