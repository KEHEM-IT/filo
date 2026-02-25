const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

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
    cb(null, `${nodeId}_${name}${ext}`);
  }
});

const upload = multer({ storage });

// Routes
app.post('/api/save', (req, res) => {
  try {
    const { tree, content, positions } = req.body;
    
    if (tree) {
      fs.writeFileSync(path.join(dataDir, 'tree.json'), JSON.stringify(tree, null, 2));
    }
    if (content) {
      fs.writeFileSync(path.join(dataDir, 'content.json'), JSON.stringify(content, null, 2));
    }
    if (positions) {
      fs.writeFileSync(path.join(dataDir, 'positions.json'), JSON.stringify(positions, null, 2));
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
      result.tree = JSON.parse(fs.readFileSync(treeFile, 'utf8'));
    }
    if (fs.existsSync(contentFile)) {
      result.content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
    }
    if (fs.existsSync(posFile)) {
      result.positions = JSON.parse(fs.readFileSync(posFile, 'utf8'));
    }
    
    res.json(result);
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ success: false, message: error.message });
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

app.listen(PORT, () => {
  console.log(`FileTree server running at http://localhost:${PORT}`);
});
