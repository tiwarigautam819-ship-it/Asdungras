import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Target audio storage directories to ensure survival across dev and production containers
const uploadsDir = path.resolve(process.cwd(), 'uploads');
const publicUploadsDir = path.resolve(process.cwd(), 'public/uploads');
const distUploadsDir = path.resolve(process.cwd(), 'dist/uploads');

[uploadsDir, publicUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // 150MB limit
  },
});

app.use(express.json());

// Helper function to find audio file across all candidate directories
function findAudioFile(filename: string): string | null {
  if (!filename) return null;
  const safeName = path.basename(filename.split('?')[0]);
  const candidateDirs = [uploadsDir, publicUploadsDir, distUploadsDir];

  for (const dir of candidateDirs) {
    const fullPath = path.join(dir, safeName);
    if (fs.existsSync(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > 1000) {
          return fullPath;
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

// Helper function to persist audio file across all storage locations
async function saveAudioToAllUploads(filename: string, buffer: Buffer): Promise<void> {
  const safeName = path.basename(filename);
  const targets = [uploadsDir, publicUploadsDir, distUploadsDir];
  for (const dir of targets) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const targetPath = path.join(dir, safeName);
      await fs.promises.writeFile(targetPath, buffer);
    } catch (e) {
      // ignore
    }
  }
}

// Serve uploaded audio files with strict 404s and 206 Range partial content support
app.get('/uploads/:filename', (req: Request, res: Response): void => {
  const filename = req.params.filename;
  const filePath = findAudioFile(filename);

  if (filePath && fs.existsSync(filePath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    } else if (filePath.endsWith('.ogg')) {
      res.setHeader('Content-Type', 'audio/ogg');
    } else if (filePath.endsWith('.m4a')) {
      res.setHeader('Content-Type', 'audio/mp4');
    } else {
      res.setHeader('Content-Type', 'audio/mpeg');
    }

    res.sendFile(filePath, { acceptRanges: true });
    return;
  }

  // CRITICAL: Return 404 JSON for missing audio, NEVER fall through to HTML index.html
  res.status(404).json({ error: 'Audio file not found on server' });
});

// Upload API endpoint: saves to uploadsDir and syncs to public/uploads
app.post('/api/upload', (req: Request, res: Response): void => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      console.error('Upload middleware error:', err);
      res.status(400).json({ error: err.message || 'File upload error' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file provided in request' });
      return;
    }

    // Mirror to public/uploads and dist/uploads to survive rebuilds & shared hosting
    try {
      const srcPath = path.join(uploadsDir, req.file.filename);
      const publicPath = path.join(publicUploadsDir, req.file.filename);
      await fs.promises.copyFile(srcPath, publicPath);

      if (fs.existsSync(distUploadsDir)) {
        const distPath = path.join(distUploadsDir, req.file.filename);
        await fs.promises.copyFile(srcPath, distPath);
      }
    } catch (copyErr) {
      console.warn('Upload mirror note:', copyErr);
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

// Delete uploaded file endpoint to support physical cleanup on track deletion
app.post('/api/delete-file', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, url } = req.body || {};
    let targetFile = filename;
    if (!targetFile && url && typeof url === 'string' && url.includes('/uploads/')) {
      targetFile = url.split('/uploads/').pop()?.split('?')[0];
    }
    if (targetFile) {
      const safeName = path.basename(targetFile);
      const targets = [uploadsDir, publicUploadsDir, distUploadsDir];
      for (const dir of targets) {
        const filePath = path.join(dir, safeName);
        if (fs.existsSync(filePath)) {
          try {
            await fs.promises.unlink(filePath);
          } catch {
            // ignore
          }
        }
      }
      console.log(`Deleted uploaded file across storage: ${safeName}`);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.warn('File deletion error:', err?.message);
    res.status(200).json({ success: false, error: err?.message });
  }
});

// Helper function to resolve or download Google Drive file into uploads cache
async function getOrFetchDriveFile(fileId: string): Promise<string | null> {
  const cachedFilename = `drive_${fileId}.mp3`;
  const existingPath = findAudioFile(cachedFilename);
  if (existingPath) {
    return existingPath;
  }

  // Fetch from Google Drive with redirect follow
  try {
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const res = await fetch(driveUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      // Verify it's real binary audio (greater than 2KB, not an HTML error)
      if (arrayBuf.byteLength > 2000) {
        const buffer = Buffer.from(arrayBuf);
        await saveAudioToAllUploads(cachedFilename, buffer);
        return path.join(uploadsDir, cachedFilename);
      }
    }
  } catch (err) {
    console.error('Error fetching Google Drive file:', err);
  }

  return null;
}

// Google Drive Stream Proxy endpoint: streams audio for player and visualizer with Range support
app.get('/api/drive-stream/:id', async (req: Request, res: Response): Promise<void> => {
  const fileId = req.params.id;
  if (!fileId) {
    res.status(400).json({ error: 'File ID required' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  // 1. Check if already cached in any uploads folder
  const cachedFilename = `drive_${fileId}.mp3`;
  const existingLocalPath = findAudioFile(cachedFilename);
  if (existingLocalPath && fs.existsSync(existingLocalPath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(existingLocalPath, { acceptRanges: true });
    return;
  }

  // 2. Fetch directly from Google Drive stream without redirecting the browser
  // (Direct 302 redirect triggers Cross-Origin-Resource-Policy same-site block in browser audio elements)
  try {
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const fetchHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    };
    if (req.headers.range) {
      fetchHeaders['Range'] = req.headers.range as string;
    }

    const driveRes = await fetch(driveUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    if (driveRes.ok) {
      res.status(driveRes.status);
      res.setHeader('Content-Type', 'audio/mpeg');
      const cLength = driveRes.headers.get('content-length');
      if (cLength) res.setHeader('Content-Length', cLength);
      const cRange = driveRes.headers.get('content-range');
      if (cRange) res.setHeader('Content-Range', cRange);
      res.setHeader('Accept-Ranges', 'bytes');

      const arrayBuf = await driveRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      res.send(buffer);

      // Save complete file to local caches for subsequent instant requests
      if (!req.headers.range && buffer.byteLength > 2000) {
        saveAudioToAllUploads(cachedFilename, buffer).catch((err) =>
          console.warn('Async cache note:', err)
        );
      }
      return;
    }
  } catch (err) {
    console.error('Error proxying Drive stream:', err);
  }

  res.status(502).json({ error: 'Unable to stream audio from Google Drive' });
});

app.options('/api/download', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.status(200).end();
});

// Direct raw download endpoint for uploaded audio files
app.get('/api/raw-download/:filename', (req: Request, res: Response): void => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');

  const filename = path.basename(req.params.filename || '');
  const localPath = findAudioFile(filename);

  if (localPath && fs.existsSync(localPath)) {
    const stat = fs.statSync(localPath);
    const safeTitle = (req.query.title as string) || filename;
    const cleanTitle = safeTitle.replace(/[^a-zA-Z0-9\s-_()]/g, '').trim() || 'Track';
    const downloadName = cleanTitle.endsWith('.mp3') ? cleanTitle : `DJ AS DUNGRAS - ${cleanTitle}.mp3`;
    const encodedName = encodeURIComponent(downloadName);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${downloadName}"; filename*=UTF-8''${encodedName}`
    );
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const stream = fs.createReadStream(localPath);
    stream.pipe(res);
  } else {
    res.status(404).json({ error: 'Audio file not found on server' });
  }
});

// In-Page Universal Audio Downloader endpoint: Downloads on the same page with Attachment headers
app.get('/api/download', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');

  const targetUrl = (req.query.url as string) || '';
  const storagePath = (req.query.storagePath as string) || '';
  const trackTitle = (req.query.title as string) || 'Audio Track';
  const cleanTitle = trackTitle.replace(/[^a-zA-Z0-9\s-_()]/g, '').trim() || 'Track';
  const filename = cleanTitle.endsWith('.mp3') ? `DJ AS DUNGRAS - ${cleanTitle}` : `DJ AS DUNGRAS - ${cleanTitle}.mp3`;
  const encodedName = encodeURIComponent(filename);

  // 1. Resolve local uploads file (uploaded from device)
  const candidateNames: string[] = [];
  if (storagePath) {
    candidateNames.push(path.basename(storagePath.split('?')[0]));
  }
  if (targetUrl) {
    if (targetUrl.includes('/uploads/')) {
      const part = targetUrl.split('/uploads/')[1].split('?')[0];
      candidateNames.push(path.basename(part));
    }
    const base = path.basename(targetUrl.split('?')[0]);
    if (base && !base.startsWith('http') && !base.includes('/')) {
      candidateNames.push(base);
    }
  }

  for (const candidate of candidateNames) {
    if (!candidate) continue;
    const localPath = findAudioFile(candidate);
    if (localPath && fs.existsSync(localPath)) {
      const stat = fs.statSync(localPath);
      if (stat.size > 0) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', stat.size);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`
        );
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const stream = fs.createReadStream(localPath);
        stream.pipe(res);
        return;
      }
    }
  }

  if (!targetUrl && !storagePath) {
    res.status(400).json({ error: 'Missing url or storagePath parameter' });
    return;
  }

  // 2. Google Drive stream link or ID
  const driveMatch =
    targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    targetUrl.match(/\/api\/drive-stream\/([a-zA-Z0-9_-]+)/) ||
    (storagePath && storagePath.startsWith('drive_') ? [, storagePath.replace('drive_', '')] : null);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    const localPath = await getOrFetchDriveFile(fileId);
    if (localPath && fs.existsSync(localPath)) {
      const stat = fs.statSync(localPath);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', stat.size);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`
      );
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const stream = fs.createReadStream(localPath);
      stream.pipe(res);
      return;
    }

    // Direct proxy streaming with attachment header
    try {
      const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const driveRes = await fetch(driveUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });
      if (driveRes.ok) {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`
        );
        res.setHeader('Content-Type', 'audio/mpeg');
        const cLength = driveRes.headers.get('content-length');
        if (cLength) res.setHeader('Content-Length', cLength);
        const arrayBuf = await driveRes.arrayBuffer();
        res.send(Buffer.from(arrayBuf));
        return;
      }
    } catch (e) {
      console.warn('Fallback stream note:', e);
    }

    res.status(502).json({ error: 'Failed to retrieve Drive audio for download' });
    return;
  }

  // 3. Fallback remote stream
  try {
    const remoteRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`
    );
    res.setHeader('Content-Type', remoteRes.headers.get('content-type') || 'audio/mpeg');
    const cLength = remoteRes.headers.get('content-length');
    if (cLength) {
      res.setHeader('Content-Length', cLength);
    }

    const arrayBuf = await remoteRes.arrayBuffer();
    res.send(Buffer.from(arrayBuf));
  } catch (err) {
    console.error('Download proxy error:', err);
    res.status(500).json({ error: 'Download proxy failed' });
  }
});

// Explicit 404 for unrecognized API routes so they NEVER fall through to index.html
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Vite Middleware for Development / Static files for Production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
