import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";

// IPC handlers
import "./ipc/system";

let mainWindow: BrowserWindow | null;
const WINDOW_WIDTH = 1300;
const WINDOW_HEIGHT = 800;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  // In dev, load React dev server; in prod, load built index.html
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173"); // Vite dev server for React
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  Menu.setApplicationMenu(null);
  mainWindow.webContents.openDevTools();
}

ipcMain.on("window-control", (event, action) => {
  const window = BrowserWindow.getFocusedWindow();
  if (!window) return;

  switch (action) {
    case "minimize":
      window.minimize();
      break;
    case "maximize":
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      break;
    case "close":
      window.close();
      break;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});