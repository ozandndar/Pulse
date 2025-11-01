import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  windowControl: (action: string) => ipcRenderer.send("window-control", action),
});

contextBridge.exposeInMainWorld("systemAPI", {
  getStats: () => ipcRenderer.invoke("system:getStats"),
});

contextBridge.exposeInMainWorld("appUsageAPI", {
  getActiveWindow: () => ipcRenderer.invoke("active:get"),
  listAllWindows: () => ipcRenderer.invoke("active:list"),
  getTodaySummary: () => ipcRenderer.invoke("usage:getTodaySummary"),
  getSummary: (range: any) => ipcRenderer.invoke("usage:getSummary", range),
  getEntries: (payload: any) => ipcRenderer.invoke("usage:getEntries", payload),
});