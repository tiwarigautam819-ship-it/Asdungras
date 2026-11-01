import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Shield, 
  LogIn, 
  LogOut, 
  Music, 
  FileAudio, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  MessageSquare,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  loginWithGoogle, 
  loginWithAdminCredentials,
  logoutUser, 
  ADMIN_EMAILS, 
  uploadMediaFile, 
  addTrack, 
  deleteTrack,
  subscribeToMessages 
} from '../firebase';
import { Track, ContactMessage } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  tracks: Track[];
  onAdminVerified?: () => void;
  onTrackDeleted?: (trackId: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  user,
  isAdmin,
  tracks,
  onAdminVerified,
  onTrackDeleted
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'messages'>('upload');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('tiwarigautam819@gmail.com');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('DJ AS DUNGRAS');
  const [genre, setGenre] = useState('Club EDM');
  const [bpm, setBpm] = useState<number>(128);
  const [description, setDescription] = useState('');
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [directAudioUrl, setDirectAudioUrl] = useState('');
  const [audioDuration, setAudioDuration] = useState<number>(180);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrlPreset, setCoverUrlPreset] = useState('');

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cover image presets
  const coverPresets = [
    { name: 'Neon Laser Stage', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80' },
    { name: 'Festival Beats', url: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=800&q=80' },
    { name: 'Club Bass Arena', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cyberpunk Synthesizer', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
  ];

  // Subscribe to messages when messages tab is active
  useEffect(() => {
    if (isAdmin && activeTab === 'messages') {
      const unsub = subscribeToMessages(
        (msgs) => setMessages(msgs),
        (err) => console.warn('Messages subscription notice:', err)
      );
      return () => unsub();
    }
  }, [isAdmin, activeTab]);

  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setStatusMessage(null);
    try {
      await loginWithAdminCredentials(loginEmail, loginPass);
      sessionStorage.setItem('djas_admin_verified', 'true');
      sessionStorage.setItem('djas_admin_email', loginEmail.trim());
      if (onAdminVerified) onAdminVerified();
      setStatusMessage({
        type: 'success',
        text: `Welcome DJ AS DUNGRAS! Authenticated as ${loginEmail}`
      });
      setLoginPass('');
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid credentials. Please verify email and password.'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setStatusMessage(null);
    try {
      await loginWithGoogle();
      if (onAdminVerified) onAdminVerified();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Google login failed.'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      sessionStorage.removeItem('djas_admin_verified');
      sessionStorage.removeItem('djas_admin_email');
      if (onAdminVerified) onAdminVerified();
      setStatusMessage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setDirectAudioUrl('');
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
      try {
        const url = URL.createObjectURL(file);
        const tempAudio = new Audio(url);
        tempAudio.onloadedmetadata = () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration)) {
            setAudioDuration(Math.round(tempAudio.duration));
          }
        };
      } catch (err) {
        // ignore
      }
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
      setCoverUrlPreset('');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile && !directAudioUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Please select an audio file (MP3, WAV, etc.) or enter an audio stream URL.' });
      return;
    }
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a song title.' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setStatusMessage(null);

    try {
      let finalAudioUrl = directAudioUrl.trim();
      let audioStoragePath: string | undefined;

      // 1. Upload audio file if selected
      if (audioFile) {
        const audioResult = await uploadMediaFile(audioFile, 'audio', (prog) => {
          setUploadProgress(10 + prog * 0.5);
        });
        finalAudioUrl = audioResult.url;
        audioStoragePath = audioResult.storagePath;
      }

      // 2. Upload cover artwork if custom file chosen
      let finalCoverUrl = coverUrlPreset || coverPresets[0].url;
      let coverStoragePath: string | undefined;

      if (coverFile) {
        const coverResult = await uploadMediaFile(coverFile, 'covers', (prog) => {
          setUploadProgress(60 + prog * 0.3);
        });
        finalCoverUrl = coverResult.url;
        coverStoragePath = coverResult.storagePath;
      }

      setUploadProgress(95);

      // 3. Save track to Firestore
      await addTrack({
        title: title.trim(),
        artist: artist.trim() || 'DJ AS DUNGRAS',
        genre: genre.trim() || 'Club EDM',
        bpm: Number(bpm) || 128,
        description: description.trim(),
        audioUrl: finalAudioUrl,
        storagePath: audioStoragePath || coverStoragePath,
        coverUrl: finalCoverUrl,
        duration: audioDuration || 180,
        fileSize: audioFile ? audioFile.size : 5000000,
        playsCount: 0,
        downloadsCount: 0,
        createdAt: new Date().toISOString(),
        uploadedBy: user?.email || loginEmail || 'tiwarigautam819@gmail.com'
      });

      setUploadProgress(100);
      setStatusMessage({
        type: 'success',
        text: `Track "${title}" successfully uploaded and published to the live music vault!`
      });

      // Reset form
      setTitle('');
      setDescription('');
      setAudioFile(null);
      setDirectAudioUrl('');
      setCoverFile(null);
      setCoverUrlPreset('');
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed. Check file size or format.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (track: Track) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${track.title}"?`)) {
      return;
    }

    setDeletingId(track.id);
    try {
      await deleteTrack(track.id, track.storagePath);
      if (onTrackDeleted) onTrackDeleted(track.id);
      setStatusMessage({ type: 'success', text: `Track "${track.title}" deleted.` });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete track.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0c0c14] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 text-black shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Orbitron'] font-black text-lg text-white tracking-wider flex items-center gap-2">
                DJ AS DUNGRAS <span className="text-cyan-400">ADMIN CONSOLE</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Admin: {ADMIN_EMAILS[0]}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`px-6 py-3 text-xs flex items-center gap-2 font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/80 border-b border-red-500/40 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Auth Check View */}
        {!isAdmin ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center my-auto overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 mb-4 shadow-[0_0_20px_rgba(0,240,255,0.6)]">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <Lock className="w-7 h-7 text-cyan-400" />
              </div>
            </div>

            <h4 className="font-['Orbitron'] font-bold text-xl text-white mb-1">
              ADMINISTRATOR LOGIN
            </h4>
            <p className="text-gray-400 text-xs sm:text-sm max-w-md text-center mb-6">
              Enter your official DJ credentials to access audio uploads and library controls.
            </p>

            {/* Email & Password Login Form */}
            <form onSubmit={handleAdminPasswordLogin} className="w-full max-w-sm space-y-4 mb-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tiwarigautam819@gmail.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/70 border border-white/20 focus:border-cyan-400 focus:outline-none text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-black/70 border border-white/20 focus:border-cyan-400 focus:outline-none text-sm text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-['Orbitron'] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.7)] hover:shadow-[0_0_30px_rgba(0,240,255,0.9)] hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>AUTHENTICATE & ENTER CONSOLE</span>
              </button>
            </form>

            <div className="w-full max-w-sm flex items-center gap-3 my-2 text-xs text-gray-500">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span>OR</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            {/* Google Sign-in Alternative */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full max-w-sm py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google Account</span>
            </button>
          </div>
        ) : (
          /* Authenticated Admin Console */
          <>
            <div className="flex border-b border-white/10 bg-black/40 px-6 pt-2">
              {[
                { id: 'upload', label: 'Upload Audio', icon: Upload },
                { id: 'manage', label: `Music Vault (${tracks.length})`, icon: Music },
                { id: 'messages', label: `Inquiries (${messages.length})`, icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-['Orbitron'] text-xs font-semibold uppercase tracking-wider transition ${
                      active
                        ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <div className="ml-auto flex items-center gap-2 py-2 text-xs text-cyan-400/90 font-mono">
                <span className="hidden sm:inline">
                  {user?.email || sessionStorage.getItem('djas_admin_email') || ADMIN_EMAILS[0]}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded bg-red-950/40 text-red-400 hover:bg-red-900/50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* TAB 1: UPLOAD AUDIO */}
              {activeTab === 'upload' && (
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                        Song / Remix Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Desi Bass Anthem"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                        Artist / Remixer
                      </label>
                      <input
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="DJ AS DUNGRAS"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                        Music Genre
                      </label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-sm text-white"
                      >
                        <option value="Club EDM">Club EDM</option>
                        <option value="Desi Dhol Bass">Desi Dhol Bass</option>
                        <option value="Bollywood Remix">Bollywood Remix</option>
                        <option value="Electro House">Electro House</option>
                        <option value="Festival Trap">Festival Trap</option>
                        <option value="Hard Dance">Hard Dance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                        Tempo (BPM)
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="200"
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                      Description & Notes
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Track notes or drop details..."
                      className="w-full px-4 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-sm text-white"
                    />
                  </div>

                  {/* Audio File or URL Input */}
                  <div className="p-4 rounded-xl border border-dashed border-cyan-500/50 bg-cyan-950/10 space-y-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-cyan-300 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileAudio className="w-4 h-4 text-cyan-400" />
                          <span>1. Select Audio File (MP3, WAV, OGG, M4A)</span>
                        </span>
                        {audioFile && (
                          <span className="text-emerald-400 text-[11px] font-bold">
                            ✓ READY ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        )}
                      </label>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a"
                        onChange={handleAudioFileChange}
                        className="block w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 file:cursor-pointer cursor-pointer"
                      />
                      {audioFile && (
                        <p className="mt-1.5 text-xs text-cyan-300 font-mono">
                          Selected: {audioFile.name} • Duration: ~{audioDuration}s
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                        OR 2. Paste Direct Audio URL (Optional alternative)
                      </label>
                      <input
                        type="url"
                        value={directAudioUrl}
                        onChange={(e) => {
                          setDirectAudioUrl(e.target.value);
                          if (e.target.value) setAudioFile(null);
                        }}
                        placeholder="https://example.com/track.mp3"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Cover Artwork */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-300 mb-2 flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-pink-400" />
                      <span>Cover Artwork</span>
                    </label>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-400 file:cursor-pointer cursor-pointer mb-3"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {coverPresets.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setCoverUrlPreset(preset.url);
                            setCoverFile(null);
                          }}
                          className={`relative aspect-video rounded-lg overflow-hidden border text-left transition ${
                            coverUrlPreset === preset.url
                              ? 'border-cyan-400 ring-2 ring-cyan-400'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          <span className="absolute inset-x-0 bottom-0 p-1 bg-black/70 text-[9px] text-white truncate">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {isUploading && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-cyan-300">
                        <span>Uploading Audio to Cloud...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-black font-['Orbitron'] font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.6)] hover:shadow-[0_0_30px_rgba(0,240,255,0.9)] hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>SAVING TRACK TO CLOUD STORAGE...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>PUBLISH REAL AUDIO TRACK</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: MANAGE TRACKS */}
              {activeTab === 'manage' && (
                <div className="space-y-3">
                  {tracks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Music className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="font-['Orbitron'] text-sm text-gray-400">Music Vault is empty</p>
                      <p className="text-xs text-gray-500 mt-1">Upload your first audio track to start the library.</p>
                    </div>
                  ) : (
                    tracks.map((track) => (
                      <div
                        key={track.id}
                        className="p-3.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={track.coverUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'}
                            alt={track.title}
                            className="w-12 h-12 rounded-lg object-cover border border-white/10"
                          />
                          <div className="min-w-0">
                            <h5 className="font-['Orbitron'] font-bold text-sm text-white truncate">
                              {track.title}
                            </h5>
                            <p className="text-xs text-gray-400 font-mono">
                              {track.genre} • {track.bpm} BPM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={track.audioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400"
                            title="Direct audio link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(track)}
                            disabled={deletingId === track.id}
                            className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 transition disabled:opacity-50"
                            title="Delete track"
                          >
                            {deletingId === track.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: CONTACT INQUIRIES */}
              {activeTab === 'messages' && (
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No contact messages yet.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-cyan-300 font-['Orbitron']">{msg.name}</span>
                          <span className="text-gray-500 font-mono">
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">Email: {msg.email}</p>
                        <p className="text-sm text-gray-200 bg-white/5 p-2.5 rounded-lg border border-white/5">
                          {msg.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
