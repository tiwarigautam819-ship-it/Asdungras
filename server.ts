import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure uploads folder exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Serve uploaded audio and images with audio streaming Range support
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      if (filePath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (filePath.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
      } else if (filePath.endsWith('.ogg')) {
        res.setHeader('Content-Type', 'audio/ogg');
      } else if (filePath.endsWith('.m4a')) {
        res.setHeader('Content-Type', 'audio/mp4');
      }
    },
  })
);

// Upload API endpoint
app.post('/api/upload', (req: Request, res: Response): void => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('Upload middleware error:', err);
      res.status(400).json({ error: err.message || 'File upload error' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file provided in request' });
      return;
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
app.post('/api/delete-file', (req: Request, res: Response): void => {
  try {
    const { filename, url } = req.body || {};
    let targetFile = filename;
    if (!targetFile && url && typeof url === 'string' && url.includes('/uploads/')) {
      targetFile = url.split('/uploads/').pop();
    }
    if (targetFile) {
      const safeName = path.basename(targetFile);
      const filePath = path.join(uploadsDir, safeName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted uploaded file: ${safeName}`);
      }
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
  const cachedPath = path.join(uploadsDir, cachedFilename);

  // If already cached and valid size (> 2000 bytes)
  if (fs.existsSync(cachedPath)) {
    try {
      const stat = fs.statSync(cachedPath);
      if (stat.size > 2000) {
        return cachedPath;
      }
    } catch {
      // ignore
    }
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
        await fs.promises.writeFile(cachedPath, Buffer.from(arrayBuf));
        return cachedPath;
      }
    }
  } catch (err) {
    console.error('Error fetching Google Drive file:', err);
  }

  return null;
}

// Google Drive Stream Proxy endpoint: streams audio for player and visualizer
app.get('/api/drive-stream/:id', async (req: Request, res: Response): Promise<void> => {
  const fileId = req.params.id;
  if (!fileId) {
    res.status(400).send('File ID required');
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  const localPath = await getOrFetchDriveFile(fileId);
  if (localPath && fs.existsSync(localPath)) {
    res.sendFile(localPath);
    return;
  }

  // Fallback 302 redirect directly to Google Drive export
  const directDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  res.redirect(302, directDriveUrl);
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
  const localPath = path.join(uploadsDir, filename);

  if (fs.existsSync(localPath)) {
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
    res.status(404).send('Audio file not found on server');
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
    const localPath = path.join(uploadsDir, candidate);
    if (fs.existsSync(localPath)) {
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
    res.status(400).send('Missing url or storagePath parameter');
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

    // Fallback: direct streaming from Drive
    try {
      const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const driveRes = await fetch(driveUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });
      if (driveRes.ok && driveRes.body) {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`
        );
        res.setHeader('Content-Type', 'audio/mpeg');
        // @ts-ignore
        const reader = driveRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
        return;
      }
    } catch (e) {
      console.warn('Fallback stream note:', e);
    }

    // Final fallback redirect
    res.redirect(302, `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`);
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

    if (remoteRes.body) {
      // @ts-ignore
      const reader = remoteRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      const arrayBuf = await remoteRes.arrayBuffer();
      res.send(Buffer.from(arrayBuf));
    }
  } catch (err) {
    console.error('Download proxy error:', err);
    res.status(500).send('Download error');
  }
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
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
