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
  recordTrackDownload 
} from './firebase';
import { Track } from './types';
import { Header } from './components/Header';
import { LaserCanvas } from './components/LaserCanvas';
import { Hero } from './components/Hero';
import { MusicSection } from './components/MusicSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AudioPlayer } from './components/AudioPlayer';
import { AdminModal } from './components/AdminModal';

export default function App() {
  // Real tracks only - no fake data
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Auth & Admin State
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

  const checkAdminStatus = (currentUser: User | null) => {
    const isSessionVerified = sessionStorage.getItem('djas_admin_verified') === 'true';
    setIsAdmin(checkIsAdmin(currentUser, isSessionVerified));
  };

  // Initialize and synchronize with Firebase Firestore
  useEffect(() => {
    testConnection();

    // Listen to live tracks from Firestore
    const unsubTracks = subscribeToTracks(
      (liveTracks) => {
        setTracks(liveTracks || []);
        setCurrentTrack((prev) => {
          if (!liveTracks || liveTracks.length === 0) return null;
          if (!prev) return liveTracks[0];
          const found = liveTracks.find((t) => t.id === prev.id);
          return found || liveTracks[0];
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

    return () => {
      unsubTracks();
      unsubAuth();
    };
  }, []);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (tracks.length === 0) {
      setAdminModalOpen(true);
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

  // Audio file download handler
  const handleDownloadTrack = async (track: Track) => {
    recordTrackDownload(track.id);

    try {
      const response = await fetch(track.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const ext = track.audioUrl.endsWith('.ogg') ? '.ogg' : track.audioUrl.endsWith('.wav') ? '.wav' : '.mp3';
      const cleanTitle = track.title.replace(/[^a-zA-Z0-9\s-_()]/g, '');
      a.download = `DJ AS DUNGRAS - ${cleanTitle}${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const a = document.createElement('a');
      a.href = track.audioUrl;
      a.download = `DJ AS DUNGRAS - ${track.title}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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

  return (
    <div className="min-h-screen bg-[#07070b] text-white selection:bg-cyan-500 selection:text-black font-['Inter'] relative overflow-x-hidden">
      {/* Laser Light Beams & Club Fog Particles Canvas */}
      <LaserCanvas isPlaying={isPlaying} />

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
            } else {
              setAdminModalOpen(true);
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
        />

        {/* About DJ AS DUNGRAS Section */}
        <AboutSection isPlaying={isPlaying} />

        {/* Contact & Bookings Section */}
        <ContactSection />
      </main>

      {/* Website Footer */}
      <Footer />

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
          }
        }}
      />
    </div>
  );
}
