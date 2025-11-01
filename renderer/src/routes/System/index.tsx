import React from "react";
import { useSystemStats } from "./hooks/useSystemStats";

export default function System() {
  const { systemStats, loading, error } = useSystemStats();

  if (loading) return (<div role="status" className="w-full h-150 flex items-center justify-center">
    <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
    </svg>
    <span className="sr-only">Loading...</span>
  </div>
  );
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
