import React from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Flame, 
  Radio, 
  Youtube, 
  Facebook, 
  Instagram, 
  Music, 
  Send,
  MessageCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { Visualizer } from './Visualizer';
import { Track } from '../types';

interface HeroProps {
  isPlaying: boolean;
  currentTrack: Track | null;
  onTogglePlay: () => void;
  onScrollToMusic: () => void;
  onDownloadFeatured: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  isPlaying,
  currentTrack,
  onTogglePlay,
  onScrollToMusic,
  onDownloadFeatured
}) => {
  const socialLinks = [
    {
      name: 'Moj Live',
      url: 'https://mojapp.in/@arvind_singh_rathoe?referrer=VZinos5-1MUBR7D',
      icon: Radio,
      color: 'from-amber-500 to-red-600',
      hoverBorder: 'hover:border-amber-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.6)]'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@dj_as_dungras',
      icon: Youtube,
      color: 'from-red-600 to-rose-700',
      hoverBorder: 'hover:border-red-500',
      shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/as_dungras?xtok=em91amd2eGV6aHdl',
      icon: Instagram,
      color: 'from-pink-500 via-purple-500 to-amber-500',
      hoverBorder: 'hover:border-pink-500',
      shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.6)]'
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/share/1EEQBanNoG/',
      icon: Facebook,
      color: 'from-blue-600 to-indigo-600',
      hoverBorder: 'hover:border-blue-500',
      shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]'
    },
    {
      name: 'BandLab',
      url: 'https://www.bandlab.com/dj_as_dungras',
      icon: Music,
      color: 'from-cyan-500 to-blue-600',
      hoverBorder: 'hover:border-cyan-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]'
    },
    {
      name: 'WhatsApp Channel',
      url: 'https://www.whatsapp.com/channel/0029Vb8wjoY35fLuqfn24V3s',
      icon: MessageCircle,
      color: 'from-emerald-500 to-green-600',
      hoverBorder: 'hover:border-emerald-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]'
    },
    {
      name: 'Pinterest',
      url: 'https://www.pinterest.com/',
      icon: Send,
      color: 'from-rose-600 to-red-700',
      hoverBorder: 'hover:border-rose-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.6)]'
    }
  ];

  return (
    <section id="home" className="relative min-h-screen pt-28 pb-16 flex flex-col justify-center items-center px-4 overflow-hidden">
      {/* Background Strobe / Blinking Club Lights */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute top-20 right-1/4 w-80 h-80 bg-pink-500/15 rounded-full blur-[110px] pointer-events-none animate-pulse [animation-duration:2.5s]" />
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse [animation-duration:4s]" />

      {/* Flashing Top Stage Rig Light Fixtures */}
      <div className="absolute top-0 inset-x-0 flex justify-around pointer-events-none opacity-80">
        {['#00f0ff', '#ff0055', '#39ff14', '#b026ff', '#00f0ff'].map((clr, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div 
              className="w-4 h-2 rounded-b-md shadow-lg"
              style={{ backgroundColor: clr, boxShadow: `0 0 15px ${clr}` }}
            />
            <div 
              className={`w-0.5 h-32 opacity-40 bg-gradient-to-b from-white to-transparent transition-opacity duration-300 ${
                isPlaying ? 'animate-pulse' : 'opacity-20'
              }`}
            />
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto w-full text-center relative z-10 flex flex-col items-center">
        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/80 via-black to-purple-950/80 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-pulse">
          <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span>OFFICIAL ARTIST PORTAL • 2026 CLUB TOUR</span>
          <Flame className="w-4 h-4 text-pink-500 fill-pink-500" />
        </div>

        {/* Large Main Heading: DJ AS DUNGRAS */}
        <h1 className="font-['Orbitron'] font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wider uppercase mb-4">
          <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">DJ AS </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-[0_0_35px_rgba(0,240,255,0.8)]">
            DUNGRAS
          </span>
        </h1>

        {/* Subtitle */}
        <div className="relative mb-6">
          <p className="font-['Rajdhani'] font-bold text-xl sm:text-2xl md:text-3xl text-gray-200 tracking-[0.2em] uppercase">
            Feel The Music, <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.8)]">Live The Beats</span>
          </p>
          <div className="w-32 h-0.5 mx-auto mt-2 bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_10px_#ff0055]" />
        </div>

        <p className="max-w-2xl text-gray-400 text-sm sm:text-base leading-relaxed mb-8 px-4 font-light">
          Welcome to the official sanctuary of heavy festival drops, Punjabi dhol club mixes, 
          and electronic dance anthems. Stream live, download studio-mastered tracks, and crank up the bass.
        </p>

        {/* Moving Sound Wave & Equalizer Display */}
        <div className="w-full max-w-2xl bg-black/50 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 mb-10 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <div className="flex items-center justify-between mb-3 px-2 text-xs font-mono text-cyan-300">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
              SPECTRUM ANALYZER
            </span>
            <span className="text-pink-400 tracking-wider">
              {currentTrack ? `${currentTrack.bpm} BPM • ${currentTrack.genre}` : '128 BPM • MASTER STEREO'}
            </span>
          </div>

          <Visualizer isPlaying={isPlaying} bpm={currentTrack?.bpm || 128} barCount={40} height={85} mode="bars" />

          {currentTrack && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-2 truncate">
                <span className="text-cyan-400 font-bold">Now Playing:</span>
                <span className="truncate text-white font-medium">{currentTrack.title}</span>
              </div>
              <span className="text-gray-400 shrink-0 font-mono">DJ AS DUNGRAS</span>
            </div>
          )}
        </div>

        {/* Main Glowing Call-To-Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12">
          {/* Play Music Button */}
          <button
            onClick={onTogglePlay}
            className="group relative px-8 py-4 rounded-xl font-['Orbitron'] font-bold text-sm sm:text-base uppercase tracking-wider text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-[0_0_25px_rgba(0,240,255,0.8)] hover:shadow-[0_0_40px_rgba(0,240,255,1)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-4 h-4 text-black fill-black" />
              ) : (
                <Play className="w-4 h-4 text-black fill-black ml-0.5" />
              )}
            </div>
            <span>{isPlaying ? 'PAUSE MUSIC' : 'PLAY MUSIC'}</span>
          </button>

          {/* Download Music Button */}
          <button
            onClick={onDownloadFeatured}
            className="group relative px-8 py-4 rounded-xl font-['Orbitron'] font-bold text-sm sm:text-base uppercase tracking-wider text-white bg-black/70 hover:bg-black/90 border-2 border-pink-500 hover:border-pink-400 shadow-[0_0_20px_rgba(255,0,128,0.5)] hover:shadow-[0_0_35px_rgba(255,0,128,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
          >
            <Download className="w-5 h-5 text-pink-400 group-hover:animate-bounce" />
            <span>DOWNLOAD MUSIC</span>
          </button>

          {/* Explore Tracks */}
          <button
            onClick={onScrollToMusic}
            className="px-6 py-4 rounded-xl font-['Orbitron'] font-semibold text-sm uppercase tracking-wider text-purple-300 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/40 hover:border-purple-400 shadow-[0_0_15px_rgba(176,38,255,0.3)] transition-all"
          >
            BROWSE LIBRARY
          </button>
        </div>

        {/* Social Media Buttons Bar */}
        <div className="w-full max-w-4xl pt-6 border-t border-white/10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            CONNECT WITH DJ AS DUNGRAS ON OFFICIAL PLATFORMS
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 ${link.hoverBorder} ${link.shadow} text-gray-200 hover:text-white transition-all duration-300 text-xs sm:text-sm font-medium hover:scale-105`}
                >
                  <div className={`p-1 rounded-md bg-gradient-to-tr ${link.color} text-white shadow-sm`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
