import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';

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

// Modern color palette and design tokens
const COLORS = {
  primaryBg: '#F7FAFC',
  accent: '#4F8CFF',
  secondaryBg: '#FFFFFF',
  textPrimary: '#23272F',
  textSecondary: '#6B7280',
  disabled: '#E5E7EB',
  border: '#E0E7EF',
  shadow: '0 4px 24px 0 #B6C6E633',
};

const FONT = {
  family: `'Inter', 'Segoe UI', Arial, sans-serif`,
  heading: 700,
  subheading: 500,
  body: 400,
  button: 600,
};

const EMOJIS_MAIN = [
  { emoji: '😀', mood: 'Happy' },
  { emoji: '😢', mood: 'Sad' },
  { emoji: '😡', mood: 'Angry' },
  { emoji: '😍', mood: 'Loving' },
  { emoji: '😱', mood: 'Surprised' },
  { emoji: '😎', mood: 'Cool' },
  { emoji: '🤔', mood: 'Thinking' },
  { emoji: '🥳', mood: 'Celebrating' },
];
const EMOJIS_MORE = [
  { emoji: '😴', mood: 'Sleepy' },
  { emoji: '😇', mood: 'Blessed' },
  { emoji: '😤', mood: 'Determined' },
  { emoji: '😬', mood: 'Awkward' },
  { emoji: '😋', mood: 'Hungry' },
  { emoji: '😐', mood: 'Neutral' },
  { emoji: '😜', mood: 'Playful' },
  { emoji: '🥰', mood: 'Affectionate' },
  { emoji: '😔', mood: 'Disappointed' },
  { emoji: '🤩', mood: 'Excited' }
];

// Add funny messages for moods
const FUNNY_MESSAGES: Record<string, string[]> = {
  Happy: ["You're beaming! Time for some retail therapy!", "Happiness detected. Let's shop like it's your birthday!", "Smiles are contagious—so are great deals!"],
  Sad: ["A little shopping might cheer you up!", "Sad? Let's find something to turn that frown upside down!", "Blue mood? Blue jeans?"],
  Angry: ["Angry? Smash that 'Add to Cart' button!", "Let's channel that rage into some shopping!", "Anger detected. How about a stress ball?"],
  Loving: ["Love is in the air—and so are discounts!", "Feeling the love? Find the perfect gift!", "Hearts and carts!"],
  Surprised: ["Surprise! You get recommendations!", "Didn't see these deals coming, did you?", "Surprised? Wait till you see these products!"],
  Cool: ["Too cool for school—never too cool for shopping!", "Cool mood, cooler deals!", "Stay frosty, shop savvy!"],
  Thinking: ["Thinking hard? Let us recommend something easy!", "Pondering purchases? We've got ideas!", "Deep thoughts, deeper discounts!"],
  Celebrating: ["Party time! Let's shop for the occasion!", "Celebrate with a shopping spree!", "Confetti and carts!"],
  Sleepy: ["Sleepy? Maybe a new pillow!", "Yawn... time for cozy shopping!", "Shop in your dreams!"],
  Blessed: ["Feeling blessed? Treat yourself!", "Count your blessings—and your savings!", "Blessed and best-dressed!"],
  Determined: ["Determined to find a deal? You're in the right place!", "Let's conquer that wishlist!", "Determined mood, determined discounts!"],
  Awkward: ["Awkward? Not with these deals!", "Shop away the awkwardness!", "Let's make it less awkward with a great find!"],
  Hungry: ["Hungry for deals? Dig in!", "Snack and shop!", "Feed your cart!"],
  Neutral: ["Feeling neutral? Our deals aren't!", "Meh mood, wow products!", "Let's spice up your day!"],
  Playful: ["Playful mood, playful picks!", "Let's have some fun shopping!", "Game on for great deals!"],
  Affectionate: ["Spread the love with a gift!", "Affection detected—let's find something sweet!", "Hugs, kisses, and shopping wishes!"],
  Disappointed: ["Disappointed? Not for long!", "Let us turn that disappointment into delight!", "Shop away the blues!"],
  Excited: ["Excited? So are we! Check these out!", "Excitement level: shopping spree!", "Let's ride that excitement to the checkout!"],
};

function getFunnyMessage(mood: string) {
  const arr = FUNNY_MESSAGES[mood] || ["Let's find something for your vibe!"];
  return arr[Math.floor(Math.random() * arr.length)];
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
  const [showMoreMoods, setShowMoreMoods] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

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

  // Tooltip logic for mutual exclusivity
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

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
    const found = EMOJIS_MAIN.concat(EMOJIS_MORE).find(e => e.emoji === emoji);
    return found ? found.mood : null;
  };

  // Determine which mood and message to show
  let moodToShow: string | null = null;
  let moodSource: 'emoji' | 'image' | null = null;
  if (selectedMood && !imagePreview) {
    moodToShow = getMoodLabel(selectedMood);
    moodSource = 'emoji';
  } else if (detectedEmotion && imagePreview) {
    // detectedEmotion is like "Happy (95%)"; extract the mood
    const match = detectedEmotion.match(/^(\w+)/);
    moodToShow = match ? match[1] : null;
    moodSource = 'image';
  }
  const funnyMessage = moodToShow ? getFunnyMessage(moodToShow) : null;

  // Determine if emoji or image is active
  const emojiActive = !!selectedMood && !imagePreview;
  const imageActive = !!imagePreview;

  // Mutual exclusivity UI logic
  const emojiSectionDisabled = !!imagePreview;
  const imageSectionDisabled = !!selectedMood;

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <div
      className="modern-mood-card"
      style={{
        background: COLORS.secondaryBg,
        borderRadius: 20,
        boxShadow: COLORS.shadow,
        padding: 32,
        maxWidth: 420,
        margin: '40px auto',
        fontFamily: FONT.family,
        position: 'relative',
      }}
    >
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
          borderRadius: 20,
        }}>
          <div className="spinner" style={{ marginBottom: 12 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" stroke={COLORS.accent} strokeWidth="4" strokeDasharray="80" strokeDashoffset="60" fill="none">
                <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div style={{ color: COLORS.accent, fontWeight: 600, fontSize: 16 }}>Detecting face and mood...</div>
        </div>
      )}
      {/* Headings */}
      <h2 style={{
        fontSize: 32,
        fontWeight: FONT.heading,
        color: COLORS.textPrimary,
        marginBottom: 8,
        letterSpacing: 0.5,
      }}>
        How are you feeling today?
      </h2>
      <div style={{
        fontSize: 18,
        fontWeight: FONT.subheading,
        color: COLORS.textSecondary,
        marginBottom: 28,
      }}>
        Pick an emoji or upload an image to find products that match your vibe.
      </div>
      {/* Emoji Picker Section */}
      <div
        className="emoji-section"
        style={{
          opacity: emojiSectionDisabled ? 0.5 : 1,
          filter: emojiSectionDisabled ? 'grayscale(0.7)' : 'none',
          pointerEvents: emojiSectionDisabled ? 'none' : 'auto',
          marginBottom: 18,
          transition: 'opacity 0.2s, filter 0.2s',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 8 }}>
          {(() => {
            // If expanded, show all emojis as before
            if (showMoreMoods) return [...EMOJIS_MAIN, ...EMOJIS_MORE];
            // If not expanded, but selectedMood is in EMOJIS_MORE, swap it into the last slot
            const main = [...EMOJIS_MAIN];
            if (selectedMood && EMOJIS_MORE.some(e => e.emoji === selectedMood) && !main.some(e => e.emoji === selectedMood)) {
              main[main.length - 1] = EMOJIS_MORE.find(e => e.emoji === selectedMood)!;
            }
            return main;
          })().map(({ emoji }, idx) => (
            <button
              key={emoji + idx}
              type="button"
              className={`modern-emoji-btn${selectedMood === emoji ? ' selected' : ''}`}
              aria-label={`Select mood ${emoji}`}
              style={{
                fontSize: 28,
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: selectedMood === emoji ? `3px solid ${COLORS.accent}` : `2px solid ${COLORS.border}`,
                background: selectedMood === emoji ? COLORS.primaryBg : COLORS.secondaryBg,
                boxShadow: selectedMood === emoji ? `0 0 0 4px ${COLORS.accent}33` : '0 2px 8px 0 #232f3e11',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(.4,0,.2,1)',
                transform: selectedMood === emoji ? 'scale(1.15)' : 'scale(1)',
                position: 'relative',
              }}
              onClick={() => handleEmojiClick(emoji)}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleEmojiClick(emoji);
                }
              }}
              onMouseEnter={e => {
                if (selectedMood !== emoji) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 6px ${COLORS.accent}22`;
                }
              }}
              onMouseLeave={e => {
                if (selectedMood !== emoji) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px 0 #232f3e11';
                }
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="more-moods-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            margin: '0 auto',
            background: COLORS.primaryBg,
            color: COLORS.accent,
            border: 'none',
            borderRadius: 16,
            padding: '6px 16px',
            fontSize: 16,
            fontWeight: FONT.button,
            cursor: 'pointer',
            boxShadow: '0 1px 4px 0 #4F8CFF11',
            transition: 'background 0.12s, box-shadow 0.12s',
            marginBottom: 8,
          }}
          onClick={() => setShowMoreMoods(v => !v)}
        >
          {showMoreMoods ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
          {showMoreMoods ? 'Less Moods' : 'More Moods'}
        </button>
      </div>
      {/* Tooltip for mutual exclusivity */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          background: COLORS.accent,
          color: '#fff',
          borderRadius: 12,
          padding: '6px 18px',
          fontSize: 15,
          fontWeight: 500,
          boxShadow: '0 2px 8px 0 #4F8CFF33',
          zIndex: 20,
          opacity: 0.95,
          pointerEvents: 'none',
        }}>
          {showTooltip}
        </div>
      )}
      {/* Elegant OR divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0' }}>
        <div style={{ flexGrow: 1, borderTop: `1.5px solid ${COLORS.border}` }}></div>
        <span style={{ margin: '0 16px', color: COLORS.textSecondary, fontSize: 15, fontWeight: 500 }}>or</span>
        <div style={{ flexGrow: 1, borderTop: `1.5px solid ${COLORS.border}` }}></div>
      </div>
      {/* Image Upload Section */}
      <div
        className="image-section"
        style={{
          opacity: imageSectionDisabled ? 0.5 : 1,
          filter: imageSectionDisabled ? 'grayscale(0.7)' : 'none',
          pointerEvents: imageSectionDisabled ? 'none' : 'auto',
          marginBottom: 24,
          transition: 'opacity 0.2s, filter 0.2s',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 8 }}>
          Upload an image for style inspiration:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {!imagePreview && (
            <label
              htmlFor="mood-file-input"
              className="modern-file-label"
              style={{
                background: COLORS.accent,
                color: '#fff',
                borderRadius: 16,
                padding: '10px 22px',
                fontSize: 16,
                fontWeight: FONT.button,
                cursor: 'pointer',
                boxShadow: '0 2px 8px 0 #4F8CFF22',
                transition: 'background 0.12s, box-shadow 0.12s',
                border: 'none',
                outline: 'none',
                position: 'relative',
              }}
              tabIndex={0}
              onMouseEnter={e => {
                (e.currentTarget as HTMLLabelElement).style.background = '#6eaaff';
                (e.currentTarget as HTMLLabelElement).style.boxShadow = '0 4px 16px 0 #4F8CFF33';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLLabelElement).style.background = COLORS.accent;
                (e.currentTarget as HTMLLabelElement).style.boxShadow = '0 2px 8px 0 #4F8CFF22';
              }}
            >
              Choose File
              <input
                id="mood-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                aria-label="Upload mood image"
                style={{ display: 'none' }}
                disabled={imageSectionDisabled || !modelsLoaded}
              />
            </label>
          )}
          {imagePreview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img
                src={imagePreview}
                alt="Mood preview"
                style={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: `2px solid ${COLORS.accent}`,
                  boxShadow: '0 2px 8px 0 #4F8CFF22',
                }}
              />
              <button
                type="button"
                aria-label="Remove image"
                style={{
                  background: COLORS.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px 0 #4F8CFF22',
                  marginLeft: 2,
                  transition: 'background 0.12s',
                }}
                onClick={handleEmojiButtonClick}
                onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.background = COLORS.accent)}
              >
                <FiX size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Error message */}
      {error && (
        <div style={{ marginTop: 8, color: '#d7263d', fontWeight: 500, fontSize: 15 }} role="alert">
          {error}
        </div>
      )}
      {/* Show mood and funny message if available */}
      {moodToShow && funnyMessage && (
        <div style={{
          margin: '18px 0 0 0',
          background: '#F7FAFC',
          borderRadius: 14,
          padding: '14px 18px',
          color: '#23272F',
          fontSize: 17,
          fontWeight: 500,
          boxShadow: '0 2px 8px 0 #4F8CFF11',
          textAlign: 'center',
        }}>
          {moodSource === 'emoji' && (
            <span>
              <span style={{ color: '#4F8CFF', fontWeight: 700 }}>{moodToShow}</span> mood selected. <br />
            </span>
          )}
          {moodSource === 'image' && (
            <span>
              Detected mood: <span style={{ color: '#4F8CFF', fontWeight: 700 }}>{detectedEmotion}</span> <br />
            </span>
          )}
          <span style={{ color: '#6B7280', fontWeight: 400 }}>{funnyMessage}</span>
        </div>
      )}
      {/* CTA Button */}
      <button
        type="button"
        className="modern-cta-btn"
        style={{
          width: '100%',
          marginTop: 24,
          background: selectedMood || imagePreview ? COLORS.accent : COLORS.disabled,
          color: selectedMood || imagePreview ? '#fff' : COLORS.textSecondary,
          border: 'none',
          borderRadius: 16,
          fontSize: 18,
          fontWeight: FONT.button,
          padding: '14px 0',
          boxShadow: selectedMood || imagePreview ? '0 2px 8px 0 #4F8CFF22' : 'none',
          cursor: selectedMood || imagePreview ? 'pointer' : 'not-allowed',
          opacity: selectedMood || imagePreview ? 1 : 0.7,
          transition: 'background 0.12s, box-shadow 0.12s',
        }}
        disabled={!(selectedMood || imagePreview)}
        onMouseEnter={e => {
          if (selectedMood || imagePreview) {
            (e.currentTarget as HTMLButtonElement).style.background = '#6eaaff';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px 0 #4F8CFF33';
          }
        }}
        onMouseLeave={e => {
          if (selectedMood || imagePreview) {
            (e.currentTarget as HTMLButtonElement).style.background = COLORS.accent;
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px 0 #4F8CFF22';
          }
        }}
      >
        Get Personalized Recommendations
      </button>
      {/* Skip for now */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.textSecondary,
            textDecoration: 'underline',
            fontSize: 15,
            cursor: 'pointer',
            opacity: 0.8,
            marginTop: 4,
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = COLORS.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = COLORS.textSecondary)}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default MoodPicker;
