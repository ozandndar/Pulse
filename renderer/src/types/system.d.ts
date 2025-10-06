export interface SystemStats {
  system: {
    os: string;
    uptimeHours: string;
  };
  cpu: {
    usage: string;
    cores: number;
    userLoad: string;
    systemLoad: string;
  };
  memory: {
    usedGB: string;
    totalGB: string;
    percent: string;
  };
  gpu: {
    name: string;
    usage: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
  }[];
  disk: {
    mount: string;
    usedGB: string;
    totalGB: string;
    percent: string;
  }[];
  network: {
    iface: string;
    rxSpeedMBs: string;
    txSpeedMBs: string;
  };
  battery: {
    percent: number;
    charging: boolean;
  };
  processes: {
    total: number;
    running: number;
    topCpu: { name: string; cpu: string; mem: string }[];
  };
}