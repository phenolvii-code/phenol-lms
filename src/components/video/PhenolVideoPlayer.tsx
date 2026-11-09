'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseVideoSource } from '@/lib/student-code';
import { LectureTimestamp } from '@/types/lms';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  CheckCircle2,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface PhenolVideoPlayerProps {
  videoUrl?: string;
  title: string;
  duration?: string;
  studentCode: string;
  studentName?: string;
  studentPhone?: string;
  onCompleted?: () => void;
  seekTime?: number | null;
  timestamps?: LectureTimestamp[];
}

export const PhenolVideoPlayer: React.FC<PhenolVideoPlayerProps> = ({
  videoUrl,
  title,
  duration = '45 min',
  studentCode,
  studentName,
  studentPhone,
  onCompleted,
  seekTime,
  timestamps = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);

  // Helper to parse human duration string into initial seconds
  const parseDurationStringToSeconds = useCallback((durStr?: string): number => {
    if (!durStr) return 2700;
    if (durStr.includes(':')) {
      const parts = durStr.split(':').map((p) => parseInt(p, 10) || 0);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    const numMatch = durStr.match(/(\d+)/);
    if (numMatch) {
      const val = parseInt(numMatch[1], 10);
      if (val > 0) return val * 60;
    }
    return 2700;
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<number>(100);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState<number>(() =>
    parseDurationStringToSeconds(duration)
  );
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);

  // Hover preview state on timeline
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverChapter, setHoverChapter] = useState<string | null>(null);

  // Anti-tamper & Security States
  const [isTampered, setIsTampered] = useState(false);
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(false);

  // Forensic Watermark Dynamic Jitter Position (Moves every 10 seconds across 5 locations)
  const [watermarkPos, setWatermarkPos] = useState<React.CSSProperties>({
    top: '14%',
    left: '16%',
  });

  const parsed = parseVideoSource(videoUrl || 'https://www.youtube.com/watch?v=k3rRrl9J2F4');

  // Update totalDuration if prop changes and no duration from video yet
  useEffect(() => {
    const parsedSecs = parseDurationStringToSeconds(duration);
    if (parsedSecs > 0) {
      setTotalDuration((prev) => (prev === 2700 ? parsedSecs : prev));
    }
  }, [duration, parseDurationStringToSeconds]);

  // Periodic random jitter movement of forensic code (prevents cropping & screen recording)
  useEffect(() => {
    const positions: React.CSSProperties[] = [
      { top: '12%', left: '14%', right: 'auto', bottom: 'auto' },
      { top: '16%', right: '14%', left: 'auto', bottom: 'auto' },
      { top: '46%', left: '34%', right: 'auto', bottom: 'auto' },
      { bottom: '26%', left: '16%', top: 'auto', right: 'auto' },
      { bottom: '24%', right: '16%', top: 'auto', left: 'auto' },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % positions.length;
      setWatermarkPos(positions[idx]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // MutationObserver Tamper Guard: Pauses video if watermark is removed, hidden, or modified
  useEffect(() => {
    const target = watermarkRef.current;
    if (!target) return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          if (!target.innerText || target.innerText.trim().length === 0) {
            setIsTampered(true);
            setIsPlaying(false);
          }
        } else if (m.type === 'attributes') {
          const style = window.getComputedStyle(target);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            parseFloat(style.opacity || '1') < 0.2 ||
            target.hidden
          ) {
            setIsTampered(true);
            setIsPlaying(false);
          }
        }
      }
    });

    observer.observe(target, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });

    // Parent container check
    const parent = target.parentElement;
    let parentObserver: MutationObserver | null = null;
    if (parent) {
      parentObserver = new MutationObserver(() => {
        if (!parent.contains(watermarkRef.current)) {
          setIsTampered(true);
          setIsPlaying(false);
        }
      });
      parentObserver.observe(parent, { childList: true });
    }

    return () => {
      observer.disconnect();
      if (parentObserver) parentObserver.disconnect();
    };
  }, []);

  // Anti-DevTools heuristic detection
  useEffect(() => {
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 175;
      const heightThreshold = window.outerHeight - window.innerHeight > 175;
      if (widthThreshold || heightThreshold) {
        setIsDevToolsDetected(true);
        setIsPlaying(false);
      } else {
        setIsDevToolsDetected(false);
      }
    };

    window.addEventListener('resize', checkDevTools);
    return () => window.removeEventListener('resize', checkDevTools);
  }, []);

  // Sync YouTube PostMessage events
  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (data?.event === 'infoDelivery' && data?.info) {
          if (typeof data.info.currentTime === 'number' && !isScrubbingRef.current) {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setTotalDuration(data.info.duration);
          }
          if (typeof data.info.playerState === 'number') {
            if (data.info.playerState === 1) setIsPlaying(true);
            if (data.info.playerState === 2) setIsPlaying(false);
            if (data.info.playerState === 0) {
              setIsPlaying(false);
              onCompleted?.();
            }
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, [onCompleted]);

  // Smooth Time Progression Timer when playing
  useEffect(() => {
    if (!isPlaying || isTampered || isDevToolsDetected) return;
    const interval = setInterval(() => {
      if (isScrubbingRef.current) return;

      if (parsed.type === 'youtube' && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening' }),
          '*'
        );
        setCurrentTime((prev) => {
          const next = prev + 0.5 * playbackSpeed;
          return next <= totalDuration ? next : totalDuration;
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, isTampered, isDevToolsDetected, parsed.type, playbackSpeed, totalDuration]);

  // Execute Seek
  const performSeek = useCallback(
    (targetSeconds: number) => {
      const clamped = Math.max(0, Math.min(targetSeconds, totalDuration));
      setCurrentTime(clamped);

      if (parsed.type === 'direct' && videoRef.current) {
        videoRef.current.currentTime = clamped;
      } else if (parsed.type === 'youtube' && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [clamped, true] }),
          '*'
        );
      }
    },
    [parsed.type, totalDuration]
  );

  // Handle external seek jumps (e.g. clicking timestamps in lesson page)
  useEffect(() => {
    if (typeof seekTime === 'number') {
      performSeek(seekTime);
      if (!isPlaying) {
        togglePlay();
      }
    }
  }, [seekTime]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, isFullscreen, currentTime, totalDuration]);

  const togglePlay = () => {
    if (isTampered || isDevToolsDetected) return;

    if (parsed.type === 'direct' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (parsed.type === 'youtube' && iframeRef.current) {
      const command = isPlaying ? 'pauseVideo' : 'playVideo';
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      );
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (parsed.type === 'direct' && videoRef.current) {
      videoRef.current.muted = nextMuted;
    } else if (parsed.type === 'youtube' && iframeRef.current) {
      const command = nextMuted ? 'mute' : 'unMute';
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      );
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (parsed.type === 'direct' && videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      videoRef.current.muted = newVolume === 0;
    } else if (parsed.type === 'youtube' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [newVolume] }),
        '*'
      );
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);

    if (parsed.type === 'direct' && videoRef.current) {
      videoRef.current.playbackRate = speed;
    } else if (parsed.type === 'youtube' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [speed] }),
        '*'
      );
    }
  };

  const skipTime = (seconds: number) => {
    performSeek(currentTime + seconds);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Timeline Mouse Scrubbing Handlers
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    isScrubbingRef.current = true;
    setIsScrubbing(true);

    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = ratio * totalDuration;
    performSeek(target);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isScrubbingRef.current || !timelineRef.current) return;
      const moveRect = timelineRef.current.getBoundingClientRect();
      const moveRatio = Math.max(0, Math.min(1, (moveEvent.clientX - moveRect.left) / moveRect.width));
      performSeek(moveRatio * totalDuration);
    };

    const handleMouseUp = () => {
      isScrubbingRef.current = false;
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || totalDuration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const hTime = ratio * totalDuration;

    setHoverPosition(ratio * 100);
    setHoverTime(hTime);

    let activeChapter = null;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (hTime >= timestamps[i].timeSeconds) {
        activeChapter = timestamps[i].title;
        break;
      }
    }
    setHoverChapter(activeChapter);
  };

  const handleTimelineMouseLeave = () => {
    setHoverPosition(null);
    setHoverTime(null);
    setHoverChapter(null);
  };

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const maskedPhone = studentPhone ? studentPhone.replace(/\D/g, '').slice(-4) : '';

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => isPlaying && !isScrubbing && setControlsVisible(false)}
      className="relative aspect-video w-full rounded-lg bg-charcoal-950 overflow-hidden border border-hairline shadow-editorial select-none group font-sans"
    >
      {/* 1. Video Render Engine */}
      {parsed.type === 'youtube' ? (
        <div className="relative w-full h-full overflow-hidden">
          <iframe
            ref={iframeRef}
            src={parsed.embedUrl}
            title={title}
            className={`w-full h-full pointer-events-auto transform scale-[1.04] origin-center ${
              isTampered || isDevToolsDetected ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Top Pointer Shield (Disables click on YouTube Share & Channel logo button) */}
          <div
            onClick={togglePlay}
            className="absolute top-0 left-0 right-0 h-16 bg-transparent z-10 cursor-pointer"
            title="Lecture Protected Stream"
          />

          {/* Bottom Right Pointer Shield (Covers YouTube logo to prevent external navigation) */}
          <div
            onClick={togglePlay}
            className="absolute bottom-0 right-0 w-32 h-14 bg-transparent z-10 cursor-pointer"
          />
        </div>
      ) : parsed.type === 'direct' ? (
        <video
          ref={videoRef}
          src={parsed.embedUrl}
          playsInline
          className={`w-full h-full object-cover cursor-pointer ${
            isTampered || isDevToolsDetected ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={togglePlay}
          onTimeUpdate={() => {
            if (videoRef.current && !isScrubbingRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              if (videoRef.current.duration) {
                setTotalDuration(videoRef.current.duration);
              }
            }
          }}
          onEnded={onCompleted}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-charcoal-900 text-ivory-100">
          <Play className="w-12 h-12 text-burgundy-500 mb-3" />
          <h3 className="font-bold text-sm">{title}</h3>
          <p className="text-xs text-charcoal-50 mt-1">Lecture video source will load momentarily.</p>
        </div>
      )}

      {/* 2. FORENSIC TAMPER-GUARDED WATERMARK */}
      <div
        ref={watermarkRef}
        id="phenol-forensic-tag"
        style={{
          ...watermarkPos,
          opacity: 0.52,
          transition: 'all 2.2s cubic-bezier(0.4, 0, 0.2, 1)',
          textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.85)',
          letterSpacing: '0.08em',
        }}
        className="absolute pointer-events-none z-20 flex flex-col items-start gap-0.5 text-ivory-100 select-none px-3 py-1 rounded bg-black/25 backdrop-blur-[1px] border border-white/10"
      >
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider">
          <span className="text-burgundy-300 font-sans font-semibold text-[12px]">
            {studentName || 'Enrolled Scholar'}
          </span>
          <span className="opacity-75">•</span>
          <span className="text-white font-mono">{studentCode}</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-ivory-300 opacity-90">
          <span>SECURE ACADEMIC STREAM</span>
          {maskedPhone && (
            <>
              <span>•</span>
              <span>TEL: ...{maskedPhone}</span>
            </>
          )}
          <span>• DR. OMAR MAGDI</span>
        </div>
      </div>

      {/* Secondary micro forensic token in corner */}
      <div
        style={{
          opacity: 0.35,
          textShadow: '0 1px 2px rgba(0,0,0,0.9)',
        }}
        className="absolute top-3 left-4 pointer-events-none z-20 text-[10px] font-mono tracking-wider text-ivory-300 select-none"
      >
        PHENOL FORENSIC WATERMARK // {studentCode.replace(/[^a-zA-Z0-9]/g, '')}
      </div>

      {/* 3. Security Warning Overlay (when tampered or DevTools opened) */}
      {(isTampered || isDevToolsDetected) && (
        <div className="absolute inset-0 z-50 bg-charcoal-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-ivory-100">
          <div className="w-14 h-14 rounded-full bg-burgundy-900/60 border border-burgundy-500/40 flex items-center justify-center mb-4 text-burgundy-400">
            {isTampered ? <ShieldAlert className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <h3 className="font-bold text-base font-display mb-2 text-ivory-100">
            {isTampered
              ? 'تنبيه أمان: تم رصد محاولة تلاعب بعناصر الحماية'
              : 'أدوات المطور مفتوحة (DevTools Detected)'}
          </h3>
          <p className="text-xs text-charcoal-50 max-w-md leading-relaxed font-sans mb-4">
            {isTampered
              ? 'تم إيقاف تشغيل الفيديو لحماية الملكية الفكرية. يُرجى إعادة تحميل الصفحة لمتابعة المحاضرة.'
              : 'يرجى إغلاق أدوات المطور (F12) لمتابعة مشاهدة المحاضرة الأكاديمية بأمان.'}
          </p>
          <button
            onClick={() => {
              setIsTampered(false);
              setIsDevToolsDetected(false);
              window.location.reload();
            }}
            className="px-4 py-2 rounded bg-burgundy-600 hover:bg-burgundy-700 text-ivory-100 text-xs font-semibold shadow-quiet transition-all"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      )}

      {/* 4. Big Center Play Button Overlay (when paused and not tampered) */}
      {!isPlaying && !isTampered && !isDevToolsDetected && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-[2px] cursor-pointer transition-opacity"
        >
          <div className="w-16 h-16 rounded-full bg-burgundy-500 hover:bg-burgundy-600 transition-transform transform hover:scale-110 flex items-center justify-center shadow-editorial">
            <Play className="w-7 h-7 text-ivory-100 ml-1" />
          </div>
        </div>
      )}

      {/* 5. CUSTOM ACADEMIC CONTROL BAR */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 transition-all duration-300 ${
          controlsVisible || !isPlaying || isScrubbing
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <div className="relative backdrop-blur-xl bg-[#0f1012]/85 border-t border-hairline/25 shadow-editorial px-3 sm:px-5 pt-3 pb-3 text-ivory-100">
          {/* Timeline Scrubber */}
          <div className="relative mb-3 pt-1 group/timeline">
            {hoverPosition !== null && hoverTime !== null && (
              <div
                style={{ left: `${Math.min(Math.max(hoverPosition, 4), 96)}%` }}
                className="absolute bottom-6 transform -translate-x-1/2 pointer-events-none z-40 flex flex-col items-center animate-fade-in"
              >
                <div className="bg-charcoal-950/95 text-ivory-100 border border-hairline text-[11px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                  <span>{formatTime(hoverTime)}</span>
                  {hoverChapter && (
                    <span className="text-burgundy-300 font-sans ml-1.5 font-medium max-w-[160px] truncate inline-block align-bottom">
                      • {hoverChapter}
                    </span>
                  )}
                </div>
                <div className="w-1.5 h-1.5 bg-charcoal-950/95 border-r border-b border-hairline transform rotate-45 -mt-0.5" />
              </div>
            )}

            <div
              ref={timelineRef}
              onMouseDown={handleTimelineMouseDown}
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={handleTimelineMouseLeave}
              className="relative w-full h-3 flex items-center cursor-pointer select-none"
            >
              <div className="w-full h-1.5 group-hover/timeline:h-2 bg-ivory-100/20 group-hover/timeline:bg-ivory-100/25 rounded-full overflow-hidden transition-all duration-150">
                <div
                  style={{ width: `${progressPercentage}%` }}
                  className="h-full bg-gradient-to-r from-burgundy-600 via-burgundy-500 to-rose-500 rounded-full"
                />
              </div>

              {timestamps.map((ts, idx) => {
                if (totalDuration <= 0) return null;
                const notchPos = (ts.timeSeconds / totalDuration) * 100;
                if (notchPos <= 0 || notchPos >= 100) return null;
                return (
                  <div
                    key={idx}
                    style={{ left: `${notchPos}%` }}
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-1 h-2.5 bg-ivory-100/50 rounded-full pointer-events-none group-hover/timeline:h-3 transition-all"
                    title={ts.title}
                  />
                );
              })}

              <div
                style={{ left: `${progressPercentage}%` }}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-ivory-100 rounded-full border-2 border-burgundy-500 shadow-md scale-0 group-hover/timeline:scale-100 transition-transform duration-150 pointer-events-none"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 text-ivory-100">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded hover:bg-ivory-100/10 active:scale-95 transition-all text-ivory-100"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => skipTime(-10)}
                className="p-1.5 rounded hover:bg-ivory-100/10 active:scale-95 transition-all text-ivory-200 hover:text-ivory-100"
                title="Rewind 10 seconds (←)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => skipTime(10)}
                className="p-1.5 rounded hover:bg-ivory-100/10 active:scale-95 transition-all text-ivory-200 hover:text-ivory-100"
                title="Forward 10 seconds (→)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 font-mono text-xs text-ivory-200 ml-1">
                <span className="font-semibold text-ivory-100">{formatTime(currentTime)}</span>
                <span className="text-ivory-400">/</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2.5 py-1 rounded bg-ivory-100/10 hover:bg-ivory-100/20 text-xs font-mono font-semibold transition-colors flex items-center gap-1 text-ivory-100"
                  title="Playback Speed"
                >
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-charcoal-900 border border-hairline rounded shadow-editorial py-1 text-xs font-mono z-40 w-24">
                    {[0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changeSpeed(speed)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-burgundy-500 hover:text-ivory-100 transition-colors flex items-center justify-between ${
                          playbackSpeed === speed ? 'text-burgundy-400 font-bold' : 'text-ivory-200'
                        }`}
                      >
                        <span>{speed}x</span>
                        {playbackSpeed === speed && <CheckCircle2 className="w-3 h-3 text-burgundy-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center group/volume relative">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded hover:bg-ivory-100/10 transition-colors text-ivory-200 hover:text-ivory-100"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 50 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <div className="w-0 overflow-hidden group-hover/volume:w-16 transition-all duration-200 flex items-center ml-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                    className="w-14 h-1 bg-ivory-100/20 accent-burgundy-500 rounded cursor-pointer"
                    title={`Volume: ${isMuted ? 0 : volume}%`}
                  />
                </div>
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded hover:bg-ivory-100/10 transition-colors text-ivory-200 hover:text-ivory-100"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
