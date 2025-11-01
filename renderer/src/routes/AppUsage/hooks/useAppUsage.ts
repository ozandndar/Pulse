import { useEffect, useState } from "react";

export function useAppUsage(pollMs = 1000): {win: any, allWins: any} {
    const [win, setWin] = useState(null);
    const [allWins, setAllWins] = useState<any[] | null>(null);

    useEffect(() => {
        try {
            const interval = setInterval(async () => {
                const [w, allW] = await Promise.all([window.appUsageAPI?.getActiveWindow(), window.appUsageAPI?.listAllWindows()]);
                setWin(w);
                setAllWins(allW)
            }, pollMs);

            return () => clearInterval(interval);
        } catch (error) {
            console.log(error);
        }
    }, []);
    console.log({win, allWins})
    return { win, allWins };
}