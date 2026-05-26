"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
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
    <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-500 w-fit">
      <audio ref={audioRef} src={src} preload="none" />
      
      <button 
        onClick={togglePlay}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex flex-col">
        <span className="text-sm font-medium tracking-wide">◉ {title}</span>
        {duration && (
          <span className="text-xs opacity-50 font-mono mt-0.5">
            {formatTime(duration)}
          </span>
        )}
      </div>

      {isPlaying && (
        <motion.div 
          className="h-[2px] bg-black/10 dark:bg-white/10 w-20 ml-4 overflow-hidden rounded-full"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 80 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="h-full bg-black/40 dark:bg-white/40" 
            style={{ width: `${progress}%` }} 
          />
        </motion.div>
      )}
    </div>
  );
}
