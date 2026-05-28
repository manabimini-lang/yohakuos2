"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface QuietAudioPlayerProps {
  src: string;
  duration?: number;
  title?: string;
}

export function QuietAudioPlayer({ 
  src, 
  duration,
  title = "静かな振り返り"
}: QuietAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);
    
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="flex items-center gap-3">
        {/* Play button */}
        <button 
          onClick={togglePlay}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-black/8 dark:bg-white/8 hover:bg-black/15 dark:hover:bg-white/15 transition-colors duration-200"
          aria-label={isPlaying ? "一時停止" : "再生"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 text-black/60 dark:text-white/60" />
          ) : (
            <Play className="w-3.5 h-3.5 text-black/60 dark:text-white/60 ml-0.5" />
          )}
        </button>

        {/* Time display */}
        <div className="text-xs font-mono text-black/40 dark:text-white/40 min-w-fit">
          {formatTime(currentTime)} / {duration ? formatTime(duration) : "0:00"}
        </div>
      </div>

      {/* Progress bar */}
      <div 
        className="h-0.5 bg-black/8 dark:bg-white/8 rounded-full overflow-hidden cursor-pointer hover:h-1 transition-all duration-200"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          if (audioRef.current && audioRef.current.duration) {
            audioRef.current.currentTime = percent * audioRef.current.duration;
          }
        }}
      >
        <div 
          className="h-full bg-black/30 dark:bg-white/30 transition-all duration-100" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
