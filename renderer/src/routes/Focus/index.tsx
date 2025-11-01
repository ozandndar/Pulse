import { useCallback, useEffect, useMemo, useState } from "react";

type FocusRange = "day" | "week" | "month";

type FocusRecord = {
    app: string;
    duration: number;
};

type ProductivityTag = "productive" | "unproductive" | "neutral";

type RawUsageEntry = {
    app?: unknown;
    title?: unknown;
    duration?: unknown;
    timestamp?: unknown;
};

type DetailRow = {
    title: string;
    duration: number;
    occurrences: number;
};

const rangeOptions: { value: FocusRange; label: string }[] = [
    { value: "day", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" },
];

const REFRESH_INTERVAL_MS = 15000;
const STORAGE_KEY = "pulse:focus-productivity-tags";

function loadStoredTags(): Record<string, ProductivityTag> {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Record<string, ProductivityTag>;
        return Object.fromEntries(
            Object.entries(parsed).map(([app, tag]) => {
                if (tag === "productive" || tag === "unproductive" || tag === "neutral") {
                    return [app, tag];
                }
                return [app, "neutral"];
            })
        );
    } catch (err) {
        console.warn("[Focus] Failed to parse productivity tags", err);
        return {};
    }
}

function sanitizeRows(rows: unknown): FocusRecord[] {
    if (!Array.isArray(rows)) return [];
    return rows
        .map((row) => {
            const app = typeof row?.app === "string" && row.app.trim().length > 0 ? row.app : "Unknown";
            const rawDuration = row?.duration as number | string | undefined;
            const parsedDuration = typeof rawDuration === "number" ? rawDuration : Number(rawDuration);
            const duration = Number.isFinite(parsedDuration) ? Math.max(parsedDuration, 0) : 0;
            return { app, duration };
        })
        .filter((row) => row.duration > 0);
}

function formatDuration(ms: number) {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

function formatHours(ms: number) {
    const hours = ms / 3600000;
    return `${hours.toFixed(1)}h`;
}

function sanitizeTitleForApp(title: unknown, app: string) {
    if (typeof title !== "string" || title.trim().length === 0) {
        return "Unknown";
    }
    let cleaned = title.trim();
    const suffix = ` - ${app}`;
    while (cleaned.endsWith(suffix)) {
        cleaned = cleaned.slice(0, cleaned.length - suffix.length).trim();
    }
    return cleaned.length > 0 ? cleaned : app;
}

function aggregateDetails(entries: RawUsageEntry[], app: string): { rows: DetailRow[]; total: number } {
    if (!Array.isArray(entries)) {
        return { rows: [], total: 0 };
    }

    const map = new Map<string, DetailRow>();
    let total = 0;

    for (const entry of entries) {
        const durationRaw = typeof entry?.duration === "number" ? entry.duration : Number(entry?.duration);
        const duration = Number.isFinite(durationRaw) ? Math.max(durationRaw, 0) : 0;
        if (duration === 0) continue;

        const title = sanitizeTitleForApp(entry?.title, app);
        total += duration;

        const existing = map.get(title) ?? { title, duration: 0, occurrences: 0 };
        existing.duration += duration;
        existing.occurrences += 1;
        map.set(title, existing);
    }

    const rows = Array.from(map.values()).sort((a, b) => b.duration - a.duration);
    return { rows, total };
}

export default function Focus() {
    const [selectedRange, setSelectedRange] = useState<FocusRange>(rangeOptions[0].value);
    const [rows, setRows] = useState<FocusRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tags, setTags] = useState<Record<string, ProductivityTag>>(loadStoredTags);
    const [detailsApp, setDetailsApp] = useState<string | null>(null);
    const [detailsRows, setDetailsRows] = useState<DetailRow[]>([]);
    const [detailsTotal, setDetailsTotal] = useState(0);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const loadData = useCallback(async (range: FocusRange) => {
        setIsLoading(true);
        setError(null);

        try {
            if (!window.appUsageAPI) {
                throw new Error("App usage API is unavailable");
            }

            let response: unknown;
            if (range === "day") {
                response = await window.appUsageAPI.getTodaySummary();
            } else {
                response = await window.appUsageAPI.getSummary(range);
            }

            setRows(sanitizeRows(response));
        } catch (err) {
            console.error("[Focus] Failed to load focus data", err);
            setRows([]);
            setError(err instanceof Error ? err.message : "Unable to load focus data");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(selectedRange);
    }, [selectedRange, loadData]);

    useEffect(() => {
        const interval = setInterval(() => {
            loadData(selectedRange);
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [selectedRange, loadData]);

    const sortedRows = useMemo(
        () => [...rows].sort((a, b) => b.duration - a.duration),
        [rows]
    );

    useEffect(() => {
        if (sortedRows.length === 0) return;
        setTags((prev) => {
            let mutated = false;
            const next = { ...prev };
            sortedRows.forEach((row) => {
                if (!next[row.app]) {
                    next[row.app] = "neutral";
                    mutated = true;
                }
            });
            return mutated ? next : prev;
        });
    }, [sortedRows]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    }, [tags]);

    const handleTagChange = useCallback((app: string, tag: ProductivityTag) => {
        setTags((prev) => {
            const next = { ...prev, [app]: tag };
            return next;
        });
    }, []);

    const fetchDetails = useCallback(
        async (app: string, range: FocusRange) => {
            setDetailsLoading(true);
            setDetailsError(null);
            setDetailsRows([]);
            setDetailsTotal(0);

            try {
                if (!window.appUsageAPI) {
                    throw new Error("App usage API is unavailable");
                }

                const response = (await window.appUsageAPI.getEntries({ range, app })) as RawUsageEntry[];
                const aggregated = aggregateDetails(response ?? [], app);
                setDetailsRows(aggregated.rows);
                setDetailsTotal(aggregated.total);
            } catch (err) {
                console.error("[Focus] Failed to load detail data", err);
                setDetailsError(err instanceof Error ? err.message : "Unable to load detail data");
            } finally {
                setDetailsLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (!detailsApp) return;
        fetchDetails(detailsApp, selectedRange);
    }, [detailsApp, selectedRange, fetchDetails]);

    const totalMs = useMemo(
        () => sortedRows.reduce((sum, record) => sum + record.duration, 0),
        [sortedRows]
    );

    const productivityTotals = useMemo(() => {
        return sortedRows.reduce(
            (acc, record) => {
                const tag = tags[record.app] ?? "neutral";
                acc[tag] += record.duration;
                return acc;
            },
            { productive: 0, unproductive: 0, neutral: 0 } as Record<ProductivityTag, number>
        );
    }, [sortedRows, tags]);

    const nothingToShow = !isLoading && !error && sortedRows.length === 0;

    return (
        <div className="p-6 space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Focus Overview</h1>
                    <p className="text-sm text-gray-400">
                        Track time spent across applications. Select a range to explore productivity patterns.
                    </p>
                </div>
                <label className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="uppercase tracking-wide text-gray-500">Range</span>
                    <select
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedRange}
                        onChange={(event) => setSelectedRange(event.target.value as FocusRange)}
                    >
                        {rangeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </header>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-3">
                    <span className="text-xs uppercase tracking-wide text-emerald-400">Productive</span>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatHours(productivityTotals.productive)}</div>
                    <p className="text-xs text-emerald-300/80">Tagged as productive</p>
                </div>
                <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 px-4 py-3">
                    <span className="text-xs uppercase tracking-wide text-rose-400">Unproductive</span>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatHours(productivityTotals.unproductive)}</div>
                    <p className="text-xs text-rose-300/80">Tagged as unproductive</p>
                </div>
                <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
                    <span className="text-xs uppercase tracking-wide text-slate-300">Neutral</span>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatHours(productivityTotals.neutral)}</div>
                    <p className="text-xs text-slate-300/80">No productivity tag</p>
                </div>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg shadow-black/10">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <h2 className="text-lg font-medium text-white">Application Focus Time</h2>
                    <span className="text-sm text-gray-400">
                        Total focused time: <span className="text-blue-400 font-medium">{formatDuration(totalMs)}</span>
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-800 text-sm text-left">
                        <thead className="bg-gray-800/60 text-gray-400 uppercase text-xs tracking-wide">
                            <tr>
                                <th scope="col" className="px-6 py-3">Application</th>
                                <th scope="col" className="px-6 py-3">Focused Duration</th>
                                <th scope="col" className="px-6 py-3">Share</th>
                                <th scope="col" className="px-6 py-3">Productivity</th>
                                <th scope="col" className="px-6 py-3">See Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80">
                            {sortedRows.map((record) => {
                                const share = totalMs === 0 ? 0 : Math.round((record.duration / totalMs) * 100);
                                const currentTag = tags[record.app] ?? "neutral";
                                return (
                                    <tr
                                        key={`${selectedRange}-${record.app}`}
                                        className="hover:bg-gray-800/60 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 text-white font-medium">{record.app}</td>
                                        <td className="px-6 py-4 text-gray-300">{formatDuration(record.duration)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                        style={{ width: `${share}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-400 min-w-[3ch] text-right">{share}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                value={currentTag}
                                                onChange={(event) =>
                                                    handleTagChange(
                                                        record.app,
                                                        event.target.value as ProductivityTag
                                                    )
                                                }
                                            >
                                                <option value="productive">Productive</option>
                                                <option value="neutral">Neutral</option>
                                                <option value="unproductive">Unproductive</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/20"
                                                onClick={() => setDetailsApp(record.app)}
                                            >
                                                View details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {isLoading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-6 text-center text-gray-500 text-sm">
                                        Loading focus data…
                                    </td>
                                </tr>
                            )}
                            {error && !isLoading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-6 text-center text-red-400 text-sm">
                                        {error}
                                    </td>
                                </tr>
                            )}
                            {nothingToShow && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-6 text-center text-gray-500 text-sm">
                                        No focus data available for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {detailsApp && (
                <DetailsModal
                    app={detailsApp}
                    range={selectedRange}
                    rows={detailsRows}
                    total={detailsTotal}
                    isLoading={detailsLoading}
                    error={detailsError}
                    onClose={() => {
                        setDetailsApp(null);
                        setDetailsRows([]);
                        setDetailsTotal(0);
                        setDetailsError(null);
                    }}
                />
            )}
        </div>
    );
}

type DetailsModalProps = {
    app: string;
    range: FocusRange;
    rows: DetailRow[];
    total: number;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
};

function DetailsModal({ app, range, rows, total, isLoading, error, onClose }: DetailsModalProps) {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const rangeLabel = rangeOptions.find((option) => option.value === range)?.label ?? "Selected range";

    return (
        <div
            className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/95 shadow-2xl shadow-black/50 backdrop-blur-sm"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-gray-800 px-6 py-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">{app}</h2>
                        <p className="text-sm text-gray-400">Focus detail for {rangeLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                        aria-label="Close details"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
                            <span className="text-xs uppercase tracking-wide text-blue-300">Total</span>
                            <div className="mt-2 text-xl font-semibold text-white">{formatDuration(total)}</div>
                            <p className="text-xs text-blue-200/70">All sessions for this app</p>
                        </div>
                        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3">
                            <span className="text-xs uppercase tracking-wide text-purple-300">Sessions</span>
                            <div className="mt-2 text-xl font-semibold text-white">{rows.length}</div>
                            <p className="text-xs text-purple-200/70">Unique windows/tabs</p>
                        </div>
                        <div className="rounded-xl border border-gray-700/40 bg-gray-900/70 px-4 py-3">
                            <span className="text-xs uppercase tracking-wide text-gray-400">Average duration</span>
                            <div className="mt-2 text-xl font-semibold text-white">
                                {rows.length === 0 ? "-" : formatDuration(Math.round(total / rows.length))}
                            </div>
                            <p className="text-xs text-gray-400/80">Per entry</p>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="rounded-lg border border-gray-800 bg-gray-900/70 px-4 py-4 text-center text-sm text-gray-400">
                            Loading details…
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="rounded-lg border border-red-800/60 bg-red-900/40 px-4 py-4 text-center text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && rows.length === 0 && (
                        <div className="rounded-lg border border-gray-800 bg-gray-900/70 px-4 py-4 text-center text-sm text-gray-400">
                            No detailed usage captured for this app in the selected range.
                        </div>
                    )}

                    {!isLoading && !error && rows.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-gray-800">
                            <table className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80 text-xs uppercase tracking-wide text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left">Window / Tab</th>
                                        <th scope="col" className="px-4 py-3 text-left">Focused Duration</th>
                                        <th scope="col" className="px-4 py-3 text-left">Sessions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/80">
                                    {rows.map((row) => (
                                        <tr key={row.title} className="hover:bg-gray-900/60">
                                            <td className="px-4 py-3 text-gray-200">{row.title}</td>
                                            <td className="px-4 py-3 text-gray-300">{formatDuration(row.duration)}</td>
                                            <td className="px-4 py-3 text-gray-400">{row.occurrences}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}