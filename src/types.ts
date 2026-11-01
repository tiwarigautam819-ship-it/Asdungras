export interface Track {
  id: string;
  title: string;
  artist: string;
  description?: string;
  genre: string;
  audioUrl: string;
  storagePath?: string;
  coverUrl?: string;
  duration?: number;
  fileSize?: number;
  playsCount: number;
  downloadsCount: number;
  bpm: number;
  createdAt: string;
  uploadedBy?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoop: boolean;
  isShuffle: boolean;
  playbackRate: number;
}
