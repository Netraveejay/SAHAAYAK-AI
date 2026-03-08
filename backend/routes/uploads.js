const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile, getPresignedUploadUrl } = require('../services/s3Service');

const USE_S3 = process.env.USE_S3 === 'true';
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}_${(file.originalname || 'file').slice(0, 50)}${ext}`);
  },
});

const memoryStorage = multer.memoryStorage();
const diskUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const memoryUpload = multer({ storage: memoryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', (USE_S3 ? memoryUpload : diskUpload).single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (USE_S3) {
      const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      res.json({
        success: true,
        file: {
          filename: result.key,
          originalName: req.file.originalname,
          path: result.url,
        },
      });
    } else {
      res.json({
        success: true,
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: `/uploads/${req.file.filename}`,
        },
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/multiple', (USE_S3 ? memoryUpload : diskUpload).array('files', 10), async (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded' });

    if (USE_S3) {
      const files = await Promise.all(
        req.files.map(async (f) => {
          const result = await uploadFile(f.buffer, f.originalname, f.mimetype);
          return {
            filename: result.key,
            originalName: f.originalname,
            path: result.url,
          };
        })
      );
      res.json({ success: true, files });
    } else {
      const files = req.files.map((f) => ({
        filename: f.filename,
        originalName: f.originalname,
        path: `/uploads/${f.filename}`,
      }));
      res.json({ success: true, files });
    }
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/presigned-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ error: 'fileName required' });
    
    const result = await getPresignedUploadUrl(fileName, contentType || 'application/octet-stream');
    res.json(result);
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

module.exports = router;
