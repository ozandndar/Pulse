import { ipcMain } from "electron";
import { getSystemStats } from "../services/systemService";

ipcMain.handle("system:getStats", async () => {
  return await getSystemStats();
});
