import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  windowControl: (action: string) => ipcRenderer.send("window-control", action),
});
