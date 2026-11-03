/**
 * Utilities for Google Drive link parsing and audio extraction
 */

export function extractDriveFileId(inputUrl: string): string | null {
  if (!inputUrl) return null;
  const url = inputUrl.trim();

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];

  // Pattern 3: https://drive.google.com/uc?id=FILE_ID
  const match3 = url.match(/\/uc\?id=([a-zA-Z0-9_-]+)/);
  if (match3 && match3[1]) return match3[1];

  // Pattern 4: Bare file ID if user pasted just the ID (typically 25-45 characters alphanumeric)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(url)) {
    return url;
  }

  return null;
}

export function convertDriveToStreamUrl(inputUrl: string): string {
  const fileId = extractDriveFileId(inputUrl);
  if (fileId) {
    return `/api/drive-stream/${fileId}`;
  }
  return inputUrl.trim();
}

export function getTrackDownloadFilename(title: string, audioUrl: string): string {
  const cleanTitle = (title || 'Track').replace(/[^a-zA-Z0-9\s-_()]/g, '').trim() || 'Track';
  const ext = audioUrl && audioUrl.endsWith('.wav') ? '.wav' : audioUrl && audioUrl.endsWith('.ogg') ? '.ogg' : '.mp3';
  return `DJ AS DUNGRAS - ${cleanTitle}${ext}`;
}

export function getTrackDownloadUrl(audioUrl: string, title: string): string {
  if (!audioUrl) return '#';
  if (audioUrl.startsWith('blob:')) return audioUrl;
  const cleanTitle = (title || 'Track').replace(/[^a-zA-Z0-9\s-_()]/g, '').trim() || 'Track';
  return `/api/download?url=${encodeURIComponent(audioUrl)}&title=${encodeURIComponent(cleanTitle)}`;
}
