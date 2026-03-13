const { app: electronApp, BrowserWindow, Menu } = require('electron');
const expressApp = require('./server');
const path = require('path');

// Set userData to a 'data' folder in the same directory as the exe
electronApp.setPath('userData', path.join(path.dirname(process.execPath), 'data'));

// Hide the menu bar completely
Menu.setApplicationMenu(null);

// Start the Express server
const PORT = 3001;
expressApp.listen(PORT, () => {
  console.log(`FileTree server running at http://localhost:${PORT}`);
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    maximizable: true,
    resizable: true,
    menuBarVisible: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app from the local server
  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

electronApp.whenReady().then(() => {
  createWindow();

  electronApp.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

electronApp.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});