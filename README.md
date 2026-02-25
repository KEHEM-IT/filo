# Filo Studio

A visual file tree editor with drag-and-drop interface and file upload support.

## Installation

### 1. Install Node.js dependencies
```bash
cd /home/kehem/Software/ckdash/tree
npm install
```

### 2. Start the server
```bash
npm start
```

The server will run on `http://localhost:3001`

## Features

- **Visual Tree Editor**: Drag and drop nodes to rearrange your file structure
- **Text Editing**: Edit text files (.txt, .code, .doc) directly in the browser with Froala Editor
- **File Upload**: Upload images, videos, audio, PDF, and archive files
- **Persistent Storage**: All data saved to `/data` folder on the server
- **Real-time Preview**: View uploaded images, videos, audio, and PDFs

## File Structure

```
/tree
├── index.html          # Main UI
├── server.js           # Express backend
├── package.json        # Node dependencies
└── data/               # Data storage
    ├── tree.json       # Tree structure
    ├── content.json    # Text content
    ├── positions.json  # Node positions
    └── files/          # Uploaded files
```

## API Endpoints

- `GET /api/load` - Load tree and content
- `POST /api/save` - Save tree and content
- `POST /api/upload` - Upload file
- `POST /api/delete-file` - Delete uploaded file

## Usage

1. Start the server: `npm start`
2. Open `http://localhost:3001` in your browser
3. Right-click nodes to add items or use hover buttons
4. For text files: Click "Create" to start editing
5. For media files: Upload files via drag-and-drop or click
6. Drag nodes to reposition them
7. Double-click folder toggle dots to expand/collapse
