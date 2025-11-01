import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipProps
} from "recharts";

import DashboardCards from "./components/DashboardCards";
import { dashboardCards } from "./constants";

type UsageSummary = { app: string; duration: number };
type UsageEntry = { app: string; duration: number; timestamp: string };
type TimelinePoint = { time: string; [key: string]: number | string };
type TimelineTooltipItem = {
    name?: string | number;
    dataKey?: string | number;
    color?: string;
    value?: number | string | null;
};

const MAX_TOP_APPS = 4;
const REFRESH_INTERVAL_MS = 15000;
const AREA_COLORS = ["#38bdf8", "#a855f7", "#f97316", "#22c55e", "#94a3b8", "#facc15"];
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function sanitizeSummary(data: unknown): UsageSummary[] {
    if (!Array.isArray(data)) return [];
    return data
        .map((item) => {
            const app = typeof item?.app === "string" && item.app.trim().length > 0 ? item.app : "Unknown";
            const rawDuration = typeof item?.duration === "number" ? item.duration : Number(item?.duration);
            const duration = Number.isFinite(rawDuration) ? Math.max(rawDuration, 0) : 0;
            return { app, duration };
        })
        .filter((entry) => entry.duration > 0)
        .sort((a, b) => b.duration - a.duration);
}

function sanitizeEntries(data: unknown): UsageEntry[] {
    if (!Array.isArray(data)) return [];
    return data
        .map((item) => {
            const app = typeof item?.app === "string" && item.app.trim().length > 0 ? item.app : "Unknown";
            const rawDuration = typeof item?.duration === "number" ? item.duration : Number(item?.duration);
            const duration = Number.isFinite(rawDuration) ? Math.max(rawDuration, 0) : 0;
            const timestamp = typeof item?.timestamp === "string" ? item.timestamp : "";
            return { app, duration, timestamp };
        })
        .filter((entry) => entry.duration > 0 && entry.timestamp);
}

function formatDuration(ms: number) {
    if (!Number.isFinite(ms) || ms <= 0) return "0m";
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

function formatMinutes(minutes: number) {
    if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
    const totalMinutes = Math.round(minutes);
    const hours = Math.floor(totalMinutes / 60);
    const remainder = totalMinutes % 60;
    if (hours === 0) return `${remainder}m`;
    return `${hours}h ${remainder.toString().padStart(2, "0")}m`;
}

function formatTimeLabel(date: Date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildTimeline(entries: UsageEntry[], trackedApps: string[]) {
    if (entries.length === 0) {
        return { points: [] as TimelinePoint[], keys: [...trackedApps] };
    }

    const topSet = new Set(trackedApps);
    const buckets = new Map<number, TimelinePoint>();
    const totals = new Map<string, number>();
    let otherTotals = 0;
    let minBucket: number | null = null;
    let maxBucket: number | null = null;

    for (const entry of entries) {
        const parsed = new Date(entry.timestamp);
        if (Number.isNaN(parsed.getTime())) continue;

        const bucketDate = new Date(parsed);
        const minutes = bucketDate.getMinutes();
        const bucketMinutes = minutes < 30 ? 0 : 30;
        bucketDate.setMinutes(bucketMinutes, 0, 0);
        const bucketKey = bucketDate.getTime();
        const label = formatTimeLabel(bucketDate);

        const point = buckets.get(bucketKey) ?? { time: label };
        const targetApp = trackedApps.length === 0
            ? entry.app
            : topSet.has(entry.app)
                ? entry.app
                : "Other";

        const minutesSpent = entry.duration / 60000;
        if (!Number.isFinite(minutesSpent) || minutesSpent <= 0) continue;

        point[targetApp] = typeof point[targetApp] === "number"
            ? (point[targetApp] as number) + minutesSpent
            : minutesSpent;

        buckets.set(bucketKey, point);

        totals.set(targetApp, (totals.get(targetApp) ?? 0) + minutesSpent);
        if (targetApp === "Other") {
            otherTotals += minutesSpent;
        }

        if (minBucket === null || bucketKey < minBucket) {
            minBucket = bucketKey;
        }
        if (maxBucket === null || bucketKey > maxBucket) {
            maxBucket = bucketKey;
        }
    }

    if (minBucket === null || maxBucket === null) {
        return { points: [] as TimelinePoint[], keys: [...trackedApps] };
    }

    let keys: string[];
    if (trackedApps.length === 0) {
        keys = Array.from(totals.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([key]) => key);
    } else {
        keys = [...trackedApps];
        if (otherTotals > 0) {
            keys.push("Other");
        }
    }

    const points: TimelinePoint[] = [];
    for (let bucket = minBucket; bucket <= maxBucket; bucket += THIRTY_MINUTES_MS) {
        const existing = buckets.get(bucket);
        const bucketDate = new Date(bucket);
        const label = formatTimeLabel(bucketDate);
        const point: TimelinePoint = existing ? { ...existing, time: label } : { time: label };
        keys.forEach((key) => {
            if (typeof point[key] !== "number") {
                point[key] = 0;
            }
        });
        points.push(point);
    }

    return { points, keys };
}

function TimelineTooltipContent(props: TooltipProps<number, string>) {
    const active = props.active;
    const payload = (props as { payload?: TimelineTooltipItem[] }).payload;
    const rawLabel = (props as { label?: string | number }).label;
    const label = typeof rawLabel === "string"
        ? rawLabel
        : typeof rawLabel === "number"
            ? rawLabel.toString()
            : "";
    if (!active || !payload || payload.length === 0 || label.length === 0) return null;

    return (
        <div className="rounded-lg border border-gray-700 bg-gray-900/95 px-3 py-2 text-sm text-gray-100 shadow-lg shadow-black/30">
            <p className="text-sm font-semibold text-white">{label}</p>
            <ul className="mt-2 space-y-1">
                {payload
                    .filter((item): item is TimelineTooltipItem => {
                        if (!item) return false;
                        const value = Number(item.value ?? 0);
                        return Number.isFinite(value) && value > 0;
                    })
                    .map((item) => {
                    const safeItem = item ?? {};
                    const name = typeof safeItem.name === "string"
                        ? safeItem.name
                        : String(safeItem.dataKey ?? "");
                    const color = safeItem.color ?? "#60a5fa";
                    const value = Number(safeItem.value ?? 0);
                    return (
                        <li
                            key={`${label}-${String(safeItem.dataKey ?? name)}`}
                            className="flex items-center justify-between gap-3"
                        >
                            <span className="flex items-center gap-2 text-gray-200">
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                {name}
                            </span>
                            <span className="text-gray-400">{formatMinutes(value)}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default function Dashboard() {
    const [topApps, setTopApps] = useState<UsageSummary[]>([]);
    const [totalUsageMs, setTotalUsageMs] = useState(0);
    const [timelinePoints, setTimelinePoints] = useState<TimelinePoint[]>([]);
    const [timelineKeys, setTimelineKeys] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const refreshUsage = useCallback(async () => {
        if (typeof window === "undefined" || !window.appUsageAPI) {
            setError("Usage data is unavailable in this environment");
            setTopApps([]);
            setTimelinePoints([]);
            setTimelineKeys([]);
            setTotalUsageMs(0);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const api = window.appUsageAPI;
            const [summaryRaw, entriesRaw] = await Promise.all([
                api.getTodaySummary(),
                api.getEntries({ range: "day" })
            ]);

            const summary = sanitizeSummary(summaryRaw);
            const total = summary.reduce((sum, entry) => sum + entry.duration, 0);
            const top = summary.slice(0, MAX_TOP_APPS);
            const entries = sanitizeEntries(entriesRaw);

            const { points, keys } = buildTimeline(entries, top.map((item) => item.app));

            setTopApps(top);
            setTotalUsageMs(total);
            setTimelinePoints(points);
            setTimelineKeys(keys);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("[Dashboard] Failed to load usage data", err);
            setError(err instanceof Error ? err.message : "Unable to load usage data");
            setTopApps([]);
            setTimelinePoints([]);
            setTimelineKeys([]);
            setTotalUsageMs(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUsage();
        const interval = window.setInterval(() => {
            refreshUsage();
        }, REFRESH_INTERVAL_MS);

        return () => window.clearInterval(interval);
    }, [refreshUsage]);

    const otherDurationMs = useMemo(() => {
        const topTotal = topApps.reduce((sum, entry) => sum + entry.duration, 0);
        return Math.max(totalUsageMs - topTotal, 0);
    }, [topApps, totalUsageMs]);

    const hasTimelineData = timelinePoints.length > 0;

    const otherShareInfo = useMemo(() => {
        if (otherDurationMs <= 0 || totalUsageMs === 0) return null;
        const share = (otherDurationMs / totalUsageMs) * 100;
        return {
            shareLabel: Math.round(share),
            barWidth: Math.min(Math.max(share, share > 0 ? 4 : 0), 100)
        };
    }, [otherDurationMs, totalUsageMs]);

    return (
        <div className="p-6 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-gray-400">
                    Monitor system health, productivity highlights, and daily activity in one place.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {dashboardCards.map((card) => (
                    <DashboardCards key={card.id} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/10">
                    <header className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Top Applications</h2>
                            <p className="text-xs text-gray-400">Most time spent today</p>
                        </div>
                        {lastUpdated && (
                            <span className="text-[11px] uppercase tracking-wide text-gray-500">
                                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        )}
                    </header>

                    <div className="mt-5 space-y-4">
                        {isLoading && topApps.length === 0 ? (
                            <p className="text-sm text-gray-500">Loading usage insights…</p>
                        ) : error ? (
                            <p className="text-sm text-red-400">{error}</p>
                        ) : topApps.length === 0 ? (
                            <p className="text-sm text-gray-500">No application activity recorded yet today.</p>
                        ) : (
                            <ul className="space-y-4">
                                {topApps.map((entry, index) => {
                                    const share = totalUsageMs === 0 ? 0 : (entry.duration / totalUsageMs) * 100;
                                    const shareLabel = Math.round(share);
                                    const barWidth = Math.min(Math.max(share, share > 0 ? 6 : 0), 100);
                                    return (
                                        <li
                                            key={entry.app}
                                            className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 shadow-inner shadow-black/10"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-gray-300">
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{entry.app}</p>
                                                        <p className="text-xs text-gray-400">{shareLabel}% of tracked time</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-blue-300">
                                                    {formatDuration(entry.duration)}
                                                </span>
                                            </div>
                                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                                {otherShareInfo && (
                                    <li className="rounded-xl border border-dashed border-gray-800/80 bg-gray-900/60 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-300">Other applications</span>
                                            <div className="text-right text-xs text-gray-400">
                                                <div className="font-medium text-gray-300">{formatDuration(otherDurationMs)}</div>
                                                <div>{otherShareInfo.shareLabel}% of tracked time</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                                            <div
                                                className="h-full rounded-full bg-gray-600"
                                                style={{ width: `${otherShareInfo.barWidth}%` }}
                                            />
                                        </div>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </section>

                <section className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/10">
                    <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Activity Timeline</h2>
                            <p className="text-xs text-gray-400">
                                Aggregated focus time per hour for today. Values are shown in minutes.
                            </p>
                        </div>
                        <span className="text-[11px] uppercase tracking-wide text-gray-500">
                            Refreshes every {REFRESH_INTERVAL_MS / 1000}s
                        </span>
                    </header>

                    <div className="mt-6 h-[30rem] w-full">
                        {isLoading && !hasTimelineData ? (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-800 text-sm text-gray-500">
                                Building timeline…
                            </div>
                        ) : error ? (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-red-900/60 bg-red-900/10 text-sm text-red-300">
                                {error}
                            </div>
                        ) : !hasTimelineData ? (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-800 text-sm text-gray-500">
                                No detailed activity captured yet today.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timelinePoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                                    <XAxis dataKey="time" stroke="#9ca3af" tickLine={false} axisLine={false} interval={0} />
                                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `${Math.round(value)}m`} tickLine={false} axisLine={false} />
                                    <Tooltip content={<TimelineTooltipContent />} cursor={{ fill: "rgba(76,29,149,0.15)" }} />
                                    <Legend wrapperStyle={{ color: "#d1d5db" }} />
                                    {timelineKeys.map((key, index) => {
                                        const color = AREA_COLORS[index % AREA_COLORS.length];
                                        return (
                                            <Bar
                                                key={key}
                                                dataKey={key}
                                                name={key}
                                                stackId="usage"
                                                fill={color}
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={40}
                                            />
                                        );
                                    })}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}