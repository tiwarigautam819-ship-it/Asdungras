import React, { useState, useEffect } from 'react';
import { 
  Send, 
  MessageCircle, 
  PhoneCall, 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Radio, 
  Youtube, 
  Facebook, 
  Instagram, 
  Music, 
  Share2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { sendContactMessage } from '../firebase';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configurable WhatsApp Phone Number
  const [whatsappNumber, setWhatsappNumber] = useState<string>('8955932061');
  const [showPhoneConfig, setShowPhoneConfig] = useState(false);
  const [tempPhoneInput, setTempPhoneInput] = useState('8955932061');

  // Load configured WhatsApp number from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('djas_whatsapp_number');
    if (saved) {
      setWhatsappNumber(saved);
      setTempPhoneInput(saved);
    } else {
      setWhatsappNumber('8955932061');
      setTempPhoneInput('8955932061');
    }
  }, []);

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = tempPhoneInput.replace(/[^0-9+]/g, '');
    setWhatsappNumber(cleanNumber);
    localStorage.setItem('djas_whatsapp_number', cleanNumber);
    setShowPhoneConfig(false);
  };

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) {
      // Prompt user to configure phone or open config modal
      setShowPhoneConfig(true);
      return;
    }
    const clean = whatsappNumber.replace(/[^0-9]/g, '');
    const text = encodeURIComponent('Hello DJ AS DUNGRAS! I would like to book you for an event / party.');
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const officialSocials = [
    {
      name: 'Moj Live',
      url: 'https://mojapp.in/@arvind_singh_rathoe?referrer=VZinos5-1MUBR7D',
      icon: Radio,
      desc: 'Watch Live Streaming & DJ Sessions',
      tag: '@arvind_singh_rathoe',
      border: 'border-amber-500/30 hover:border-amber-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
      gradient: 'from-amber-500 to-red-500'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@dj_as_dungras',
      icon: Youtube,
      desc: 'Official Remixes & Music Videos',
      tag: '@dj_as_dungras',
      border: 'border-red-500/30 hover:border-red-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
      gradient: 'from-red-600 to-rose-700'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/as_dungras?xtok=em91amd2eGV6aHdl',
      icon: Instagram,
      desc: 'Behind the Scenes & Gig Clips',
      tag: '@as_dungras',
      border: 'border-pink-500/30 hover:border-pink-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]',
      gradient: 'from-pink-500 via-purple-500 to-amber-500'
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/share/1EEQBanNoG/',
      icon: Facebook,
      desc: 'Event Updates & Fan Community',
      tag: 'DJ AS DUNGRAS Official',
      border: 'border-blue-500/30 hover:border-blue-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
      gradient: 'from-blue-600 to-indigo-600'
    },
    {
      name: 'BandLab',
      url: 'https://www.bandlab.com/dj_as_dungras',
      icon: Music,
      desc: 'Music Production & Stems Collaboration',
      tag: 'dj_as_dungras',
      border: 'border-cyan-500/30 hover:border-cyan-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      name: 'WhatsApp Channel',
      url: 'https://www.whatsapp.com/channel/0029Vb8wjoY35fLuqfn24V3s',
      icon: MessageCircle,
      desc: 'Instant Broadcasts & Track Drops',
      tag: 'Official Channel',
      border: 'border-emerald-500/30 hover:border-emerald-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]',
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      name: 'Pinterest',
      url: 'https://www.pinterest.com/',
      icon: Share2,
      desc: 'Stage Visuals & Club Themes',
      tag: 'DJ AS DUNGRAS',
      border: 'border-rose-500/30 hover:border-rose-400',
      shadow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]',
      gradient: 'from-rose-600 to-red-700'
    }
  ];

  return (
    <section id="contact" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background Glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>GIG BOOKINGS & FAN INQUIRIES</span>
        </div>
        <h2 className="font-['Orbitron'] font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wider text-white">
          LOCK YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">DATE</span>
        </h2>
        <p className="text-gray-400 text-sm sm:text-base mt-2">
          Available for Nightclub Residencies, College Fests, Destination Weddings, Private Parties, and Arena Tours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-[#0c0c14]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_35px_rgba(0,240,255,0.15)] relative">
          <h3 className="font-['Orbitron'] font-bold text-xl text-white mb-2 flex items-center gap-2">
            <span>DIRECT MESSAGE</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm mb-6">
            Send an event inquiry or music feedback directly to DJ AS DUNGRAS.
          </p>

          {success && (
            <div className="p-4 mb-6 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Thank you! Your message has been dispatched. DJ AS DUNGRAS team will get back to you shortly.</span>
            </div>
          )}

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma / Club Event Manager"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-gray-500 transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-gray-500 transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">
                Event Details / Message *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Event location, date, expected crowd, music genre preference..."
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-gray-500 transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 text-black font-['Orbitron'] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.7)] hover:shadow-[0_0_35px_rgba(0,240,255,0.9)] hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>SEND INQUIRY TO DJ</span>
            </button>
          </form>
        </div>

        {/* Right Column: WhatsApp Contact & Social Media Grid */}
        <div className="lg:col-span-5 space-y-6">
          {/* Configurable WhatsApp Button Card */}
          <div className="bg-[#0c0c14]/90 border border-emerald-500/40 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                  <MessageCircle className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h4 className="font-['Orbitron'] font-bold text-base text-white">WHATSAPP DIRECT</h4>
                  <p className="text-xs text-emerald-400 font-mono">
                    {whatsappNumber ? `Number: ${whatsappNumber}` : 'Configurable phone connection'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPhoneConfig(!showPhoneConfig)}
                title="Configure WhatsApp Phone Number"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-300 text-xs sm:text-sm mb-4 leading-relaxed">
              Connect instantly on WhatsApp for instant booking confirmations, tour dates, and audio requests.
            </p>

            {/* Inline Config Input if opened */}
            {showPhoneConfig && (
              <form onSubmit={handleSavePhone} className="mb-4 p-3 rounded-xl bg-black/60 border border-emerald-500/30">
                <label className="block text-[11px] font-mono uppercase text-gray-300 mb-1">
                  Enter DJ WhatsApp Phone Number (with Country Code)
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={tempPhoneInput}
                    onChange={(e) => setTempPhoneInput(e.target.value)}
                    placeholder="+919876543210"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-white/20 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleWhatsAppClick}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-['Orbitron'] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>
                  {whatsappNumber ? 'CHAT ON WHATSAPP' : 'CONFIGURE & CHAT ON WHATSAPP'}
                </span>
              </button>

              <a
                href="https://www.whatsapp.com/channel/0029Vb8wjoY35fLuqfn24V3s"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-black/60 hover:bg-black/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono text-center tracking-wider transition flex items-center justify-center gap-2"
              >
                <span>JOIN OFFICIAL WHATSAPP CHANNEL</span>
                <span className="text-emerald-400">↗</span>
              </a>
            </div>
          </div>

          {/* Social Profiles List */}
          <div className="bg-[#0c0c14]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h4 className="font-['Orbitron'] font-bold text-sm text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Radio className="w-4 h-4 text-pink-400" />
              <span>OFFICIAL CHANNELS & SOCIALS</span>
            </h4>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {officialSocials.map((soc) => {
                const Icon = soc.icon;
                return (
                  <a
                    key={soc.name}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-3 rounded-xl bg-black/50 border ${soc.border} ${soc.shadow} transition-all duration-300 group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-tr ${soc.gradient} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {soc.name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {soc.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-500 group-hover:text-white transition-colors text-xs font-mono">
                      ↗
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
