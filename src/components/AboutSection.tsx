import React from 'react';
import { Disc3, Sliders, Volume2, Zap, Flame, Award, Radio } from 'lucide-react';
import { Visualizer } from './Visualizer';

interface AboutSectionProps {
  isPlaying: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isPlaying }) => {
  const djGear = [
    { title: 'Decks', desc: 'Pioneer CDJ-3000 Pro DJ Multi Players', icon: Disc3 },
    { title: 'Mixer', desc: 'DJM-900NXS2 4-Channel Professional Mixer', icon: Sliders },
    { title: 'Acoustics', desc: 'High-Wattage Dual 18" Sub-Bass Arrays', icon: Volume2 },
    { title: 'FX & Lasers', desc: 'RGB DMX Laser Array & Nitrogen Strobe Rig', icon: Zap },
  ];

  return (
    <section id="about" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Column: Visual Artwork & Stage Equipment */}
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-500/40 p-2 bg-gradient-to-tr from-cyan-500/20 via-purple-600/20 to-pink-500/20 shadow-[0_0_40px_rgba(0,240,255,0.25)]">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-black">
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80"
                alt="DJ AS DUNGRAS Stage"
                className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Live Overlay Badge */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Orbitron'] font-bold text-xs text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE PERFORMANCE RIG
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">DMX 512 ACTIVE</span>
                </div>
                <Visualizer isPlaying={isPlaying} barCount={28} height={40} mode="wave" />
              </div>
            </div>
          </div>

          {/* Floating Floating Metric Card */}
          <div className="absolute -top-6 -right-6 sm:top-6 sm:-right-8 p-4 rounded-2xl bg-[#0c0c14]/95 border border-pink-500/40 shadow-[0_0_25px_rgba(255,0,128,0.4)] backdrop-blur-md hidden sm:block">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-950/60 border border-pink-500/50 text-pink-400">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="font-['Orbitron'] font-black text-xl text-white">100% LIVE</p>
                <p className="text-[11px] font-mono text-gray-400">Non-Stop Energy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bio & Philosophy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono mb-4">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>THE SOUND ARCHITECT</span>
          </div>

          <h2 className="font-['Orbitron'] font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wider text-white mb-6">
            BEHIND THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">BEATS</span>
          </h2>

          <div className="space-y-4 text-gray-300 text-sm sm:text-base leading-relaxed font-light">
            <p>
              <strong className="text-white font-medium">DJ AS DUNGRAS</strong> is a powerhouse DJ, music producer, 
              and remixer known for electrifying dancefloors with unmistakable sonic force. 
              Bridging high-tempo festival EDM, hard-hitting Punjabi Dhol beats, and deep club baselines, 
              every set is an immersive journey into rhythm.
            </p>
            <p>
              Operating under the creed <em className="text-cyan-400 font-normal">"Feel The Music, Live The Beats"</em>, 
              DJ AS DUNGRAS crafts custom-engineered edits and live mashups designed to vibrate subwoofers 
              and keep audiences moving till the early dawn.
            </p>
          </div>

          {/* DJ Hardware Rig Specs */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {djGear.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono uppercase text-gray-400">{item.title}</h4>
                    <p className="text-xs text-white font-medium mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
