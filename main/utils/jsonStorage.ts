import fs from "fs";
import path from "path";
import { app } from "electron";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const logDir = path.join(app.getPath("userData"), "usage-logs");
ensureDir(logDir);

export function getTodayFilePath() {
  const date = new Date().toISOString().split("T")[0];
  return path.join(logDir, `usage-${date}.json`);
}

export function loadJSON(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function appendToTodayLog(entry: any) {
  const filePath = getTodayFilePath();
  const data = loadJSON(filePath);
  data.push({ ...entry, timestamp: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Loads all usage logs between two dates (inclusive)
 */
export function loadUsageRange(start: Date, end: Date): any[] {
  const all: any[] = [];
  const files = fs.readdirSync(logDir);

  for (const f of files) {
    if (!f.startsWith("usage-") || !f.endsWith(".json")) continue;
    const dateStr = f.replace("usage-", "").replace(".json", "");
    const fileDate = new Date(dateStr);
    if (fileDate >= start && fileDate <= end) {
      all.push(...loadJSON(path.join(logDir, f)));
    }
  }
  return all;
}
