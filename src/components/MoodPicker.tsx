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
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [pendingPhotoMood, setPendingPhotoMood] = useState<string | null>(null); // for controlling product fetch
  const [usedFallback, setUsedFallback] = useState(false); // track if fallback is used
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [overlayPos, setOverlayPos] = useState({ x: 50, y: 50 }); // percent
  const [overlayScale, setOverlayScale] = useState(1);
  const overlayRef = useRef<HTMLImageElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  // Drag logic for overlay
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [overlayStart, setOverlayStart] = useState<{ x: number; y: number } | null>(null);

  function handleOverlayMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOverlayStart({ ...overlayPos });
  }
  function handleOverlayMouseMove(e: MouseEvent) {
    if (!dragging || !dragStart || !overlayStart || !roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;
    let newX = overlayStart.x + dx;
    let newY = overlayStart.y + dy;
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    setOverlayPos({ x: newX, y: newY });
  }
  function handleOverlayMouseUp() {
    setDragging(false);
    setDragStart(null);
    setOverlayStart(null);
  }
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleOverlayMouseMove);
      window.addEventListener('mouseup', handleOverlayMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleOverlayMouseMove);
        window.removeEventListener('mouseup', handleOverlayMouseUp);
      };
    }
  }, [dragging, dragStart, overlayStart]);

  // Reset overlay when new image or product selected
  useEffect(() => {
    setOverlayPos({ x: 50, y: 50 });
    setOverlayScale(1);
  }, [imagePreview, selectedProduct]);

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
    setPendingPhotoMood(null); // Clear pending photo mood
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
    setPendingPhotoMood(null); // clear pending mood
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
          setPendingPhotoMood(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setImagePreview(reader.result as string); // <-- Only set after detection
          // Find the dominant emotion
          const expressions = detection.expressions;
          const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
          const [dominant, prob] = sorted[0];
          const mood = capitalize(dominant);
          setDetectedEmotion(`${mood} (${(prob * 100).toFixed(0)}%)`);
          setPendingPhotoMood(mood); // only set if valid
          if (onMoodSelect) onMoodSelect(file);
        }
      } catch (err) {
        setError('Failed to process image for face detection.');
        setImagePreview(null);
        setFileName(null);
        setDetectedEmotion(null);
        setPendingPhotoMood(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setImagePreview(null);
      setDetectedEmotion(null);
      setPendingPhotoMood(null);
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
    setPendingPhotoMood(null);
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

  // Map moods to product search keywords
  const MOOD_TO_KEYWORD: Record<string, string> = {
    Happy: 'fun',
    Sad: 'comfort',
    Angry: 'stress',
    Loving: 'love',
    Surprised: 'surprise',
    Cool: 'cool',
    Thinking: 'book',
    Celebrating: 'party',
    Sleepy: 'sleep',
    Blessed: 'wellness',
    Determined: 'fitness',
    Awkward: 'gadget',
    Hungry: 'food',
    Neutral: 'basic',
    Playful: 'toy',
    Affectionate: 'gift',
    Disappointed: 'improve',
    Excited: 'new',
  };

  // Fetch products when mood changes (emoji or valid photo mood)
  useEffect(() => {
    let active = true;
    async function fetchProductsForMood(mood: string | null) {
      setProducts([]);
      setProductError(null);
      setUsedFallback(false);
      if (!mood) return;
      setLoadingProducts(true);
      try {
        const keyword = MOOD_TO_KEYWORD[mood] || mood;
        // Primary: DummyJSON
        const res = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(keyword)}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        let prods = data.products || [];
        // Sort: recommended (by rating, then price ascending)
        prods = prods.sort((a: any, b: any) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return a.price - b.price;
        });
        // If DummyJSON returns no products, try FakestoreAPI
        if (prods.length === 0) {
          const fallbackRes = await fetch('https://fakestoreapi.com/products');
          if (!fallbackRes.ok) throw new Error('Fallback API failed');
          let fallbackProds = await fallbackRes.json();
          // Filter by keyword in title or description (case-insensitive)
          fallbackProds = fallbackProds.filter((p: any) =>
            p.title.toLowerCase().includes(keyword.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(keyword.toLowerCase()))
          );
          // If still empty, just show all fallback products
          if (fallbackProds.length === 0) fallbackProds = await fallbackRes.json();
          // Sort by price ascending
          fallbackProds = fallbackProds.sort((a: any, b: any) => a.price - b.price);
          if (active) {
            if (fallbackProds.length === 0) {
              setProducts([]);
              setUsedFallback(false);
              setProductError('No products found for this mood.');
            } else {
              setProducts(fallbackProds);
              setUsedFallback(true);
              setProductError(null);
            }
          }
        } else {
          if (active) {
            setProducts(prods);
            setUsedFallback(false);
            setProductError(null);
          }
        }
      } catch (err: any) {
        // Do not show a generic error, just fail silently
        // if (active) setProductError('Could not load products.');
      } finally {
        if (active) setLoadingProducts(false);
      }
    }
    // Only fetch if mood is from emoji or detected from valid photo
    if (moodSource === 'emoji' && moodToShow) fetchProductsForMood(moodToShow);
    if (moodSource === 'image' && pendingPhotoMood) fetchProductsForMood(pendingPhotoMood);
    return () => { active = false; };
  }, [moodToShow, moodSource, pendingPhotoMood]);

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
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
      {/* Virtual Room Experience */}
      {imagePreview && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' }}>
            Virtual Room Preview
          </h3>
          <div
            ref={roomRef}
            style={{
              width: '100%',
              height: 220,
              background: '#f3f7fa',
              borderRadius: 14,
              boxShadow: '0 1px 6px #4F8CFF11',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={imagePreview}
              alt="User"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 14,
                filter: selectedProduct ? 'brightness(0.98)' : 'none',
                transition: 'filter 0.2s',
              }}
            />
            {selectedProduct && (
              <img
                ref={overlayRef}
                src={selectedProduct.thumbnail || selectedProduct.image}
                alt={selectedProduct.title}
                style={{
                  position: 'absolute',
                  left: `${overlayPos.x}%`,
                  top: `${overlayPos.y}%`,
                  transform: `translate(-50%, -50%) scale(${overlayScale})`,
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                  cursor: 'grab',
                  zIndex: 2,
                  boxShadow: '0 2px 8px #4F8CFF22',
                  borderRadius: 10,
                  border: '2px solid #4F8CFF',
                  background: '#fff',
                  transition: dragging ? 'none' : 'box-shadow 0.15s',
                }}
                onMouseDown={handleOverlayMouseDown}
                draggable={false}
              />
            )}
            {!selectedProduct && (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: COLORS.textSecondary,
                fontWeight: 500,
                fontSize: 15,
                background: 'rgba(255,255,255,0.85)',
                padding: '8px 18px',
                borderRadius: 10,
                boxShadow: '0 1px 4px #4F8CFF11',
              }}>
                Select a product to try it in your virtual room!
              </div>
            )}
            {/* Zoom controls */}
            {selectedProduct && (
              <div style={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                <button
                  style={{
                    background: COLORS.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    fontSize: 20,
                    cursor: 'pointer',
                    marginBottom: 2,
                  }}
                  onClick={() => setOverlayScale(s => Math.min(2, s + 0.1))}
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  style={{
                    background: COLORS.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    fontSize: 20,
                    cursor: 'pointer',
                  }}
                  onClick={() => setOverlayScale(s => Math.max(0.3, s - 0.1))}
                  aria-label="Zoom out"
                >
                  -
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Product Recommendations */}
      <div style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' }}>
          {moodToShow ? `Recommended for your mood: ${moodToShow}` : 'Personalized Recommendations'}
        </h3>
        {usedFallback && (
          <div style={{ textAlign: 'center', color: COLORS.textSecondary, fontWeight: 500, marginBottom: 8 }}>
            Fallback Recommendations (from FakestoreAPI)
          </div>
        )}
        {loadingProducts && (
          <div style={{ textAlign: 'center', color: COLORS.accent, fontWeight: 500, margin: '16px 0' }}>Loading products...</div>
        )}
        {productError && (
          <div style={{ textAlign: 'center', color: COLORS.textSecondary, fontWeight: 500, margin: '16px 0', fontSize: 15 }}>
            {productError}
          </div>
        )}
        {!loadingProducts && !productError && products.length === 0 && moodToShow && (
          <div style={{ textAlign: 'center', color: COLORS.textSecondary, fontWeight: 500, margin: '16px 0' }}>No products found for this mood.</div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginTop: 8,
        }}>
          {products.map(product => (
            <div
              key={product.id}
              style={{
                background: selectedProduct && selectedProduct.id === product.id ? '#e6f0ff' : '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 8px 0 #4F8CFF11',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 180,
                position: 'relative',
                border: selectedProduct && selectedProduct.id === product.id ? '2px solid #4F8CFF' : '1px solid #e0e7ef',
                transition: 'box-shadow 0.15s, border 0.15s, background 0.15s',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedProduct(product)}
            >
              <img src={product.thumbnail || product.image} alt={product.title} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, marginBottom: 8, boxShadow: '0 1px 4px #4F8CFF22' }} />
              <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4, minHeight: 36 }}>{product.title}</div>
              <div style={{ fontWeight: 500, fontSize: 15, color: COLORS.accent, marginBottom: 2 }}>${product.price}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' }}>{product.brand}</div>
            </div>
          ))}
        </div>
      </div>
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
