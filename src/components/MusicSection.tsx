import React, { useState, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Music2, 
  Search, 
  Headphones, 
  Clock, 
  Disc, 
  Activity, 
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import { Track } from '../types';

interface MusicSectionProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
  onOpenUpload: () => void;
  isAdmin: boolean;
}

export const MusicSection: React.FC<MusicSectionProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onDownloadTrack,
  onOpenUpload,
  isAdmin
}) => {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const genres = ['All', 'Club EDM', 'Desi Dhol Bass', 'Bollywood Remix', 'Electro House', 'Festival Trap'];

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchesGenre = selectedGenre === 'All' || track.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      const matchesSearch =
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (track.description && track.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesGenre && matchesSearch;
    });
  }, [tracks, selectedGenre, searchQuery]);

  const handleShare = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + '#music');
    setCopiedId(track.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '3:20';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <section id="music" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono mb-3">
            <Music2 className="w-3.5 h-3.5" />
            <span>DISCOGRAPHY & RELEASES</span>
          </div>
          <h2 className="font-['Orbitron'] font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wider text-white">
            MUSIC <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">VAULT</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
            Stream exclusive DJ club edits, heavy bassline bootlegs, and festival anthems. 
            All tracks mastered for maximum sound pressure and club speakers.
          </p>
        </div>

        {/* Action button: Upload new audio */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-['Orbitron'] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,128,0.5)] hover:shadow-[0_0_30px_rgba(255,0,128,0.8)] transition-all hover:scale-105 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>{isAdmin ? 'UPLOAD NEW TRACK' : 'SUBMIT / UPLOAD AUDIO'}</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-8 pb-4 border-b border-white/10">
        {/* Genre Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cyan-500/30">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                selectedGenre === genre
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                  : 'bg-black/60 text-gray-400 hover:text-white border border-white/10 hover:border-cyan-500/30'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px] sm:min-w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks, remixes, genre..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-sm text-gray-200 placeholder-gray-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tracks Grid or Empty Vault State */}
      {filteredTracks.length === 0 ? (
        <div className="py-20 px-4 text-center bg-black/40 rounded-3xl border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Disc className="w-8 h-8 animate-spin [animation-duration:8s]" />
          </div>
          <h3 className="font-['Orbitron'] font-black text-xl sm:text-2xl text-white uppercase tracking-wider mb-2">
            MUSIC VAULT IS READY
          </h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            All fake data removed. The music library is clean and awaiting genuine audio tracks from DJ AS DUNGRAS.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-['Orbitron'] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.7)] hover:shadow-[0_0_30px_rgba(0,240,255,0.9)] hover:scale-105 active:scale-95 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD REAL AUDIO (MP3 / WAV)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                className={`group relative rounded-2xl bg-[#0d0d14]/90 border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isCurrentPlaying
                    ? 'border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.35)] scale-[1.01]'
                    : 'border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                }`}
              >
                {/* Neon Header Accent line */}
                <div
                  className={`h-1 w-full bg-gradient-to-r ${
                    isCurrentPlaying
                      ? 'from-cyan-400 via-purple-500 to-pink-500'
                      : 'from-transparent via-cyan-500/30 to-transparent group-hover:from-cyan-400 group-hover:via-purple-500 group-hover:to-pink-500'
                  } transition-all duration-500`}
                />

                <div className="p-5">
                  {/* Cover Art and Play Overlay */}
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-black/80 border border-white/10">
                    <img
                      src={
                        track.coverUrl ||
                        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={track.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        isCurrentPlaying ? 'scale-105' : 'group-hover:scale-105'
                      }`}
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    {/* BPM and Genre Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-black/80 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold shadow-md flex items-center gap-1 backdrop-blur-sm">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        {track.bpm} BPM
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                        {track.genre}
                      </span>
                    </div>

                    {/* Center Play Button Overlay */}
                    <button
                      onClick={() => onPlayTrack(track)}
                      className={`absolute inset-0 m-auto w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrentPlaying
                          ? 'bg-gradient-to-tr from-cyan-400 to-pink-500 text-black shadow-[0_0_25px_rgba(0,240,255,0.9)] scale-100'
                          : 'bg-black/60 hover:bg-gradient-to-tr hover:from-cyan-400 hover:to-pink-500 text-white hover:text-black border border-white/30 hover:border-cyan-300 shadow-lg scale-90 group-hover:scale-100'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-1" />
                      )}
                    </button>

                    {/* Playing animated equalizer overlay on cover art */}
                    {isCurrentPlaying && (
                      <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between h-4 px-2 bg-black/60 rounded-md backdrop-blur-sm">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                          NOW STREAMING
                        </span>
                        <div className="flex items-end gap-1 h-3">
                          <span className="w-1 bg-cyan-400 animate-pulse h-full" />
                          <span className="w-1 bg-purple-400 animate-pulse [animation-delay:150ms] h-2" />
                          <span className="w-1 bg-pink-400 animate-pulse [animation-delay:300ms] h-3" />
                          <span className="w-1 bg-emerald-400 animate-pulse [animation-delay:75ms] h-1.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="mb-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {track.title}
                    </h3>
                    <p className="text-gray-400 text-xs font-mono mt-0.5">{track.artist}</p>

                    {track.description && (
                      <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {track.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Stats */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-cyan-400/80">
                        <Headphones className="w-3 h-3" />
                        {track.playsCount.toLocaleString()} plays
                      </span>
                      <span className="flex items-center gap-1 text-pink-400/80">
                        <Clock className="w-3 h-3" />
                        {formatDuration(track.duration)}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-gray-500">
                      <Download className="w-3 h-3 text-emerald-400/80" />
                      {track.downloadsCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="px-5 py-3.5 bg-black/40 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="flex-1 py-2 px-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-['Orbitron'] font-semibold tracking-wider transition flex items-center justify-center gap-1.5"
                  >
                    {isCurrentPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isCurrentPlaying ? 'PAUSE' : 'PLAY'}</span>
                  </button>

                  {/* Real Download Button */}
                  <button
                    onClick={() => onDownloadTrack(track)}
                    title="Download high quality audio"
                    className="py-2 px-3.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/40 hover:border-pink-400 text-pink-300 hover:text-pink-200 text-xs font-['Orbitron'] font-semibold tracking-wider transition shadow-[0_0_10px_rgba(255,0,128,0.2)] hover:shadow-[0_0_15px_rgba(255,0,128,0.5)] flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-pink-400" />
                    <span>DOWNLOAD</span>
                  </button>

                  {/* Quick Share Link */}
                  <button
                    onClick={(e) => handleShare(track, e)}
                    title="Copy share link"
                    className="p-2 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition"
                  >
                    {copiedId === track.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
