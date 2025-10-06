import React from "react";
import { useSystemStats } from "./hooks/useSystemStats";

export default function System() {
  const { systemStats, loading, error } = useSystemStats(3000); // fetch every 3s

  if (loading) return <p className="text-gray-400">Loading system stats...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!systemStats) return <p>No data available</p>;

  return (
    <div className="p-6 space-y-6 text-gray-100">
      <h1 className="text-2xl font-bold">System Monitor</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-sm text-gray-400">CPU Usage</h2>
          <p className="text-2xl font-bold">{systemStats.cpu.usage}%</p>
          <p className="text-xs text-gray-500">{systemStats.cpu.cores} cores</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-sm text-gray-400">Memory</h2>
          <p className="text-2xl font-bold">{systemStats.memory.percent}%</p>
          <p className="text-xs text-gray-500">
            {systemStats.memory.usedGB} / {systemStats.memory.totalGB} GB
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-sm text-gray-400">Network</h2>
          <p className="text-lg">
            <span className="text-green-400">⬇ {systemStats.network.rxSpeedMBs} MB/s</span>{" "}
            <span className="text-blue-400 ml-2">⬆ {systemStats.network.txSpeedMBs} MB/s</span>
          </p>
          <p className="text-xs text-gray-500">{systemStats.network.iface}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-sm text-gray-400">GPU</h2>
          {systemStats.gpu.length ? (
            <>
              <p className="text-lg font-bold">{systemStats.gpu[0].name}</p>
              <p className="text-2xl">{systemStats.gpu[0].usage}%</p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No GPU data</p>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-sm text-gray-400">Battery</h2>
          <p className="text-2xl font-bold">{systemStats.battery.percent}%</p>
          <p className="text-xs text-gray-500">
            {systemStats.battery.charging ? "Charging" : "Discharging"}
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-sm text-gray-400">Processes</h2>
          <p className="text-lg">{systemStats.processes.running} running</p>
          <p className="text-xs text-gray-500">Total: {systemStats.processes.total}</p>
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg mt-6">
        <h2 className="text-lg font-semibold mb-3">Top CPU Processes</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="text-left">Name</th>
              <th className="text-right">CPU %</th>
              <th className="text-right">Mem %</th>
            </tr>
          </thead>
          <tbody>
            {systemStats.processes.topCpu.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td className="text-right">{Number(p.cpu).toPrecision(4)}</td>
                <td className="text-right">{Number(p.mem).toPrecision(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
