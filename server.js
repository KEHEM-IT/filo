const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Encryption key (in production, this should be more secure)
const ENCRYPTION_KEY = crypto.scryptSync('filo-secure-key-2024-unique-encryption', 'salt', 32);
const ALGORITHM = 'aes-256-cbc';

// Encryption functions
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  try {
    // Check if the text is encrypted (contains ':')
    if (!encryptedText.includes(':')) {
      // Not encrypted, return as-is for backward compatibility
      return encryptedText;
    }
    
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, try to return as plain text
    if (!encryptedText.includes(':')) {
      return encryptedText;
    }
    throw error;
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Setup upload directory
const dataDir = path.join(__dirname, 'data');
const filesDir = path.join(dataDir, 'files');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    const nodeId = req.body.nodeId || 'file';
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${nodeId}_${name}_${timestamp}${ext}`);
  }
});

const upload = multer({ storage });

// Routes
app.post('/api/save', (req, res) => {
  try {
    const { tree, content, positions } = req.body;
    
    if (tree) {
      const encryptedTree = encrypt(JSON.stringify(tree, null, 2));
      fs.writeFileSync(path.join(dataDir, 'tree.json'), encryptedTree);
    }
    if (content) {
      const encryptedContent = encrypt(JSON.stringify(content, null, 2));
      fs.writeFileSync(path.join(dataDir, 'content.json'), encryptedContent);
    }
    if (positions) {
      const encryptedPositions = encrypt(JSON.stringify(positions, null, 2));
      fs.writeFileSync(path.join(dataDir, 'positions.json'), encryptedPositions);
    }
    
    res.json({ success: true, message: 'Data saved' });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/load', (req, res) => {
  try {
    const result = {
      tree: null,
      content: {},
      positions: {}
    };
    
    const treeFile = path.join(dataDir, 'tree.json');
    const contentFile = path.join(dataDir, 'content.json');
    const posFile = path.join(dataDir, 'positions.json');
    
    if (fs.existsSync(treeFile)) {
      const fileContent = fs.readFileSync(treeFile, 'utf8');
      try {
        result.tree = JSON.parse(decrypt(fileContent));
      } catch (error) {
        console.warn('Failed to decrypt tree data, trying as plain JSON:', error.message);
        result.tree = JSON.parse(fileContent);
      }
    }
    if (fs.existsSync(contentFile)) {
      const fileContent = fs.readFileSync(contentFile, 'utf8');
      try {
        result.content = JSON.parse(decrypt(fileContent));
      } catch (error) {
        console.warn('Failed to decrypt content data, trying as plain JSON:', error.message);
        result.content = JSON.parse(fileContent);
      }
    }
    if (fs.existsSync(posFile)) {
      const fileContent = fs.readFileSync(posFile, 'utf8');
      try {
        result.positions = JSON.parse(decrypt(fileContent));
      } catch (error) {
        console.warn('Failed to decrypt positions data, trying as plain JSON:', error.message);
        result.positions = JSON.parse(fileContent);
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ success: false, message: 'Failed to load data' });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }
    
    const filePath = `data/files/${req.file.filename}`;
    res.json({
      success: true,
      message: 'File uploaded',
      path: filePath
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/delete-file', (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fullPath = path.join(__dirname, filePath);
    
    // Security: ensure file is within data directory
    if (!fullPath.startsWith(dataDir)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = app;
