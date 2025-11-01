import type { Options, Result } from "active-win";
import { appendToTodayLog } from "../utils/jsonStorage";

/**
 * Get the currently active (foreground) window.
 */
export async function getActiveWindow(options?: Options): Promise<Result | undefined> {
    const { default: activeWin } = await import("active-win");
    return activeWin(options);
}

/**
 * Get metadata about all open windows (front to back).
 */
export async function getOpenWindows(options?: Options): Promise<Result[]> {
    const { getOpenWindows } = await import("active-win");
    return getOpenWindows(options);
}

let lastApp: any = null;
let lastChange = Date.now();

/**
 * Tracks active window usage periodically and logs app durations to JSON.
 */
export async function startActiveWindowTracker(intervalMs = 2000) {
    console.log("[Tracker] Starting active window tracker...");

    setInterval(async () => {
        try {
            const current = await getActiveWindow();
            if (!current || !current.owner) return;

            // if window changed
            if (lastApp && current.owner.path !== lastApp.owner.path) {
                const duration = Date.now() - lastChange;
                appendToTodayLog({
                    app: lastApp.owner.name,
                    title: lastApp.title,
                    path: lastApp.owner.path,
                    duration,
                });
                console.log(lastApp)
                console.log(`[Tracker] Logged: ${lastApp.owner.name} (${duration}ms)`);
                lastChange = Date.now();
            }

            lastApp = current;
        } catch (err) {
            console.error("[Tracker] Error:", err);
        }
    }, intervalMs);
}