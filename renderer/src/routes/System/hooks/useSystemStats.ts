import React, { useEffect, useState } from 'react';
import { SystemStats } from '../../../types/system';

export function useSystemStats(intervalMs = 5000) {
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState<Boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const stats = await window.systemAPI?.getStats();
            setSystemStats(stats);
            setError(null);
            setLoading(false);
        } catch (error: any) {
            setError(error.message);
        }
    };
    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, intervalMs);
        return () => clearInterval(interval)
    }, []);

    return { systemStats, error, loading }
}