import React from 'react';
import { Disc3, ArrowUp, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-black border-t border-cyan-500/20 pt-16 pb-28 sm:pb-24 px-4 overflow-hidden">
      {/* Ambient Neon Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f0ff]" />

      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Brand Icon & Heading */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 p-0.5 shadow-[0_0_20px_rgba(0,240,255,0.6)]">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-cyan-400 animate-spin [animation-duration:6s]" />
            </div>
          </div>
          <span className="font-['Orbitron'] font-black tracking-widest text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500">
            DJ AS DUNGRAS
          </span>
        </div>

        {/* Subtitle */}
        <p className="font-['Rajdhani'] font-bold text-lg sm:text-xl text-gray-300 tracking-[0.2em] uppercase mb-4">
          Feel The Music, <span className="text-pink-500 drop-shadow-[0_0_10px_#ff0055]">Live The Beats</span>.
        </p>

        {/* Quick Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 my-6 text-xs uppercase tracking-widest font-mono text-gray-400">
          <a href="#home" className="hover:text-cyan-400 transition">Home</a>
          <span>•</span>
          <a href="#music" className="hover:text-cyan-400 transition">Music Vault</a>
          <span>•</span>
          <a href="#about" className="hover:text-cyan-400 transition">About DJ</a>
          <span>•</span>
          <a href="#contact" className="hover:text-cyan-400 transition">Bookings & Contact</a>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-white/10 w-full max-w-lg flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 font-mono gap-2">
          <p>© {new Date().getFullYear()} DJ AS DUNGRAS. All Rights Reserved. • <span className="text-cyan-400 font-bold">© Nexora</span></p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
