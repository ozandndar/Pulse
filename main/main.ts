import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } from "electron";
import { existsSync } from "fs";
import path from "path";

// IPC handlers
import "./ipc/system";
import "./ipc/appUsage";
import { startActiveWindowTracker } from "./services/appUsageService";

let mainWindow: BrowserWindow | null;
let tray: Tray | null = null;
let isQuiting = false;
const WINDOW_WIDTH = 1600;
const WINDOW_HEIGHT = 900;

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
  // mainWindow.webContents.openDevTools();

  mainWindow.on("close", event => {
    if (isQuiting) return;
    event.preventDefault();
    mainWindow?.hide();
    mainWindow?.setSkipTaskbar(true);
  });

  mainWindow.on("show", () => {
    mainWindow?.setSkipTaskbar(false);
  });
}

function resolveTrayIcon() {
  const candidates = [
    path.join(process.resourcesPath, "tray-icon.png"),
    path.join(app.getAppPath(), "resources", "tray-icon.png"),
    path.join(__dirname, "tray-icon.png")
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const fromPath = nativeImage.createFromPath(candidate);
      if (!fromPath.isEmpty()) {
        return fromPath;
      }
    }
  }

  const fallbackBase64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGUlEQVR4nO3BMQEAAADCIPunNsc+YAAAAAAAAAAAAP4F1kAAAbThVvoAAAAASUVORK5CYII=";
  return nativeImage.createFromBuffer(Buffer.from(fallbackBase64, "base64"));
}

function showMainWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  if (tray) return;

  const icon = resolveTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip("Pulse");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Pulse",
      click: () => {
        showMainWindow();
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    showMainWindow();
  });
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
      window.hide();
      window.setSkipTaskbar(true);
      break;
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  startActiveWindowTracker();

  app.on("before-quit", () => {
    isQuiting = true;
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});