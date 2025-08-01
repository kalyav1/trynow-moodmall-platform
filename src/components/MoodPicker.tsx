import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

// Emoji options and their corresponding moods
const EMOJIS = [
  { emoji: '😀', mood: 'Happy' },
  { emoji: '😢', mood: 'Sad' },
  { emoji: '😡', mood: 'Angry' },
  { emoji: '😍', mood: 'Loving' },
  { emoji: '😱', mood: 'Surprised' },
  { emoji: '😎', mood: 'Cool' },
  { emoji: '🤔', mood: 'Thinking' },
  { emoji: '🥳', mood: 'Celebrating' },
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

interface MoodPickerProps {
  onMoodSelect?: (mood: string | File) => void;
}

const MoodPicker: React.FC<MoodPickerProps> = ({ onMoodSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);

  // Load face-api.js models on mount
  useEffect(() => {
    const loadModels = async () => {
      setModelsLoaded(false);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  // Handle emoji selection and deselection
  const handleEmojiClick = (emoji: string) => {
    setSelectedMood(selectedMood === emoji ? null : emoji);
    setImagePreview(null);
    setFileName(null);
    setError(null);
    setDetectedEmotion(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onMoodSelect) onMoodSelect(selectedMood === emoji ? '' : emoji);
  };

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedMood(null); // Clear emoji selection
    setDetectedEmotion(null);
    setError(null);
    setImagePreview(null); // <-- Clear preview before processing
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG and PNG images are allowed.');
      setImagePreview(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size must be less than 2MB.');
      setImagePreview(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size === 0) {
      setError('Uploaded file is empty or corrupted.');
      setImagePreview(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      setError(null);
      setFileName(file.name);
      // Validate face and detect emotion
      try {
        // Create an image element
        const img = new window.Image();
        img.src = reader.result as string;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        // Detect face and emotion
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
        if (!detection) {
          setError('No human face detected in the image.');
          setImagePreview(null);
          setFileName(null);
          setDetectedEmotion(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setImagePreview(reader.result as string); // <-- Only set after detection
          // Find the dominant emotion
          const expressions = detection.expressions;
          const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
          const [dominant, prob] = sorted[0];
          setDetectedEmotion(`${capitalize(dominant)} (${(prob * 100).toFixed(0)}%)`);
          if (onMoodSelect) onMoodSelect(file);
        }
      } catch (err) {
        setError('Failed to process image for face detection.');
        setImagePreview(null);
        setFileName(null);
        setDetectedEmotion(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setImagePreview(null);
      setDetectedEmotion(null);
      setProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiButtonClick = () => {
    setSelectedMood(null);
    setImagePreview(null);
    setError(null);
    setFileName(null);
    setDetectedEmotion(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Get mood label for selected emoji
  const getMoodLabel = (emoji: string | null) => {
    if (!emoji) return null;
    const found = EMOJIS.find(e => e.emoji === emoji);
    return found ? found.mood : null;
  };

  // Determine if emoji or image is active
  const emojiActive = !!selectedMood && !imagePreview;
  const imageActive = !!imagePreview;

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <div className="app-card compact-mood-card" style={{ position: 'relative' }}>
      {/* Spinner overlay when processing */}
      {processing && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.7)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'all',
          borderRadius: 16,
        }}>
          <div className="spinner" style={{ marginBottom: 12 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" stroke="#2563eb" strokeWidth="4" strokeDasharray="80" strokeDashoffset="60" fill="none">
                <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div style={{ color: '#2563eb', fontWeight: 600, fontSize: 16 }}>Detecting face and mood...</div>
        </div>
      )}
      {/* Main content */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#232f3e', letterSpacing: '0.01em' }}>Express Your Mood</h2>
      {!modelsLoaded && (
        <div style={{ color: '#2563eb', fontWeight: 500, marginBottom: 12 }}>Loading face detection models...</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', width: '100%' }}>
        {/* Emoji Picker */}
        <div className={imageActive ? 'sunk-section' : ''}>
          <div style={{ marginBottom: '0.3rem', color: '#37475a', fontWeight: 500, fontSize: 14 }}>Pick an emoji:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {EMOJIS.map(({ emoji }) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-btn${selectedMood === emoji ? ' selected' : ''}`}
                onClick={() => handleEmojiClick(emoji)}
                aria-label={`Select mood ${emoji}`}
                style={{ fontSize: '1.3rem', padding: '0.3rem 0.7rem' }}
                disabled={!!imagePreview || !modelsLoaded}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleEmojiClick(emoji);
                  }
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        {/* Show mood label if emoji is selected and no image is selected */}
        {selectedMood && getMoodLabel(selectedMood) && !imagePreview && (
          <div style={{ marginTop: 8, color: '#007185', fontWeight: 600, fontSize: 15 }}>
            Mood: {getMoodLabel(selectedMood)}
          </div>
        )}
        {/* OR divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0.7rem 0' }}>
          <div style={{ flexGrow: 1, borderTop: '1px solid #e0ecff' }}></div>
          <span style={{ margin: '0 0.7rem', color: '#888', fontSize: 13 }}>or</span>
          <div style={{ flexGrow: 1, borderTop: '1px solid #e0ecff' }}></div>
        </div>
        {/* Image Upload */}
        <div className={emojiActive ? 'sunk-section' : ''} style={{ display: imagePreview ? 'flex' : 'block', alignItems: 'center', gap: imagePreview ? 16 : 0 }}>
          <div style={{ marginBottom: imagePreview ? 0 : '0.3rem', color: '#37475a', fontWeight: 500, fontSize: 14, minWidth: 160 }}>
            Upload an image (JPEG/PNG, &lt;2MB):
            <br />
            <label
              htmlFor="mood-file-input"
              className={`custom-file-label${!!selectedMood && !imagePreview ? ' sunk-section' : ''}`}
              style={{ pointerEvents: (!!selectedMood && !imagePreview) ? 'none' : undefined, opacity: (!!selectedMood && !imagePreview) ? 0.5 : 1, marginTop: 8 }}
            >
              <span className="file-icon" role="img" aria-label="Upload">📁</span>
              Choose File
              <input
                id="mood-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                aria-label="Upload mood image"
                style={{ fontSize: 13, padding: '0.3rem' }}
                disabled={!!selectedMood && !imagePreview || !modelsLoaded}
              />
            </label>
            {fileName && (
              <div style={{ marginTop: 4, color: '#37475a', fontSize: 12 }}>Selected: {fileName}</div>
            )}
          </div>
          {/* Preview to the right */}
          {imagePreview && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 8 }}>
              <img src={imagePreview} alt="Mood preview" style={{ maxHeight: 80, borderRadius: 10, boxShadow: '0 2px 8px 0 #232f3e22', marginBottom: 4 }} />
              {processing && <div style={{ color: '#2563eb', fontSize: 13, marginBottom: 4 }}>Detecting face and mood...</div>}
              {detectedEmotion && !processing && (
                <div style={{ color: '#007185', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Detected Mood: {detectedEmotion}</div>
              )}
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: 12, padding: '0.3rem 0.7rem', width: 'fit-content' }}
                onClick={handleEmojiButtonClick}
              >
                Remove image
              </button>
            </div>
          )}
        </div>
        {error && (
          <div style={{ marginTop: '0.3rem', color: '#d7263d', fontWeight: 500, fontSize: 13 }} role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodPicker;
