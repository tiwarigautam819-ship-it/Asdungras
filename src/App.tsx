/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  testConnection, 
  subscribeToTracks, 
  checkIsAdmin, 
  logoutUser, 
  recordTrackPlay, 
  recordTrackDownload,
  deleteTrack 
} from './firebase';
import { Track } from './types';
import { retrieveAudioBlobUrl } from './audioStorage';
import { Header } from './components/Header';
import { LaserCanvas } from './components/LaserCanvas';
import { Hero } from './components/Hero';
import { MusicSection } from './components/MusicSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AudioPlayer } from './components/AudioPlayer';
import { AdminModal } from './components/AdminModal';
import { DownloadModal, DownloadState } from './components/DownloadModal';

export default function App() {
  // Real tracks only - no fake data
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Auth & Admin State
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Guaranteed In-Page Device Download State
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isOpen: false,
    track: null,
    filename: '',
    blobUrl: null,
    directUrl: '',
    progress: 0,
    status: 'fetching',
  });

  const checkAdminStatus = (currentUser: User | null) => {
    const isSessionVerified = sessionStorage.getItem('djas_admin_verified') === 'true';
    setIsAdmin(checkIsAdmin(currentUser, isSessionVerified));
  };

  // Initialize and synchronize with Firebase Firestore
  useEffect(() => {
    testConnection();

    // Listen to live tracks from Firestore
    const unsubTracks = subscribeToTracks(
      async (liveTracks) => {
        if (!liveTracks || liveTracks.length === 0) {
          setTracks([]);
          setCurrentTrack(null);
          return;
        }

        const resolvedTracks = await Promise.all(
          liveTracks.map(async (t) => {
            if (t.storagePath && t.storagePath.startsWith('track_')) {
              const cachedBlobUrl = await retrieveAudioBlobUrl(t.storagePath);
              if (cachedBlobUrl) {
                return { ...t, audioUrl: cachedBlobUrl };
              }
            }
            return t;
          })
        );

        setTracks(resolvedTracks);
        setCurrentTrack((prev) => {
          if (!prev) return resolvedTracks[0];
          const found = resolvedTracks.find((t) => t.id === prev.id);
          return found || resolvedTracks[0];
        });
      },
      (err) => {
        console.warn('Tracks fetch note:', err);
      }
    );

    // Track authentication state
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      checkAdminStatus(currentUser);
    });

    // Check session verification on mount
    checkAdminStatus(auth.currentUser);

    // Stealth Admin Trigger via secret URL hash #admin (e.g. site.com/#admin)
    if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
      setAdminModalOpen(true);
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&]admin=true/, ''));
      } catch {
        // ignore
      }
    }

    // Stealth Admin Keyboard Shortcut: Ctrl+Shift+A or Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminModalOpen((prev) => !prev);
      }
      if (isCmdOrCtrl && e.altKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setAdminModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubTracks();
      unsubAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (tracks.length === 0) {
      setDownloadToast('No tracks loaded in the vault yet.');
      setTimeout(() => setDownloadToast(null), 3000);
      return;
    }
    if (!currentTrack) {
      setCurrentTrack(tracks[0]);
      setIsPlaying(true);
      recordTrackPlay(tracks[0].id);
      return;
    }
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      recordTrackPlay(currentTrack.id);
    }
  };

  // Play specific track
  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      recordTrackPlay(track.id);
    }
  };

  // Next track
  const handleNextTrack = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setIsPlaying(true);
    recordTrackPlay(tracks[nextIndex].id);
  };

  // Previous track
  const handlePrevTrack = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
    setIsPlaying(true);
    recordTrackPlay(tracks[prevIndex].id);
  };

  // Track finished playing -> auto advance
  const handleTrackEnded = () => {
    handleNextTrack();
  };

  // In-Page Audio Download: downloads directly on the current page with multi-tier fallbacks
  const handleDownloadTrack = async (track: Track) => {
    recordTrackDownload(track.id);

    const cleanTitle = (track.title || 'Track').replace(/[^a-zA-Z0-9\s-_()]/g, '').trim() || 'Track';
    const ext = track.audioUrl.endsWith('.wav') ? '.wav' : track.audioUrl.endsWith('.ogg') ? '.ogg' : '.mp3';
    const filename = `DJ AS DUNGRAS - ${cleanTitle}${ext}`;

    // For uploaded local files, determine direct download URL
    const rawFileName = track.storagePath && !track.storagePath.startsWith('drive_')
      ? track.storagePath
      : track.audioUrl.includes('/uploads/')
      ? track.audioUrl.split('/uploads/')[1].split('?')[0]
      : '';

    const streamUrl = track.audioUrl.startsWith('blob:')
      ? track.audioUrl
      : rawFileName
      ? `/api/raw-download/${encodeURIComponent(rawFileName)}?title=${encodeURIComponent(cleanTitle)}`
      : `/api/download?url=${encodeURIComponent(track.audioUrl)}&storagePath=${encodeURIComponent(track.storagePath || '')}&title=${encodeURIComponent(cleanTitle)}`;

    // Direct synchronous download initiation within the active user click gesture
    try {
      const a = document.createElement('a');
      a.href = streamUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 2000);
    } catch (clickErr) {
      console.warn('Direct click download trigger:', clickErr);
    }

    // Case 1: Track is already an in-memory / IndexedDB blob URL
    if (track.audioUrl.startsWith('blob:')) {
      setDownloadState({
        isOpen: true,
        track,
        filename,
        blobUrl: track.audioUrl,
        directUrl: track.audioUrl,
        progress: 100,
        status: 'ready',
        fileSizeText: 'Ready',
      });
      return;
    }

    // Case 2: Universal server-assisted blob fetch & progress tracking
    setDownloadState({
      isOpen: true,
      track,
      filename,
      blobUrl: null,
      directUrl: streamUrl,
      progress: 25,
      status: 'fetching',
    });

    try {
      const res = await fetch(streamUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const contentLength = res.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      let loadedBytes = 0;
      let blob: Blob;

      if (res.body && totalBytes > 0) {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loadedBytes += value.length;
            const pct = Math.min(96, Math.round((loadedBytes / totalBytes) * 100));
            setDownloadState((prev) => ({ ...prev, progress: pct }));
          }
        }
        blob = new Blob(chunks as any, { type: 'audio/mpeg' });
      } else {
        setDownloadState((prev) => ({ ...prev, progress: 65 }));
        blob = await res.blob();
      }

      const blobSizeMB = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
      const objectUrl = window.URL.createObjectURL(blob);

      setDownloadState({
        isOpen: true,
        track,
        filename,
        blobUrl: objectUrl,
        directUrl: streamUrl,
        progress: 100,
        status: 'ready',
        fileSizeText: blobSizeMB,
      });

      // Automated client-side blob anchor click
      try {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 3000);
      } catch (e) {
        console.warn('Programmatic download trigger note:', e);
      }
    } catch (err: any) {
      console.warn('Download stream error:', err);
      setDownloadState({
        isOpen: true,
        track,
        filename,
        blobUrl: null,
        directUrl: streamUrl,
        progress: 100,
        status: 'error',
        error: err?.message || 'Server connection issue. Please use direct download link below.',
      });
    }
  };

  const scrollToMusic = () => {
    const el = document.getElementById('music');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsAdmin(false);
  };

  const handleDeleteTrack = async (track: Track) => {
    // 1. Optimistic instant UI update
    setTracks((prev) => prev.filter((t) => t.id !== track.id));
    if (currentTrack?.id === track.id) {
      setIsPlaying(false);
      const remaining = tracks.filter((t) => t.id !== track.id);
      setCurrentTrack(remaining.length > 0 ? remaining[0] : null);
    }

    try {
      await deleteTrack(track.id, track.storagePath, track.audioUrl);
      setDownloadToast(`Track "${track.title}" deleted.`);
      setTimeout(() => setDownloadToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to delete track:', err);
      let errMsg = 'Failed to delete track.';
      if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          errMsg = parsed.error || err.message;
        } catch {
          errMsg = err.message;
        }
      }
      setDownloadToast(`Delete failed: ${errMsg}`);
      setTimeout(() => setDownloadToast(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-white selection:bg-cyan-500 selection:text-black font-['Inter'] relative overflow-x-hidden">
      {/* Laser Light Beams & Club Fog Particles Canvas */}
      <LaserCanvas isPlaying={isPlaying} />

      {/* Real-time Download Toast Notification */}
      {downloadToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-black/90 border border-cyan-400 text-cyan-300 font-['Orbitron'] text-xs font-semibold tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.8)] backdrop-blur-md flex items-center gap-3 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Persistent Navigation Header */}
      <Header
        isPlaying={isPlaying}
        user={user}
        isAdmin={isAdmin}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="relative z-10">
        {/* Hero Section */}
        <Hero
          isPlaying={isPlaying}
          currentTrack={currentTrack}
          onTogglePlay={handleTogglePlay}
          onScrollToMusic={scrollToMusic}
          onDownloadFeatured={() => {
            if (currentTrack) {
              handleDownloadTrack(currentTrack);
            } else if (tracks.length > 0) {
              handleDownloadTrack(tracks[0]);
            } else {
              setDownloadToast('No tracks currently available for download.');
              setTimeout(() => setDownloadToast(null), 3000);
            }
          }}
        />

        {/* Music Library Section */}
        <MusicSection
          tracks={tracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={handlePlayTrack}
          onDownloadTrack={handleDownloadTrack}
          onOpenUpload={() => setAdminModalOpen(true)}
          isAdmin={isAdmin}
          onDeleteTrack={handleDeleteTrack}
        />

        {/* About DJ AS DUNGRAS Section */}
        <AboutSection isPlaying={isPlaying} />

        {/* Contact & Bookings Section */}
        <ContactSection />
      </main>

      {/* Website Footer with stealth admin trigger */}
      <Footer onSecretAdminTrigger={() => setAdminModalOpen(true)} />

      {/* Sticky Bottom Audio Player Bar */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onDownload={handleDownloadTrack}
        onEnded={handleTrackEnded}
      />

      {/* Admin Dashboard & Upload Modal */}
      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        user={user}
        isAdmin={isAdmin}
        tracks={tracks}
        onAdminVerified={() => checkAdminStatus(auth.currentUser)}
        onTrackDeleted={(trackId) => {
          setTracks((prev) => prev.filter((t) => t.id !== trackId));
          if (currentTrack?.id === trackId) {
            setIsPlaying(false);
            const remaining = tracks.filter((t) => t.id !== trackId);
            setCurrentTrack(remaining.length > 0 ? remaining[0] : null);
          }
        }}
      />

      {/* Guaranteed In-Page Device Download Modal */}
      <DownloadModal
        state={downloadState}
        onClose={() => setDownloadState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
