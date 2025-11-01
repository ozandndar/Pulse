import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";

type UsageRange = "day" | "week" | "month";
type UsageRow = { app: string; duration: number };
type SortKey = "app" | "duration" | "share";
type SortState = { key: SortKey; direction: "asc" | "desc" };

const RANGE_OPTIONS: { value: UsageRange; label: string }[] = [
    { value: "day", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" }
];

function sanitizeUsage(data: unknown): UsageRow[] {
    if (!Array.isArray(data)) return [];
    return data
        .map((item) => {
            const app = typeof item?.app === "string" && item.app.trim().length > 0 ? item.app : "Unknown";
            const rawDuration = typeof item?.duration === "number" ? item.duration : Number(item?.duration);
            const duration = Number.isFinite(rawDuration) ? Math.max(rawDuration, 0) : 0;
            return { app, duration };
        })
        .filter((row) => row.duration > 0)
        .sort((a, b) => b.duration - a.duration);
}

function formatMinutes(ms: number) {
    const totalMinutes = ms / 60000;
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "0m";
    if (totalMinutes < 60) return `${totalMinutes.toFixed(1)}m`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes.toFixed(0)}m`;
}

function formatCsv(rows: UsageRow[], total: number) {
    const header = "Application,Duration (minutes),Share (%)";
    const lines = rows.map((row) => {
        const minutes = (row.duration / 60000).toFixed(2);
        const share = total === 0 ? "0" : ((row.duration / total) * 100).toFixed(2);
        const safeApp = row.app.includes(",") ? `"${row.app.replace(/"/g, '""')}"` : row.app;
        return `${safeApp},${minutes},${share}`;
    });
    return [header, ...lines].join("\r\n");
}

function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function AppUsage() {
    const [range, setRange] = useState<UsageRange>("day");
    const [usage, setUsage] = useState<UsageRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState<SortState>({ key: "duration", direction: "desc" });

    const load = useCallback(async (selectedRange: UsageRange) => {
        if (!window.appUsageAPI) {
            setError("Usage API is unavailable");
            setUsage([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data =
                selectedRange === "day"
                    ? await window.appUsageAPI.getTodaySummary()
                    : await window.appUsageAPI.getSummary(selectedRange);
            setUsage(sanitizeUsage(data));
        } catch (err) {
            console.error("[AppUsage] Failed to load usage data", err);
            setError(err instanceof Error ? err.message : "Unable to load usage data");
            setUsage([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load(range);
        const interval = window.setInterval(() => {
            load(range);
        }, 15000);
        return () => window.clearInterval(interval);
    }, [load, range]);

    const totalDuration = useMemo(
        () => usage.reduce((sum, row) => sum + row.duration, 0),
        [usage]
    );

    const sortedUsage = useMemo(() => {
        const copy = [...usage];
        copy.sort((a, b) => {
            const modifier = sort.direction === "asc" ? 1 : -1;
            if (sort.key === "app") {
                return modifier * a.app.localeCompare(b.app);
            }
            if (sort.key === "duration") {
                return modifier * (a.duration - b.duration);
            }
            const shareA = totalDuration === 0 ? 0 : a.duration / totalDuration;
            const shareB = totalDuration === 0 ? 0 : b.duration / totalDuration;
            return modifier * (shareA - shareB);
        });
        return copy;
    }, [usage, sort, totalDuration]);

    const handleSort = (key: SortKey) => {
        setSort((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: key === "app" ? "asc" : "desc" };
        });
    };

    const handleExportCsv = () => {
        if (sortedUsage.length === 0) return;
        const csv = formatCsv(sortedUsage, totalDuration);
        const label = RANGE_OPTIONS.find((option) => option.value === range)?.label ?? range;
        downloadCsv(csv, `pulse-app-usage-${label.toLowerCase().replace(/\s+/g, "-")}.csv`);
    };

    const handleCopy = async () => {
        if (sortedUsage.length === 0) return;
        const csv = formatCsv(sortedUsage, totalDuration);
        try {
            await navigator.clipboard.writeText(csv);
        } catch (err) {
            console.error("[AppUsage] Failed to copy usage data", err);
        }
    };

    const xTickFormatter = useCallback((value: number) => `${(value / 60000).toFixed(1)}m`, []);

    const chartHeight = useMemo(() => {
        const base = 320;
        const perRow = 56;
        return Math.max(base, sortedUsage.length * perRow);
    }, [sortedUsage.length]);

    return (
        <div className="p-6 text-gray-100 space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">App Usage</h1>
                    <p className="text-sm text-gray-400">Analyze time spent across applications for the selected range.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={range}
                        onChange={(event) => setRange(event.target.value as UsageRange)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    >
                        {RANGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                        Export CSV
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/20"
                    >
                        Copy CSV
                    </button>
                </div>
            </header>

            <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/10">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart
                            data={sortedUsage}
                            layout="vertical"
                            margin={{ top: 16, right: 24, bottom: 16, left: 16 }}
                        >
                            <defs>
                                <linearGradient id="usageGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.85} />
                                    <stop offset="100%" stopColor="#4ade80" stopOpacity={0.95} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#1f2937" horizontal={false} />
                            <XAxis
                                type="number"
                                stroke="#9ca3af"
                                tickFormatter={xTickFormatter}
                                tick={{ fill: "#9ca3af", fontSize: 12 }}
                                axisLine={{ stroke: "#374151" }}
                                tickLine={{ stroke: "#374151" }}
                            />
                            <YAxis
                                type="category"
                                dataKey="app"
                                stroke="#9ca3af"
                                tick={{ fill: "#e5e7eb", fontSize: 13 }}
                                width={160}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(14,116,144,0.25)" }}
                                content={<UsageTooltip total={totalDuration} />}
                                wrapperStyle={{ outline: "none" }}
                            />
                            <Bar
                                dataKey="duration"
                                fill="url(#usageGradient)"
                                radius={[0, 8, 8, 0]}
                                maxBarSize={40}
                                background={{ fill: "rgba(15,23,42,0.6)" }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {isLoading && (
                    <p className="mt-4 text-sm text-gray-500">Refreshing usage data…</p>
                )}
                {error && !isLoading && (
                    <p className="mt-4 text-sm text-red-400">{error}</p>
                )}
                {!isLoading && !error && usage.length === 0 && (
                    <p className="mt-4 text-sm text-gray-500">No usage captured for this range.</p>
                )}
            </section>

            <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/10">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Detailed Usage</h2>
                        <p className="text-xs text-gray-400">Sort to explore how time is distributed across applications.</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                        Total tracked: {(totalDuration / 60000).toFixed(1)} min
                    </span>
                </header>

                <div className="mt-4 overflow-hidden rounded-xl border border-gray-800">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80 text-xs uppercase tracking-wide text-gray-400">
                            <tr>
                                <SortableHeader
                                    label="Application"
                                    sortKey="app"
                                    currentSort={sort}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Duration"
                                    sortKey="duration"
                                    currentSort={sort}
                                    onSort={handleSort}
                                    align="right"
                                />
                                <SortableHeader
                                    label="Share"
                                    sortKey="share"
                                    currentSort={sort}
                                    onSort={handleSort}
                                    align="right"
                                />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80">
                            {sortedUsage.map((row) => {
                                const share = totalDuration === 0 ? 0 : (row.duration / totalDuration) * 100;
                                return (
                                    <tr key={`${range}-${row.app}`} className="hover:bg-gray-900/60">
                                        <td className="px-5 py-3 text-gray-200">{row.app}</td>
                                        <td className="px-5 py-3 text-right text-gray-300 font-medium">
                                            {formatMinutes(row.duration)}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="inline-flex items-center gap-2">
                                                <span className="text-sm text-gray-300 font-medium">{share.toFixed(1)}%</span>
                                                <span className="relative block h-2 w-24 overflow-hidden rounded-full bg-gray-800">
                                                    <span
                                                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
                                                        style={{ width: `${Math.min(Math.max(share, 2), 100)}%` }}
                                                    />
                                                </span>
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {sortedUsage.length === 0 && !isLoading && !error && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-500">
                                        No app usage recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

type SortableHeaderProps = {
    label: string;
    sortKey: SortKey;
    currentSort: SortState;
    onSort: (key: SortKey) => void;
    align?: "left" | "right";
};

function SortableHeader({ label, sortKey, currentSort, onSort, align = "left" }: SortableHeaderProps) {
    const isActive = currentSort.key === sortKey;
    const direction = isActive ? currentSort.direction : undefined;
    const arrow = direction === "asc" ? "▲" : direction === "desc" ? "▼" : "";
    const justification = align === "right" ? "justify-end text-right" : "justify-start text-left";

    return (
        <th scope="col" className={`px-5 py-3 ${justification}`}>
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-white"
            >
                <span>{label}</span>
                {arrow && <span className="text-gray-500">{arrow}</span>}
            </button>
        </th>
    );
}

type UsageTooltipProps = {
    active?: boolean;
    payload?: Array<{ value: number; payload: UsageRow }>;
    label?: string;
    total: number;
};

function UsageTooltip({ active, payload, label, total }: UsageTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;
    const [{ value }] = payload;
    const minutes = formatMinutes(value);
    const share = total === 0 ? 0 : (value / total) * 100;

    return (
        <div className="rounded-xl border border-cyan-500/40 bg-slate-900/95 px-4 py-3 text-sm shadow-lg shadow-cyan-500/20">
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <div className="mt-2 flex flex-col gap-1">
                <span className="text-base font-semibold text-cyan-200">{minutes}</span>
                <span className="text-xs text-slate-400">{share.toFixed(1)}% of tracked time</span>
            </div>
        </div>
    );
}
