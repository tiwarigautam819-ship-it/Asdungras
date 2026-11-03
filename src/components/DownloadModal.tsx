import React, { useState } from 'react';
import { Download, CheckCircle2, Music, Share2, X, ExternalLink, Loader2, Sparkles, Smartphone } from 'lucide-react';
import { Track } from '../types';

export interface DownloadState {
  isOpen: boolean;
  track: Track | null;
  filename: string;
  blobUrl: string | null;
  directUrl: string;
  progress: number;
  status: 'fetching' | 'ready' | 'error';
  fileSizeText?: string;
  error?: string;
}

interface DownloadModalProps {
  state: DownloadState;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ state, onClose }) => {
  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);
  const [shared, setShared] = useState<boolean>(false);

  if (!state.isOpen || !state.track) return null;

  const canShareFiles = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare;

  const handleShareToDevice = async () => {
    if (!state.blobUrl || !state.track) return;
    try {
      const response = await fetch(state.blobUrl);
      const blob = await response.blob();
      const file = new File([blob], state.filename, { type: 'audio/mpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: state.filename,
          text: `Download & listen to ${state.track.title} by DJ AS DUNGRAS`,
        });
        setShared(true);
        setTimeout(() => setShared(false), 4000);
      }
    } catch (err) {
      console.warn('Native share not completed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0c0d14] border-2 border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.3)] overflow-hidden">
        {/* Top glowing neon beam */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 shadow-[0_0_15px_rgba(0,240,255,0.8)]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Close download window"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-['Orbitron'] font-bold tracking-widest text-emerald-400 uppercase">
            HIGH QUALITY AUDIO DOWNLOAD
          </span>
        </div>

        {/* Track Info Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/50 border border-white/10 mb-6">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gradient-to-tr from-cyan-900 to-pink-900 border border-cyan-500/30 shrink-0 flex items-center justify-center">
            <img
              src={state.track.coverUrl || '/assets/aistudio/IMG-20261102-WA0001_2da96bcd.jpg'}
              alt={state.track.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-['Orbitron'] font-bold text-white text-base sm:text-lg truncate">
              {state.track.title}
            </h3>
            <p className="text-gray-400 text-xs font-mono truncate">{state.track.artist}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
                MP3 320 KBPS
              </span>
              {state.fileSizeText && (
                <span className="text-[10px] text-gray-400 font-mono">{state.fileSizeText}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status / Progress State */}
        {state.status === 'fetching' && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300 mb-1">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Preparing audio stream...
              </span>
              <span>{Math.round(state.progress)}%</span>
            </div>
            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.8)]"
                style={{ width: `${Math.max(5, state.progress)}%` }}
              />
            </div>

            {/* Instant Direct Download Button during fetching */}
            <a
              href={state.directUrl}
              download={state.filename}
              onClick={() => {
                setDownloadTriggered(true);
                setTimeout(() => setDownloadTriggered(false), 5000);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-400/60 text-cyan-300 text-xs font-['Orbitron'] font-semibold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition cursor-pointer text-center"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>{downloadTriggered ? '✓ STARTING DOWNLOAD...' : 'CLICK TO SAVE FILE DIRECTLY'}</span>
            </a>
          </div>
        )}

        {state.status === 'ready' && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold">Audio Ready For Download!</p>
                <p className="text-[11px] text-emerald-400/80">
                  Tap below to save the official MP3 to your mobile phone or PC.
                </p>
              </div>
            </div>

            {/* Guaranteed Direct Save Button */}
            <a
              href={state.directUrl}
              download={state.filename}
              onClick={() => {
                setDownloadTriggered(true);
                if (state.blobUrl) {
                  try {
                    const a = document.createElement('a');
                    a.href = state.blobUrl;
                    a.download = state.filename;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      if (document.body.contains(a)) document.body.removeChild(a);
                    }, 1000);
                  } catch {
                    // ignore
                  }
                }
                setTimeout(() => setDownloadTriggered(false), 5000);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500 text-black font-['Orbitron'] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(0,240,255,0.7)] hover:shadow-[0_0_35px_rgba(0,240,255,0.9)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer text-center"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>{downloadTriggered ? '✓ DOWNLOADING TO DEVICE...' : 'TAP TO SAVE FILE / DOWNLOAD MP3'}</span>
            </a>

            {/* Mobile Native Share / Save Action */}
            {canShareFiles && (
              <button
                onClick={handleShareToDevice}
                className="w-full py-3 px-4 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 hover:border-purple-400 text-purple-300 text-xs font-['Orbitron'] font-semibold tracking-wider flex items-center justify-center gap-2 transition"
              >
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>{shared ? '✓ SHARED!' : 'SAVE VIA PHONE STORAGE / SHARE'}</span>
              </button>
            )}

            {/* Direct Link Fallback */}
            <div className="text-center pt-2">
              <a
                href={state.directUrl}
                download={state.filename}
                className="text-[11px] text-gray-400 hover:text-cyan-300 underline underline-offset-4 font-mono inline-flex items-center gap-1 transition"
              >
                <span>Direct download link (same page)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {state.status === 'error' && (
          <div className="mb-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
              <p className="font-semibold mb-1">Download Stream Note</p>
              <p className="text-[11px] text-rose-300/80">
                {state.error || 'Server responded, you can use the direct link below.'}
              </p>
            </div>

            <a
              href={state.directUrl}
              download={state.filename}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-['Orbitron'] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,128,0.5)] transition text-center"
            >
              <Download className="w-4 h-4" />
              <span>DIRECT DOWNLOAD LINK</span>
            </a>
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <span>DJ AS DUNGRAS OFFICIAL</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition px-2 py-1 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
