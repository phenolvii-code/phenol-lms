'use client';

import React, { useState, useEffect, useRef } from 'react';
import { parseVideoSource } from '@/lib/student-code';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface PhenolVideoPlayerProps {
  videoUrl?: string;
  title: string;
  duration?: string;
  studentCode: string;
  onCompleted?: () => void;
  seekTime?: number | null;
}

export const PhenolVideoPlayer: React.FC<PhenolVideoPlayerProps> = ({
  videoUrl,
  title,
  duration = '45 min',
  studentCode,
  onCompleted,
  seekTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(2700); // default 45 min in seconds
  const [controlsVisible, setControlsVisible] = useState(true);

  // Stealth Blended Watermark Position State (Slowly drifts every 45s)
  const [watermarkPos, setWatermarkPos] = useState({ top: '18%', left: '22%' });

  const parsed = parseVideoSource(videoUrl || 'https://www.youtube.com/watch?v=k3rRrl9J2F4');

  // Handle periodic stealth movement of forensic code
  useEffect(() => {
    const positions = [
      { top: '15%', left: '18%' },
      { top: '22%', right: '20%', left: 'auto' },
      { bottom: '25%', left: '24%', top: 'auto' },
      { bottom: '30%', right: '22%', top: 'auto', left: 'auto' },
      { top: '40%', left: '35%' },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % positions.length;
      setWatermarkPos(positions[idx] as any);
    }, 40000); // shift position every 40 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle external seek jumps (e.g. clicking timestamps)
  useEffect(() => {
    if (typeof seekTime === 'number') {
      if (parsed.type === 'direct' && videoRef.current) {
        videoRef.current.currentTime = seekTime;
        videoRef.current.play();
        setIsPlaying(true);
      } else if (parsed.type === 'youtube' && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [seekTime, true] }),
          '*'
        );
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
          '*'
        );
        setIsPlaying(true);
      }
    }
  }, [seekTime, parsed.type]);

  // Keyboard Shortcuts (Space for play/pause, M for mute, F for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'ArrowRight') {
        skipTime(10);
      } else if (e.code === 'ArrowLeft') {
        skipTime(-10);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, isFullscreen]);

  const togglePlay = () => {
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
    if (parsed.type === 'direct' && videoRef.current) {
      videoRef.current.muted = !isMuted;
    } else if (parsed.type === 'youtube' && iframeRef.current) {
      const command = isMuted ? 'unMute' : 'mute';
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      );
    }
    setIsMuted(!isMuted);
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
    if (parsed.type === 'direct' && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    } else if (parsed.type === 'youtube' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [currentTime + seconds, true] }),
        '*'
      );
    }
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      className="relative aspect-video w-full rounded-lg bg-charcoal-950 overflow-hidden border border-hairline shadow-editorial select-none group font-sans"
    >
      {/* 1. Video Render Engine */}
      {parsed.type === 'youtube' ? (
        <div className="relative w-full h-full overflow-hidden">
          <iframe
            ref={iframeRef}
            src={parsed.embedUrl}
            title={title}
            className="w-full h-full pointer-events-auto transform scale-[1.04] origin-center"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Transparent Pointer Shield: Top 60px (Disables click on YouTube Share & Watch on YouTube buttons) */}
          <div
            onClick={togglePlay}
            className="absolute top-0 left-0 right-0 h-16 bg-transparent z-10 cursor-pointer"
            title="Lecture Protected Stream"
          />

          {/* Bottom Right Pointer Shield (Covers YouTube watermark icon) */}
          <div
            onClick={togglePlay}
            className="absolute bottom-0 right-0 w-28 h-12 bg-transparent z-10 cursor-pointer"
          />
        </div>
      ) : parsed.type === 'direct' ? (
        <video
          ref={videoRef}
          src={parsed.embedUrl}
          playsInline
          className="w-full h-full object-cover cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              setTotalDuration(videoRef.current.duration || 2700);
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

      {/* 2. STEALTH BLENDED FORENSIC WATERMARK (كود الطالب الأكاديمي المدمج) */}
      <div
        style={{
          ...watermarkPos,
          mixBlendMode: 'overlay',
          opacity: 0.32,
          filter: 'contrast(130%)',
          transition: 'all 2.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="absolute pointer-events-none z-20 flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-ivory-100 select-none px-2 py-0.5 rounded backdrop-blur-[0.5px]"
      >
        <span className="font-bold">{studentCode}</span>
        <span className="text-[9px] opacity-75">• 1080p HD</span>
      </div>

      {/* Secondary micro-token in corner for forensic leak identification */}
      <div
        style={{ mixBlendMode: 'overlay', opacity: 0.22 }}
        className="absolute top-3 left-4 pointer-events-none z-20 text-[10px] font-mono tracking-wider text-ivory-200 select-none uppercase"
      >
        PHENOL STREAM // SECURE BROADCAST #{studentCode.replace(/[^a-zA-Z0-9]/g, '')}
      </div>

      {/* 3. Big Center Play Button Overlay (when paused) */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-[2px] cursor-pointer transition-opacity"
        >
          <div className="w-16 h-16 rounded-full bg-burgundy-500 hover:bg-burgundy-600 transition-transform transform hover:scale-110 flex items-center justify-center shadow-editorial">
            <Play className="w-7 h-7 text-ivory-100 ml-1" />
          </div>
        </div>
      )}

      {/* 4. Custom Academic Control Bar (Overlay at bottom) */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-charcoal-950/95 via-charcoal-950/70 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-4 text-ivory-100">
          {/* Left Controls: Play/Pause, Rewind, Fast Forward, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded hover:bg-ivory-100/10 transition-colors text-ivory-100"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 rounded hover:bg-ivory-100/10 transition-colors text-ivory-200"
              title="Rewind 10 seconds (←)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-1.5 rounded hover:bg-ivory-100/10 transition-colors text-ivory-200"
              title="Forward 10 seconds (→)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-ivory-200 ml-1">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{duration}</span>
            </div>
          </div>

          {/* Right Controls: Speed Selector, Mute, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2.5 py-1 rounded bg-ivory-100/10 hover:bg-ivory-100/20 text-xs font-mono font-semibold transition-colors flex items-center gap-1"
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

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded hover:bg-ivory-100/10 transition-colors text-ivory-200"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-ivory-100/10 transition-colors text-ivory-200"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
