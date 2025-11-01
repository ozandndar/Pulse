declare global {
  interface Window {
    electronAPI?: {
      windowControl: (action: string) => void;
    };
    systemAPI?: {
      getStats: () => Promise<any>
    },
    appUsageAPI?: {
      getActiveWindow: () => Promise<any>,
      listAllWindows: () => Promise<any>,
      getSummary: (args: any) => Promise<any>,
      getTodaySummary: () => Promise<any>,
      getEntries: (args: any) => Promise<any>
    }
  }
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

export {}; 