import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Download, 
  Repeat, 
  Shuffle, 
  Maximize2, 
  Minimize2,
  Disc3,
  Flame,
  Activity
} from 'lucide-react';
import { Track } from '../types';
import { Visualizer } from './Visualizer';
import { getTrackDownloadUrl, getTrackDownloadFilename } from '../utils/driveHelper';

interface AudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDownload: (track: Track) => void;
  onEnded: () => void;
  onTrackLoaded?: (duration: number) => void;
  onTimeUpdate?: (time: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onDownload,
  onEnded,
  onTrackLoaded,
  onTimeUpdate
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync isPlaying with HTML5 audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Auto-play was prevented by browser policy:', err);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle loop toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLoop;
    }
  }, [isLoop]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);
      if (onTimeUpdate) onTimeUpdate(cur);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      if (onTrackLoaded) onTrackLoaded(dur);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
      />

      {/* Fullscreen Expanded Visualizer Spotlight Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#08080c]/98 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-['Orbitron'] font-bold text-sm tracking-widest text-cyan-400 uppercase">
                CLUB STAGE SPOTLIGHT
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-3 rounded-full bg-black/60 border border-white/20 text-white hover:text-pink-400 hover:border-pink-500 transition"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Center Stage Artwork + Equalizer */}
          <div className="flex flex-col items-center justify-center my-auto text-center max-w-2xl mx-auto w-full">
            <div className="relative mb-8 group">
              <div
                className={`w-56 h-56 sm:w-72 sm:h-72 rounded-full p-2 bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_50px_rgba(0,240,255,0.6)] ${
                  isPlaying ? 'animate-spin [animation-duration:8s]' : ''
                }`}
              >
                <img
                  src={
                    currentTrack.coverUrl ||
                    '/assets/aistudio/IMG-20261102-WA0001_2da96bcd.jpg'
                  }
                  alt={currentTrack.title}
                  className="w-full h-full object-cover rounded-full border-4 border-black"
                />
              </div>

              {/* Center Vinyl Spindle with Official Logo */}
              <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.8)] flex items-center justify-center overflow-hidden pointer-events-none">
                <img
                  src="/assets/aistudio/IMG-20261102-WA0001_2da96bcd.jpg"
                  alt="DJ AS DUNGRAS Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/40 text-pink-300 font-mono text-xs mb-3">
              <Activity className="w-3.5 h-3.5" />
              <span>{currentTrack.bpm} BPM • {currentTrack.genre}</span>
            </div>

            <h2 className="font-['Orbitron'] font-black text-2xl sm:text-4xl text-white tracking-wide mb-1">
              {currentTrack.title}
            </h2>
            <p className="text-gray-400 font-mono text-sm sm:text-base mb-6">
              {currentTrack.artist}
            </p>

            {/* Live Large Visualizer */}
            <div className="w-full my-4">
              <Visualizer isPlaying={isPlaying} bpm={currentTrack.bpm} barCount={48} height={110} mode="bars" />
            </div>
          </div>

          {/* Expanded Bottom Controls */}
          <div className="max-w-2xl mx-auto w-full">
            {/* Scrub Bar */}
            <div className="flex items-center gap-3 text-xs font-mono text-gray-400 mb-4">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span>{formatTime(duration)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setIsLoop(!isLoop)}
                className={`p-3 rounded-full transition ${
                  isLoop ? 'text-pink-400 bg-pink-950/40 border border-pink-500/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Repeat className="w-5 h-5" />
              </button>

              <button
                onClick={onPrev}
                className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.8)] hover:scale-105 active:scale-95 transition"
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-1" />}
              </button>

              <button
                onClick={onNext}
                className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDownload(currentTrack);
                }}
                className="p-3 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 transition border border-emerald-500/30 cursor-pointer flex items-center justify-center"
                title="Download Track"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Audio Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#08080c]/95 border-t border-cyan-500/30 backdrop-blur-xl shadow-[0_-5px_30px_rgba(0,0,0,0.8)] px-3 sm:px-6 py-2.5 sm:py-3 transition-all duration-300">
        {/* Top Slim Progress Bar */}
        <div className="absolute -top-1 left-0 right-0 h-1 bg-black group cursor-pointer">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 relative transition-all duration-100"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Track Info & Thumbnail */}
          <div className="flex items-center gap-3 min-w-0 max-w-[40%] sm:max-w-xs">
            <div className="relative shrink-0">
              <img
                src={
                  currentTrack.coverUrl ||
                  '/assets/aistudio/IMG-20261102-WA0001_2da96bcd.jpg'
                }
                alt={currentTrack.title}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.4)] ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
              />
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
              )}
            </div>

            <div className="min-w-0">
              <h4 className="font-['Orbitron'] font-bold text-xs sm:text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                {currentTrack.title}
              </h4>
              <p className="text-gray-400 text-[11px] font-mono truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Center: Playback Controls & Timeline */}
          <div className="flex flex-col items-center flex-1 max-w-xl">
            <div className="flex items-center gap-2 sm:gap-4 mb-1">
              {/* Loop */}
              <button
                onClick={() => setIsLoop(!isLoop)}
                className={`hidden sm:block p-1.5 rounded-md transition ${
                  isLoop ? 'text-pink-400 bg-pink-950/40' : 'text-gray-400 hover:text-white'
                }`}
                title="Toggle Repeat"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>

              {/* Prev */}
              <button
                onClick={onPrev}
                className="p-1.5 text-gray-300 hover:text-white transition active:scale-90"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Main Play/Pause Button */}
              <button
                onClick={onTogglePlay}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.7)] hover:shadow-[0_0_25px_rgba(0,240,255,0.9)] hover:scale-105 active:scale-95 transition"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>

              {/* Next */}
              <button
                onClick={onNext}
                className="p-1.5 text-gray-300 hover:text-white transition active:scale-90"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Spotlight Expand */}
              <button
                onClick={() => setIsExpanded(true)}
                className="hidden sm:block p-1.5 text-cyan-400 hover:text-cyan-300 transition"
                title="Expand Visualizer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrub Slider */}
            <div className="w-full flex items-center gap-2 text-[10px] font-mono text-gray-400">
              <span className="w-8 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-pink-400"
              />
              <span className="w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume, Download, Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Volume Control (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-16 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Quick Download in Player */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDownload(currentTrack);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900/80 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-['Orbitron'] font-semibold tracking-wider shadow-[0_0_12px_rgba(255,0,128,0.3)] transition cursor-pointer"
              title="Download Track"
            >
              <Download className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">MP3</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
