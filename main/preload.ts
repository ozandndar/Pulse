import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  windowControl: (action: string) => ipcRenderer.send("window-control", action),
});

contextBridge.exposeInMainWorld("systemAPI", {
  getStats: () => ipcRenderer.invoke("system:getStats"),
});