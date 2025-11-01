import { ipcMain } from "electron";
import { getActiveWindow, getOpenWindows } from "../services/appUsageService";
import { getTodayFilePath, loadJSON, loadUsageRange } from "../utils/jsonStorage";

ipcMain.handle("active:get", async() => {
    return await getActiveWindow();
});

ipcMain.handle("active:list", async() => {
    return await getOpenWindows();
});

function aggregate(entries: any[]) {
  const summary: Record<string, number> = {};
  for (const e of entries) {
    if (!e.app) continue;
    summary[e.app] = (summary[e.app] || 0) + (e.duration || 0);
  }
  return Object.entries(summary)
    .map(([app, duration]) => ({ app, duration }))
    .sort((a, b) => b.duration - a.duration);
}

// Daily summary
ipcMain.handle("usage:getTodaySummary", async () => {
  const entries = loadJSON(getTodayFilePath());
  return aggregate(entries);
});

// Range summary
ipcMain.handle("usage:getSummary", async (_, range: "week" | "month") => {
  const now = new Date();
  const start = new Date(now);
  if (range === "week") start.setDate(now.getDate() - 7);
  if (range === "month") start.setMonth(now.getMonth() - 1);
  const entries = loadUsageRange(start, now);
  return aggregate(entries);
});

ipcMain.handle(
  "usage:getEntries",
  async (
    _,
    args: { range: "day" | "week" | "month"; app?: string } = { range: "day" }
  ) => {
    const { range = "day", app } = args || {};
    let entries: any[] = [];

    if (range === "day") {
      entries = loadJSON(getTodayFilePath());
    } else {
      const now = new Date();
      const start = new Date(now);
      if (range === "week") start.setDate(now.getDate() - 7);
      if (range === "month") start.setMonth(now.getMonth() - 1);
      entries = loadUsageRange(start, now);
    }

    if (app) {
      entries = entries.filter((entry) => entry?.app === app);
    }

    return entries;
  }
);