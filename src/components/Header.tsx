import React, { useState, useEffect } from 'react';
import { Disc3, Menu, X, Shield, Sparkles, Volume2, UserCheck, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  isPlaying: boolean;
  user: User | null;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  user,
  isAdmin,
  onOpenAdmin,
  onLogout
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      const sections = ['home', 'music', 'about', 'contact'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveNav(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#08080c]/90 backdrop-blur-md border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,240,255,0.15)] py-3'
          : 'bg-gradient-to-b from-black/80 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => scrollTo('home')}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="relative">
            <div
              className={`w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-[2px] shadow-[0_0_15px_rgba(0,240,255,0.6)] group-hover:shadow-[0_0_25px_rgba(255,0,128,0.8)] transition-all ${
                isPlaying ? 'animate-spin [animation-duration:3s]' : ''
              }`}
            >
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center relative overflow-hidden">
                <Disc3 className="w-6 h-6 text-cyan-400 group-hover:text-pink-400 transition-colors" />
                <div className="absolute inset-0 bg-radial from-transparent to-black/60 pointer-events-none" />
              </div>
            </div>
            {isPlaying && (
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Orbitron'] font-black tracking-widest text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                DJ AS DUNGRAS
              </span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-[10px] tracking-[0.25em] text-cyan-300/80 uppercase font-mono">
              Feel The Music • Live The Beats
            </p>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-black/40 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          {[
            { id: 'home', label: 'Home' },
            { id: 'music', label: 'Music' },
            { id: 'about', label: 'About' },
            { id: 'contact', label: 'Contact' },
          ].map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'text-black bg-gradient-to-r from-cyan-400 to-pink-500 font-bold shadow-[0_0_15px_rgba(0,240,255,0.7)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action: Admin / Live Playing */}
        <div className="hidden sm:flex items-center gap-3">
          {isPlaying && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono animate-pulse">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVE ON AIR</span>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/50 text-purple-200 text-xs font-semibold tracking-wider transition shadow-[0_0_15px_rgba(176,38,255,0.3)] hover:shadow-[0_0_20px_rgba(176,38,255,0.6)]"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>{isAdmin ? 'DJ DASHBOARD' : 'ACCOUNT'}</span>
              </button>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-purple-600/30 hover:from-cyan-500/50 hover:to-purple-500/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold tracking-wider transition shadow-[0_0_12px_rgba(0,240,255,0.3)] hover:shadow-[0_0_18px_rgba(0,240,255,0.6)]"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>ADMIN ACCESS</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Button with Animated Neon Glow */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onOpenAdmin}
            aria-label="Admin access"
            className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-400"
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg bg-black/60 border border-cyan-500/50 text-cyan-400 hover:text-pink-400 shadow-[0_0_12px_rgba(0,240,255,0.5)] focus:outline-none transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#08080c]/95 border-b border-cyan-500/30 px-6 py-6 backdrop-blur-xl shadow-[0_15px_30px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-3">
            {[
              { id: 'home', label: 'Home' },
              { id: 'music', label: 'Music Library' },
              { id: 'about', label: 'About DJ' },
              { id: 'contact', label: 'Contact & Bookings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-left py-2.5 px-4 rounded-xl text-base font-semibold tracking-wider text-gray-200 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-cyan-400 text-xs">→</span>
              </button>
            ))}

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-black font-bold text-center tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>{isAdmin ? 'ADMIN DASHBOARD' : 'ADMIN LOGIN'}</span>
              </button>
              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs text-center font-semibold"
                >
                  Sign Out ({user.email})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
