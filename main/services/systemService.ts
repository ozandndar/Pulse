import si from "systeminformation";

export async function getSystemStats() {
  const [
    cpu,
    mem,
    gpu,
    network,
    battery,
    os,
    fs,
    processes
  ] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.graphics(),
    si.networkStats(),
    si.battery(),
    si.osInfo(),
    si.fsSize(),
    si.processes(),
  ]);

  const bytesToGB = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(2);
  const bytesToMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

  return {
    system: {
      os: `${os.distro} ${os.release} (${os.arch})`,
      uptimeHours: (process.uptime() / 3600).toFixed(1),
    },
    cpu: {
      usage: cpu.currentLoad.toFixed(1),
      cores: cpu.cpus.length,
      userLoad: cpu.currentLoadUser.toFixed(1),
      systemLoad: cpu.currentLoadSystem.toFixed(1),
    },
    memory: {
      usedGB: bytesToGB(mem.active),
      totalGB: bytesToGB(mem.total),
      percent: ((mem.active / mem.total) * 100).toFixed(1),
    },
    gpu: gpu.controllers.map((g) => ({
      name: g.model,
      usage: g.utilizationGpu ?? 0,
      memoryUsedMB: g.memoryUsed,
      memoryTotalMB: g.memoryTotal,
    })),
    disk: fs.map((d) => ({
      mount: d.mount,
      usedGB: bytesToGB(d.used),
      totalGB: bytesToGB(d.size),
      percent: d.use.toFixed(1),
    })),
    network: {
      iface: network[0].iface,
      rxMB: bytesToMB(network[0].rx_bytes),
      txMB: bytesToMB(network[0].tx_bytes),
      rxSpeedMBs: (network[0].rx_sec / 1024 / 1024).toFixed(2),
      txSpeedMBs: (network[0].tx_sec / 1024 / 1024).toFixed(2),
    },
    battery: {
      percent: battery.percent,
      charging: battery.isCharging,
    },
    processes: {
      total: processes.all,
      running: processes.running,
      topCpu: processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 5)
        .map((p) => ({ name: p.name, cpu: p.cpu, mem: p.mem })),
    },
  };
}
