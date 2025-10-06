import { CpuChipIcon, ChartBarIcon, ClockIcon } from "@heroicons/react/24/outline";


export const dashboardCards = [
    {
        id: 'system',
        name: 'System',
        description: 'Monitor CPU, memory, and GPU performance in real-time',
        icon: CpuChipIcon,
        path: '/system'
    },
    {
        id: 'appUsage',
        name: 'App Usage',
        description: 'Track application usage patterns and productivity metrics',
        icon: ChartBarIcon,
        path: '/app-usage'
    },
    {
        id: 'focus',
        name: 'Focus',
        description: 'Analyze focus sessions and productivity time blocks',
        icon: ClockIcon,
        path: '/focus'
    }
];