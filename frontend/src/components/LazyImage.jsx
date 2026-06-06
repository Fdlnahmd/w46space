import { useState, useMemo } from 'react';

/**
 * LazyImage component
 * Shows a pulsing skeleton loader while the image is loading.
 * Automatically optimizes Unsplash URLs to use responsive sizes and appropriate compression.
 */
const LazyImageFrame = ({ optimizedSrc, alt, style, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(!optimizedSrc);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: 'var(--color-border, #e2e8f0)' }}>
      {/* Pulse Skeleton Loader */}
      {!loaded && !hasError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#e2e8f0',
          animation: 'lazy-image-pulse 1.5s infinite ease-in-out',
          zIndex: 1
        }}></div>
      )}

      {hasError ? (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, var(--color-primary-dark, #1e40af) 0%, var(--color-primary, #2563eb) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '1rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🏢</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>Wisma 46 Space</span>
        </div>
      ) : (
        optimizedSrc && (
          <img
            src={optimizedSrc}
            alt={alt}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setHasError(true);
              setLoaded(true);
            }}
            style={{
              ...style,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.4s ease-in-out',
            }}
            {...props}
          />
        )
      )}

      <style>{`
        @keyframes lazy-image-pulse {
          0% { opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

const LazyImage = ({ src, alt, style, width = 450, quality = 70, ...props }) => {
  const optimizedSrc = useMemo(() => {
    if (!src) return '';

    if (src.includes('images.unsplash.com')) {
      try {
        const urlObj = new URL(src);
        urlObj.searchParams.set('w', width.toString());
        urlObj.searchParams.set('q', quality.toString());
        urlObj.searchParams.set('auto', 'format');
        return urlObj.toString();
      } catch {
        return src;
      }
    }

    return src;
  }, [src, width, quality]);

  return (
    <LazyImageFrame
      key={optimizedSrc || 'empty-image'}
      optimizedSrc={optimizedSrc}
      alt={alt}
      style={style}
      {...props}
    />
  );
};

export default LazyImage;
