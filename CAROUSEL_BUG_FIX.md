# Fix: Carousel Images Not Reloading Bug

## Issue Description
When navigating away from the homepage and returning to it (e.g., from `/logements` back to `/`), the hero carousel images would fail to load. The carousel component would render but without any images, just the fallback gradient.

## Root Causes
1. **Stale Component State**: The `HeroCarousel` component wasn't resetting its state when returning to the homepage
2. **Empty useEffect Dependencies**: The original carousel interval had an empty dependency array `[]`, causing the effect to run only once at mount
3. **Missing Route Detection**: The component had no way to know when it returned to the homepage
4. **Browser Cache Issues**: Images were being cached aggressively, preventing reload on subsequent navigation
5. **Page Visibility**: When returning to the page, browser visibility states weren't being handled

## Solution Implemented

### 1. State Reset on Mount
```javascript
useEffect(() => {
  // Reset to first slide when component mounts
  setCurrentSlide(0);
  setImageErrors({});
  setImageTimestamp(Date.now());  // Cache-busting timestamp
  
  // ... rest of effect
}, []);
```

### 2. Image Cache Busting
```javascript
// Add timestamp to prevent image caching issues
const getImageUrl = (image) => {
  return `${image}?t=${imageTimestamp}`;
};

// Usage: url(/images/hero-1.jpg?t=1705085234567)
```

### 3. Page Visibility Handling
```javascript
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    setIsVisible(true);
    // Force image reload when tab becomes visible
    setImageTimestamp(Date.now());
  } else {
    setIsVisible(false);
  }
};

document.addEventListener('visibilitychange', handleVisibilityChange);
```

### 4. Carousel Key-Based Remounting
In the `Home` component:
```javascript
const pathname = usePathname();
const carouselKeyRef = useRef(0);

// Force carousel remount when returning to homepage
useEffect(() => {
  if (pathname === '/') {
    carouselKeyRef.current += 1;
  }
}, [pathname]);

// In JSX:
<HeroCarousel key={carouselKeyRef.current} />
```

When the key changes, React unmounts and remounts the entire component, forcing fresh initialization.

### 5. Proper useEffect Dependencies
```javascript
// Auto-advance carousel
useEffect(() => {
  if (!isVisible) return;  // Pause when not visible

  const interval = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  }, 6000);

  return () => clearInterval(interval);
}, [images.length, isVisible]);  // Proper dependencies
```

## Testing Checklist

✅ **First Visit**
- Homepage loads
- Carousel displays all 3 images
- Auto-advance works every 6 seconds
- Indicators are clickable

✅ **Navigate Away**
- Click "Voir les logements" or any navigation link
- Page changes to different route

✅ **Return to Homepage**
- Click logo or browser back button
- Images load immediately
- Carousel starts from first slide
- Auto-advance resumes

✅ **Tab Visibility**
- Switch to another browser tab
- Images won't reload until you're back
- Auto-advance pauses when tab is hidden
- Resume playing when tab becomes active

✅ **Build & Production**
- `npm run build` succeeds with no errors
- Images work in static export
- Images work in Vercel deployment
- No console errors

## Files Modified
- [app/page.js](app/page.js) - HeroCarousel and Home component

## Key Improvements
1. ✅ Carousel remounts when returning to `/`
2. ✅ Images forced to reload via timestamp parameter
3. ✅ Page visibility detection prevents unnecessary work
4. ✅ Auto-advance respects visibility state
5. ✅ Fallback gradient still works if images fail
6. ✅ No page reload hacks - pure React lifecycle
7. ✅ Animations and transitions preserved
8. ✅ Client-side navigation fully working

## Performance Impact
- Minimal: Only adds small timestamp parameters to image URLs
- No additional libraries or dependencies
- Browser still caches the actual image file (CDN/storage level)
- Timestamp prevents stale browser cache lookups

## Compatibility
- Works with Next.js 14 App Router
- Compatible with Vercel deployment
- Works in all modern browsers
- Fallback gradient for broken images

## Related Issues Fixed
- Image reloading on client-side navigation
- Carousel state management
- Browser tab visibility handling
- Memory leak prevention (proper cleanup)

