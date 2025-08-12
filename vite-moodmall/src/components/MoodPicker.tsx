import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as faceapi from 'face-api.js';
import { FiChevronDown, FiChevronUp, FiX, FiMessageSquare } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

// Emoji options and their corresponding moods
//const EMOJIS = [
  //{ emoji: '😀', mood: 'Happy' },
  //{ emoji: '😢', mood: 'Sad' },
  //{ emoji: '😡', mood: 'Angry' },
  //{ emoji: '😍', mood: 'Loving' },
  //{ emoji: '😱', mood: 'Surprised' },
  //{ emoji: '😎', mood: 'Cool' },
  //{ emoji: '🤔', mood: 'Thinking' },
  //{ emoji: '🥳', mood: 'Celebrating' },
//];

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
//const FUNNY_MESSAGES: Record<string, string[]> = {
  //Happy: ["You're beaming! Time for some retail therapy!", "Happiness detected. Let's shop like it's your birthday!", "Smiles are contagious—so are great deals!"],
  //Sad: ["A little shopping might cheer you up!", "Sad? Let's find something to turn that frown upside down!", "Blue mood? Blue jeans?"],
  //Angry: ["Angry? Smash that 'Add to Cart' button!", "Let's channel that rage into some shopping!", "Anger detected. How about a stress ball?"],
  //Loving: ["Love is in the air—and so are discounts!", "Feeling the love? Find the perfect gift!", "Hearts and carts!"],
  //Surprised: ["Surprise! You get recommendations!", "Didn't see these deals coming, did you?", "Surprised? Wait till you see these products!"],
  //Cool: ["Too cool for school—never too cool for shopping!", "Cool mood, cooler deals!", "Stay frosty, shop savvy!"],
  //Thinking: ["Thinking hard? Let us recommend something easy!", "Pondering purchases? We've got ideas!", "Deep thoughts, deeper discounts!"],
  //Celebrating: ["Party time! Let's shop for the occasion!", "Celebrate with a shopping spree!", "Confetti and carts!"],
  //Sleepy: ["Sleepy? Maybe a new pillow!", "Yawn... time for cozy shopping!", "Shop in your dreams!"],
  //Blessed: ["Feeling blessed? Treat yourself!", "Count your blessings—and your savings!", "Blessed and best-dressed!"],
  //Determined: ["Determined to find a deal? You're in the right place!", "Let's conquer that wishlist!", "Determined mood, determined discounts!"],
  //Awkward: ["Awkward? Not with these deals!", "Shop away the awkwardness!", "Let's make it less awkward with a great find!"],
  //Hungry: ["Hungry for deals? Dig in!", "Snack and shop!", "Feed your cart!"],
  //Neutral: ["Feeling neutral? Our deals aren't!", "Meh mood, wow products!", "Let's spice up your day!"],
  //Playful: ["Playful mood, playful picks!", "Let's have some fun shopping!", "Game on for great deals!"],
  //Affectionate: ["Spread the love with a gift!", "Affection detected—let's find something sweet!", "Hugs, kisses, and shopping wishes!"],
  //Disappointed: ["Disappointed? Not for long!", "Let us turn that disappointment into delight!", "Shop away the blues!"],
  //Excited: ["Excited? So are we! Check these out!", "Excitement level: shopping spree!", "Let's ride that excitement to the checkout!"],
//};

//function getFunnyMessage(mood: string) {
  //const arr = FUNNY_MESSAGES[mood] || ["Let's find something for your vibe!"];
  //return arr[Math.floor(Math.random() * arr.length)];
//}

//const GLASS_KEYWORDS = ['glass', 'sunglass', 'eyewear', 'spectacle'];

// Add a normalization function:
function normalizeMoodKey(mood: string | null): string | null {
  if (!mood) return null;
  const trimmed = mood.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// Add a mapping from face-api.js mood output to translation keys
const FACEAPI_MOOD_MAP: Record<string, string> = {
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  surprised: 'Surprised',
  neutral: 'Neutral',
  disgusted: 'Disappointed',
  fearful: 'Awkward',
  // Add more mappings as needed
};

function getTranslationMoodKey(mood: string | null): string | null {
  if (!mood) return null;
  const key = mood.trim().toLowerCase();
  return FACEAPI_MOOD_MAP[key] || (key.charAt(0).toUpperCase() + key.slice(1));
}

const MoodPicker: React.FC<MoodPickerProps> = ({ onMoodSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [showMoreMoods, setShowMoreMoods] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [pendingPhotoMood, setPendingPhotoMood] = useState<string | null>(null); // for controlling product fetch
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [virtualRoomImageUrl, setVirtualRoomImageUrl] = useState<string | null>(null);
  const [virtualRoomPrompt, setVirtualRoomPrompt] = useState<string | null>(null);
  const [loadingVirtualRoom, setLoadingVirtualRoom] = useState(false);
  const [virtualRoomError, setVirtualRoomError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const { t, i18n } = useTranslation();

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
    setError(null);
    setDetectedEmotion(null);
    setImagePreview(null); // <-- Clear preview before processing
    setPendingPhotoMood(null); // clear pending mood
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('invalidFileType');
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('imageTooLarge');
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size === 0) {
      setError('imageReadFailed');
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      setError(null);
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
          setError('noFaceDetected');
          setImagePreview(null);
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
        setError('faceDetectionFailed');
        setImagePreview(null);
        setDetectedEmotion(null);
        setPendingPhotoMood(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('imageReadFailed');
      setImagePreview(null);
      setDetectedEmotion(null);
      setPendingPhotoMood(null);
      setProcessing(false);
    };
    reader.readAsDataURL(file);
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
  // Use normalizedMoodKey for translation lookups:
  const normalizedMoodKey = normalizeMoodKey(moodToShow);
  const translationMoodKey = getTranslationMoodKey(moodToShow);
  let moodLabel = translationMoodKey ? t(`moods.${translationMoodKey}`) : '';
  if (!moodLabel || moodLabel === translationMoodKey) {
    // Fallback: Capitalize the detected mood in the current language
    moodLabel = translationMoodKey ? translationMoodKey.charAt(0).toUpperCase() + translationMoodKey.slice(1).toLowerCase() : '';
  }
  console.log('Mood translation key:', translationMoodKey, 'Translated label:', moodLabel, 'Lang:', i18n.language);
  const funnyMessagesArrRaw = useMemo(() => (normalizedMoodKey ? t(`FunnyMessages.${normalizedMoodKey}`, { returnObjects: true }) : []), [normalizedMoodKey, i18n.language]);
  const funnyMessagesArr: string[] = Array.isArray(funnyMessagesArrRaw) ? funnyMessagesArrRaw : [];
  const funnyMessage = useMemo(() => {
    if (!funnyMessagesArr || funnyMessagesArr.length === 0) return null;
    return funnyMessagesArr[Math.floor(Math.random() * funnyMessagesArr.length)];
  }, [funnyMessagesArr]);

  // Determine if emoji or image is active
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
      // setProductError(null); // Commented out
      // setUsedFallback(false); // Commented out
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
              // setUsedFallback(false); // Commented out
              // setProductError('noProductsFound'); // Commented out
            } else {
              setProducts(fallbackProds);
              // setUsedFallback(true); // Commented out
              // setProductError(null); // Commented out
            }
          }
        } else {
          if (active) {
            setProducts(prods);
            // setUsedFallback(false); // Commented out
            // setProductError(null); // Commented out
          }
        }
      } catch (err: any) {
        // Do not show a generic error, just fail silently
        // if (active) setProductError('Could not load products.'); // Commented out
      } finally {
        if (active) setLoadingProducts(false);
      }
    }
    // Only fetch if mood is from emoji or detected from valid photo
    if (moodSource === 'emoji' && moodToShow) fetchProductsForMood(moodToShow);
    if (moodSource === 'image' && pendingPhotoMood) fetchProductsForMood(pendingPhotoMood);
    return () => { active = false; };
  }, [moodToShow, moodSource, pendingPhotoMood]);

  // Detect eyes and set overlay for glasses
  useEffect(() => {
    async function detectEyesAndSetOverlay() {
      // setEyeOverlay(null); // Removed
      // setGlassWarning(null); // Removed
      if (!imagePreview) return;
      // const isGlass = GLASS_KEYWORDS.some(k => // Commented out
      //   (selectedProduct.title || '').toLowerCase().includes(k) || // Commented out
      //   (selectedProduct.category || '').toLowerCase().includes(k) // Commented out
      // ); // Commented out
      // if (!isGlass) return; // Commented out
      // Load image
      const img = new window.Image();
      img.src = imagePreview;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      // Detect face landmarks
      try {
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        if (!detection || !detection.landmarks) {
          // setGlassWarning('Face or eyes not detected. Glasses overlay centered.'); // Removed
          return;
        }
        const leftEye = detection.landmarks.getLeftEye();
        const rightEye = detection.landmarks.getRightEye();
        if (!leftEye || !rightEye) {
          // setGlassWarning('Eyes not detected. Glasses overlay centered.'); // Removed
          return;
        }
        // Calculate bounding box for eyes
        // const allEyePoints = [...leftEye, ...rightEye];
        // const minX = Math.min(...allEyePoints.map(pt => pt.x));
        // const maxX = Math.max(...allEyePoints.map(pt => pt.x));
        // const minY = Math.min(...allEyePoints.map(pt => pt.y));
        // const maxY = Math.max(...allEyePoints.map(pt => pt.y));
        // Convert to percent relative to image size
        // const w = img.width;
        // const h = img.height;
        // setEyeOverlay({ // Removed
        //   x: ((minX + maxX) / 2 / w) * 100,
        //   y: ((minY + maxY) / 2 / h) * 100,
        //   w: ((maxX - minX) / w) * 100 * 1.4, // 1.4x for frame width
        //   h: ((maxY - minY) / h) * 100 * 2.2, // 2.2x for frame height
        // });
      } catch {
        // setGlassWarning('Face or eyes not detected. Glasses overlay centered.'); // Removed
        return;
      }
    }
    detectEyesAndSetOverlay();
    // eslint-disable-next-line
  }, [imagePreview]);

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // When a product is clicked, toggle its selection
  const handleProductClick = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Map products to Product3D type for VirtualRoom
  //const products3D: any[] = (selectedMood || imagePreview)
    //? products.map((p: any) => ({
      //  id: p.id?.toString() || '',
        //name: p.title || p.name || '',
        //imageUrl: p.thumbnail || p.image || '',
        //type: p.category && (p.category.toLowerCase().includes('glass') || p.category.toLowerCase().includes('wear') || p.category.toLowerCase().includes('cosmetic'))
          //? (p.category.toLowerCase().includes('glass') ? 'wearable' : p.category.toLowerCase().includes('cosmetic') ? 'cosmetic' : 'wearable')
          //: (p.category && (p.category.toLowerCase().includes('kitchen') ? 'kitchen' : p.category.toLowerCase().includes('home') ? 'home' : 'other')),
        //modelUrl: undefined // Placeholder, can be set if available
      //}))
    //: [];

  // 3. In the image remove handler (wherever setImagePreview(null) is called), call resetAll after clearing imagePreview
  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  // When mood/image is cleared, reset selectedProductIds:
  useEffect(() => {
    if (!selectedMood && !imagePreview) {
      setProducts([]);
      // setProductError(null); // Commented out
      setLoadingProducts(false);
      setSelectedProductIds([]);
    }
  }, [selectedMood, imagePreview]);

  // Handler for Try Virtual Room
  async function handleTryVirtualRoom() {
    setLoadingVirtualRoom(true);
    setVirtualRoomImageUrl(null);
    setVirtualRoomPrompt(null);
    setVirtualRoomError(null);
    try {
      // Get selected product titles
      const selectedTitles = products
        .filter((p: any) => selectedProductIds.includes(p.id))
        .map((p: any) => p.title || p.name || '');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/generate-virtual-room-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: selectedTitles }),
      });
      if (!res.ok) throw new Error('Failed to generate image');
      const data = await res.json();
      setVirtualRoomImageUrl(data.image_url);
      setVirtualRoomPrompt(data.prompt);
    } catch (e: any) {
      setVirtualRoomError('virtualRoomImageError');
    } finally {
      setLoadingVirtualRoom(false);
    }
  }

  return (
    <>
      <a href="#main-content" className="skip-link" style={{position: 'absolute', left: 0, top: 0, background: '#fff', color: '#2563eb', padding: '8px 16px', zIndex: 1000, transform: 'translateY(-120%)', transition: 'transform 0.2s', textDecoration: 'underline'}} onFocus={e => (e.currentTarget.style.transform = 'translateY(0)')} onBlur={e => (e.currentTarget.style.transform = 'translateY(-120%)')}>Skip to main content</a>
      <main id="main-content" tabIndex={-1} aria-label="Main content">
        <div
          className="modern-mood-card"
          style={{
            background: COLORS.secondaryBg,
            borderRadius: 20,
            boxShadow: COLORS.shadow,
            padding: collapsed ? 12 : 32,
            maxWidth: 420,
            margin: '40px auto',
            fontFamily: FONT.family,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            minHeight: collapsed ? 0 : undefined,
            minWidth: collapsed ? 0 : undefined,
            height: collapsed ? 60 : undefined,
            justifyContent: collapsed ? 'center' : undefined,
          }}
        >
          {/* Expand/Collapse Button */}
          <button
            type="button"
            aria-label={collapsed ? t('Expand') : t('Collapse to hide the card')}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: COLORS.accent,
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px 0 #4F8CFF22',
              cursor: 'pointer',
              transition: 'background 0.12s, box-shadow 0.12s',
              zIndex: 20,
            }}
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? t('Expand') : t('Collapse to hide the card')}
          >
            {collapsed ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
          </button>
          {/* Only render content if not collapsed */}
          {!collapsed ? (
            <>
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
                  <div style={{ color: COLORS.accent, fontWeight: 600, fontSize: 16 }}>{t('Detecting face and mood...')}</div>
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
                {t('How are you feeling today?')}
              </h2>
              <div style={{
                fontSize: 18,
                fontWeight: FONT.subheading,
                color: COLORS.textSecondary,
                marginBottom: 28,
              }}>
                {t('Pick an emoji or upload an image to find products that match your vibe.')}
              </div>
              {/* Add this near the top of the render, inside the card but above the main content: */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <label htmlFor="lang-select" style={{ fontSize: 13, color: COLORS.textSecondary, marginRight: 6 }}>🌐</label>
                <select
                  id="lang-select"
                  value={i18n.language}
                  onChange={e => i18n.changeLanguage(e.target.value)}
                  style={{ fontSize: 13, padding: '2px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.textPrimary }}
                  aria-label="Select language"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                </select>
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
                      aria-pressed={selectedMood === emoji}
                      aria-selected={selectedMood === emoji}
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
                  {showMoreMoods ? t('Less Moods') : t('More Moods')}
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
                <span style={{ margin: '0 16px', color: COLORS.textSecondary, fontSize: 15, fontWeight: 500 }}>{t('or')}</span>
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
                  {t('Upload an image for style inspiration:')}
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
                      {t('Choose File')}
                      <input
                        id="mood-file-input"
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleFileChange}
                        aria-label={t('Upload mood image')}
                        aria-describedby="file-upload-desc"
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
                        aria-label={t('Remove image')}
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
                        onClick={handleRemoveImage}
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
                  {t(error)}
                </div>
              )}
              {/* Show mood and funny message if available */}
              {/* ---
              The mood message below is intentionally rendered only based on mood/image state.
              It does NOT depend on product selection (selectedProductIds) to ensure it never changes
              when products are selected or deselected.
              --- */}
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
                      <span style={{ color: '#4F8CFF', fontWeight: 700 }}>{moodLabel}</span> {t('mood selected.')} <br />
                    </span>
                  )}
                  {moodSource === 'image' && (
                    <span>
                      {t('Detected mood:')} <span style={{ color: '#4F8CFF', fontWeight: 700 }}>{moodLabel}</span> <br />
                    </span>
                  )}
                  <span style={{ color: '#6B7280', fontWeight: 400 }}>{funnyMessage}</span>
                </div>
              )}
              {/* Recommendations and virtual room block, CTA, and skip button */}
              {(selectedMood || imagePreview) && products.length > 0 && (
                <div>
                  {/* Recommendations and virtual room block */}
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, textAlign: 'center', margin: '32px 0 18px 0', letterSpacing: -1 }}>
                    {t('Personalized Recommendations')}
                  </h2>
                  {/* Product grid: only render if mood or image is selected and products exist */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
                    {products.map((product: any) => (
                      <div
                        key={product.id}
                        style={{
                          background: selectedProductIds.includes(product.id) ? '#e6f0fa' : '#fff',
                          borderRadius: 12,
                          boxShadow: '0 2px 8px 0 #4F8CFF11',
                          padding: 18,
                          minHeight: 180,
                          position: 'relative',
                          border: selectedProductIds.includes(product.id) ? '2.5px solid #4F8CFF' : '1px solid #e0e7ef',
                          transition: 'box-shadow 0.15s, border 0.15s, background 0.15s',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleProductClick(product.id)}
                      >
                        <img src={product.thumbnail || product.image} alt={product.title} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, marginBottom: 8, boxShadow: '0 1px 4px #4F8CFF22' }} />
                        <div style={{ fontWeight: 600, fontSize: 17, color: COLORS.textPrimary, marginBottom: 4 }}>{product.title}</div>
                        <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{product.price && `$${product.price}`}</div>
                        <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>{product.brand}</div>
                      </div>
                    ))}
                  </div>
                  {/* Try in Virtual Room Button */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      aria-label={t('Try Now in Virtual Room')}
                      style={{
                        width: '100%',
                        background: COLORS.accent,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 16,
                        fontSize: 18,
                        fontWeight: FONT.button,
                        padding: '14px 0',
                        boxShadow: '0 2px 8px 0 #4F8CFF22',
                        cursor: loadingVirtualRoom || selectedProductIds.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: loadingVirtualRoom || selectedProductIds.length === 0 ? 0.6 : 1,
                        transition: 'background 0.12s, box-shadow 0.12s',
                      }}
                      onClick={handleTryVirtualRoom}
                      disabled={loadingVirtualRoom || selectedProductIds.length === 0}
                    >
                      {loadingVirtualRoom ? t('Loading...') : t('Try Now in Virtual Room')}
                    </button>
                  </div>
                  {/* Virtual Room Modal */}
                  {virtualRoomImageUrl && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                      }}
                      onClick={() => setVirtualRoomImageUrl(null)}
                    >
                      <div
                        style={{
                          background: '#fff',
                          borderRadius: 16,
                          padding: 24,
                          boxShadow: '0 4px 32px #0002',
                          maxWidth: 540,
                          width: '90vw',
                          textAlign: 'center',
                          position: 'relative',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          aria-label={t('Close')}
                          onClick={() => setVirtualRoomImageUrl(null)}
                          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: COLORS.textSecondary }}
                        >
                          <FiX />
                        </button>
                        <img
                          src={virtualRoomImageUrl}
                          alt={t('Virtual Room')}
                          style={{ maxWidth: 480, maxHeight: 480, borderRadius: 12, marginBottom: 12 }}
                        />
                        {virtualRoomPrompt && (
                          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>
                            <b>{t('Prompt')}:</b> {virtualRoomPrompt}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Error message: only show if error exists AND at least one product is selected */}
                  {virtualRoomError && selectedProductIds.length > 0 && (
                    <div style={{ color: '#d7263d', marginTop: 8 }}>{t(virtualRoomError)}</div>
                  )}
                  {/* Chat and Skip Buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    {/* Skip for now button removed as per request */}
                  </div>
                </div>
              )}
              {/* No products message - always outside the recommendations block */}
              {(selectedMood || imagePreview) && products.length === 0 && !loadingProducts && (
                <div style={{
                  margin: '32px 0',
                  padding: '28px 18px',
                  background: COLORS.secondaryBg,
                  borderRadius: 16,
                  boxShadow: COLORS.shadow,
                  textAlign: 'center',
                  color: COLORS.textSecondary,
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: 0.2,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10 }}>
                    {t('No products to display for this mood or photo.')}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    {t('But don\'t worry! You can still explore our full catalog for more amazing finds.')}
                  </div>
                  <a
                    href="/catalog"
                    style={{
                      display: 'inline-block',
                      background: COLORS.accent,
                      color: '#fff',
                      borderRadius: 12,
                      padding: '12px 28px',
                      fontWeight: FONT.button,
                      fontSize: 17,
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px 0 #4F8CFF22',
                      transition: 'background 0.12s, box-shadow 0.12s',
                      marginTop: 8,
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('Explore Catalog')}
                  </a>
                </div>
              )}
              {/* Chat Icon always visible in expanded form, with tooltip */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button
                  type="button"
                  aria-label={t('Chat for personalized experience')}
                  title={t('Chat for personalized experience')}
                  style={{
                    background: COLORS.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px 0 #4F8CFF22',
                    cursor: 'pointer',
                    transition: 'background 0.12s, box-shadow 0.12s',
                  }}
                  onClick={() => alert(t('Chat feature coming soon!'))}
                >
                  <FiMessageSquare size={22} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ width: '100%', textAlign: 'center', padding: '18px 48px 18px 0', fontWeight: 600, fontSize: 18, color: COLORS.textPrimary }}>
              {t('Enter Emotional Commerce')}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default MoodPicker;
