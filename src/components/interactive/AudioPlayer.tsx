import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerProps {
  src?: string;
  title: string;
  duration?: string;
  lang?: string;
}

const audioI18n: Record<string, Record<string, string>> = {
  es: { coming: 'AUDIO PRÓXIMAMENTE', voice: 'Voz de la artista sobre esta obra', pause: 'Pausar', play: 'Reproducir', progress: 'Progreso del audio', player: 'Reproductor de audio' },
  en: { coming: 'AUDIO COMING SOON', voice: 'The artist\'s voice on this work', pause: 'Pause', play: 'Play', progress: 'Audio progress', player: 'Audio player' },
  fr: { coming: 'AUDIO À VENIR', voice: 'La voix de l\'artiste sur cette œuvre', pause: 'Pause', play: 'Lecture', progress: 'Progression audio', player: 'Lecteur audio' },
  zh: { coming: '音频即将上线', voice: '艺术家谈这件作品', pause: '暂停', play: '播放', progress: '音频进度', player: '音频播放器' },
};

export default function AudioPlayer({ src, title, duration: durationHint, lang = 'es' }: AudioPlayerProps) {
  const labels = audioI18n[lang] || audioI18n.es;
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const showPlaceholder = !src || hasError;

  // Format seconds to m:ss
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || showPlaceholder) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setHasError(true);
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, showPlaceholder]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || showPlaceholder) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration, showPlaceholder]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      togglePlay();
    }
  }, [togglePlay]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Placeholder state
  if (showPlaceholder) {
    return (
      <div style={styles.placeholder} role="region" aria-label={title}>
        <span style={styles.placeholderBracket}>[ &mdash; ]</span>
        <span style={styles.placeholderText}>{labels.coming}</span>
        <span style={styles.placeholderDot}>&middot;</span>
        <span style={styles.placeholderCaption}>{labels.voice}</span>
      </div>
    );
  }

  // Active player
  return (
    <div
      style={styles.container}
      role="region"
      aria-label={`${labels.player}: ${title}`}
    >
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleError}
        />
      )}

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        onKeyDown={handleKeyDown}
        style={styles.button}
        aria-label={isPlaying ? labels.pause : labels.play}
        type="button"
      >
        {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
      </button>

      {/* Title */}
      <span style={styles.title}>{title}</span>

      {/* Progress bar */}
      <div
        ref={progressRef}
        onClick={handleSeek}
        style={styles.progressContainer}
        role="slider"
        aria-label={labels.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
        tabIndex={0}
      >
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>

      {/* Time display */}
      <span style={styles.time}>
        {formatTime(currentTime)} / {isLoaded ? formatTime(duration) : (durationHint || '0:00')}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: '1px solid #E8E2DA',
    backgroundColor: 'transparent',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.7rem',
    letterSpacing: '0.05em',
    color: '#111',
    lineHeight: 1,
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: '1px dashed #9A948E',
    backgroundColor: 'transparent',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.06em',
    color: '#9A948E',
    lineHeight: 1,
    flexWrap: 'wrap' as const,
  },
  placeholderBracket: {
    color: '#9A948E',
    flexShrink: 0,
  },
  placeholderText: {
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    color: '#9A948E',
    flexShrink: 0,
  },
  placeholderDot: {
    color: '#9A948E',
    flexShrink: 0,
  },
  placeholderCaption: {
    color: '#9A948E',
    fontWeight: 400,
    fontStyle: 'italic',
    flexShrink: 0,
  },
  button: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    color: '#111',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    fontWeight: 700,
    lineHeight: 1,
  },
  title: {
    fontSize: '0.65rem',
    color: '#6B6560',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 1,
    minWidth: 0,
  },
  progressContainer: {
    flex: 1,
    minWidth: '60px',
    cursor: 'pointer',
    padding: '8px 0',
  },
  progressTrack: {
    width: '100%',
    height: '1px',
    backgroundColor: '#E8E2DA',
    position: 'relative' as const,
  },
  progressFill: {
    height: '1px',
    backgroundColor: '#111',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    transition: 'width 0.1s linear',
  },
  time: {
    fontSize: '0.6rem',
    color: '#6B6560',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
};
