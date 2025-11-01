import { useEffect, useMemo, useState } from "react";

type ThemePreference = "system" | "dark" | "light";

type SettingsState = {
    theme: ThemePreference;
    launchOnStartup: boolean;
    minimizeToTray: boolean;
    idleThresholdSeconds: number;
};

const STORAGE_KEY = "pulse:app-settings";

const DEFAULT_SETTINGS: SettingsState = {
    theme: "system",
    launchOnStartup: false,
    minimizeToTray: true,
    idleThresholdSeconds: 120,
};

function loadSettings(): SettingsState {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        return {
            theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
            launchOnStartup: parsed.launchOnStartup ?? DEFAULT_SETTINGS.launchOnStartup,
            minimizeToTray: parsed.minimizeToTray ?? DEFAULT_SETTINGS.minimizeToTray,
            idleThresholdSeconds: parsed.idleThresholdSeconds ?? DEFAULT_SETTINGS.idleThresholdSeconds,
        };
    } catch (error) {
        console.warn("[Settings] Failed to parse stored settings", error);
        return DEFAULT_SETTINGS;
    }
}

export default function Settings() {
    const [settings, setSettings] = useState<SettingsState>(() => loadSettings());

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const idleThresholdMinutes = useMemo(
        () => Math.round(settings.idleThresholdSeconds / 60),
        [settings.idleThresholdSeconds]
    );

    return (
        <div className="p-6 space-y-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold text-white">Settings</h1>
                <p className="text-sm text-gray-400">
                    Configure how Pulse behaves. These preferences are stored locally and applied instantly.
                </p>
            </header>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
                    <h2 className="text-lg font-medium text-white">General</h2>
                    <p className="mt-1 text-sm text-gray-400">Appearance and launch behavior.</p>

                    <div className="mt-4 space-y-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-200">Theme</span>
                            <select
                                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                value={settings.theme}
                                onChange={(event) =>
                                    setSettings((prev) => ({ ...prev, theme: event.target.value as ThemePreference }))
                                }
                            >
                                <option value="system">System</option>
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </label>

                        <SwitchRow
                            label="Launch at system startup"
                            description="Start Pulse automatically when you sign in."
                            checked={settings.launchOnStartup}
                            onToggle={(value) => setSettings((prev) => ({ ...prev, launchOnStartup: value }))}
                        />

                        <SwitchRow
                            label="Minimize to tray"
                            description="Keep Pulse running in the background when closing the window."
                            checked={settings.minimizeToTray}
                            onToggle={(value) => setSettings((prev) => ({ ...prev, minimizeToTray: value }))}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
                    <h2 className="text-lg font-medium text-white">Activity Tracking</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Control how we detect inactivity and focus sessions.
                    </p>

                    <div className="mt-4 space-y-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-200">Idle threshold</span>
                            <input
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                type="number"
                                min={1}
                                max={30}
                                value={idleThresholdMinutes}
                                onChange={(event) => {
                                    const minutes = Number(event.target.value);
                                    if (Number.isNaN(minutes)) return;
                                    const seconds = Math.min(Math.max(minutes, 1), 30) * 60;
                                    setSettings((prev) => ({ ...prev, idleThresholdSeconds: seconds }));
                                }}
                            />
                            <span className="text-xs text-gray-500">
                                Pause focus tracking if there is no input for {idleThresholdMinutes} minute(s).
                            </span>
                        </label>

                        <div className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-3 text-xs text-gray-400">
                            Changes take effect immediately and are stored locally. Future builds will sync with the main process settings service.
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

type SwitchRowProps = {
    label: string;
    description?: string;
    checked: boolean;
    onToggle: (value: boolean) => void;
};

function SwitchRow({ label, description, checked, onToggle }: SwitchRowProps) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-transparent px-2 py-1 hover:border-gray-800">
            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-200">{label}</p>
                {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
            <button
                type="button"
                aria-pressed={checked}
                onClick={() => onToggle(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 ${
                    checked ? "bg-blue-500/80" : "bg-gray-700"
                }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        checked ? "translate-x-5" : "translate-x-1"
                    }`}
                />
            </button>
        </div>
    );
}