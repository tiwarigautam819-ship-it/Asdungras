import React, { useState, useRef } from 'react';
import { Disc3, ArrowUp } from 'lucide-react';

interface FooterProps {
  onSecretAdminTrigger?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSecretAdminTrigger }) => {
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<any>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSecretClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        if (onSecretAdminTrigger) onSecretAdminTrigger();
        return 0;
      }
      return next;
    });

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2500);
  };

  return (
    <footer className="relative bg-black border-t border-cyan-500/20 pt-16 pb-28 sm:pb-24 px-4 overflow-hidden">
      {/* Ambient Neon Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f0ff]" />

      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Brand Icon & Heading */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 p-[2px] shadow-[0_0_20px_rgba(0,240,255,0.6)]">
            <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center">
              <img
                src="/assets/aistudio/IMG-20261102-WA0001_2da96bcd.jpg"
                alt="DJ AS DUNGRAS Logo"
                className="w-full h-full object-cover scale-105"
              />
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

        {/* Copyright with stealth admin trigger */}
        <div className="pt-6 border-t border-white/10 w-full max-w-lg flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 font-mono gap-2">
          <p>
            © {new Date().getFullYear()} DJ AS DUNGRAS. All Rights Reserved. •{' '}
            <span
              onClick={handleSecretClick}
              className="text-cyan-400 font-bold select-none cursor-default"
              title=""
            >
              © Nexora
            </span>
          </p>
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
