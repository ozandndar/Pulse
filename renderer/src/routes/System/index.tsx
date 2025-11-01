import React from "react";
import { useSystemStats } from "./hooks/useSystemStats";

export default function System() {
  const { systemStats, loading, error } = useSystemStats();

  if (loading) {
    return (
      <div role="status" className="flex h-[24rem] w-full items-center justify-center">
        <svg
          aria-hidden="true"
          className="h-9 w-9 animate-spin fill-emerald-500 text-gray-700"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading system statistics…</span>
      </div>
    );
  }

  if (error) {
    return <p className="p-6 text-sm text-red-400">Error: {error}</p>;
  }

  if (!systemStats) {
    return <p className="p-6 text-sm text-gray-500">No system information available.</p>;
  }

  return (
    <div className="p-6 text-gray-100">
      <header className="flex flex-col gap-2 pb-6">
        <h1 className="text-3xl font-semibold text-white">System Monitor</h1>
        <p className="text-sm text-gray-400">
          Real-time CPU, memory, network, and process insights from your machine.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="CPU Usage"
          value={`${systemStats.cpu.usage}%`}
          subtitle={`${systemStats.cpu.cores} cores • User ${systemStats.cpu.userLoad}% • System ${systemStats.cpu.systemLoad}%`}
        />
        <MetricCard
          title="Memory"
          value={`${systemStats.memory.percent}%`}
          subtitle={`${systemStats.memory.usedGB} / ${systemStats.memory.totalGB} GB`}
        />
        <MetricCard
          title="Network"
          value={`↓ ${systemStats.network.rxSpeedMBs} MB/s`}
          subtitle={`↑ ${systemStats.network.txSpeedMBs} MB/s • ${systemStats.network.iface}`}
        />
        <MetricCard
          title="Battery"
          value={`${systemStats.battery.percent}%`}
          subtitle={systemStats.battery.charging ? "Charging" : "Discharging"}
        />
        <MetricCard
          title="Processes"
          value={`${systemStats.processes.running} running`}
          subtitle={`Total ${systemStats.processes.total}`}
        />
        <MetricCard
          title="System"
          value={systemStats.system.os}
          subtitle={`Uptime ${systemStats.system.uptimeHours}`}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/10">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">GPU</h2>
              <p className="text-xs text-gray-400">Current utilization and memory usage.</p>
            </div>
          </header>
          <div className="mt-4 space-y-4">
            {systemStats.gpu.length > 0 ? (
              systemStats.gpu.map((gpu, index) => (
                <article
                  key={`${gpu.name}-${index}`}
                  className="rounded-xl border border-gray-800/60 bg-gray-900/70 p-4"
                >
                  <h3 className="text-sm font-medium text-cyan-200">{gpu.name}</h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Usage</span>
                      <span className="font-semibold text-white">{gpu.usage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Memory</span>
                      <span className="font-semibold text-white">
                        {gpu.memoryUsedMB} / {gpu.memoryTotalMB} MB
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        style={{ width: `${Math.min(Math.max(gpu.usage, 4), 100)}%` }}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-gray-800/60 bg-gray-900/50 p-4 text-sm text-gray-500">
                No discrete GPU detected.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/10">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Disks</h2>
              <p className="text-xs text-gray-400">Mount utilization across volumes.</p>
            </div>
          </header>
          <div className="mt-4 space-y-4">
            {systemStats.disk.map((disk) => (
              <article
                key={disk.mount}
                className="rounded-xl border border-gray-800/60 bg-gray-900/70 p-4"
              >
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <div>
                    <p className="text-sm font-medium text-emerald-200">{disk.mount}</p>
                    <p className="text-xs text-gray-400">
                      {disk.usedGB} / {disk.totalGB} GB
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-white">{disk.percent}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400"
                    style={{ width: `${Math.min(Math.max(Number(disk.percent), 2), 100)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/10">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Top CPU Processes</h2>
              <p className="text-xs text-gray-400">Live CPU and memory usage by process.</p>
            </div>
          </header>

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-800">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-gray-900/80 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">Process</th>
                  <th scope="col" className="px-4 py-3 text-right">CPU</th>
                  <th scope="col" className="px-4 py-3 text-right">Memory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {systemStats.processes.topCpu.map((process, index) => (
                  <tr key={`${process.name}-${index}`} className="hover:bg-gray-900/60">
                    <td className="px-4 py-3 text-gray-200">{process.name}</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-medium">{Number(process.cpu).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right text-gray-400">{Number(process.mem).toFixed(2)}%</td>
                  </tr>
                ))}
                {systemStats.processes.topCpu.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                      No process samples available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/10">
      <span className="text-xs uppercase tracking-wide text-gray-400">{title}</span>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {subtitle && <p className="mt-2 text-xs text-gray-400">{subtitle}</p>}
    </article>
  );
}
