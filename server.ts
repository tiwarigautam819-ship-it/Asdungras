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
    fileSize: 100 * 1024 * 1024, // 100MB limit for high quality DJ audio
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
app.post('/api/upload', upload.single('file'), (req: Request, res: Response): void => {
  try {
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
  } catch (error) {
    console.error('Server upload error:', error);
    res.status(500).json({ error: 'Failed to process file upload' });
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
