declare global {
  interface Window {
    electronAPI?: {
      windowControl: (action: string) => void;
    };
    systemAPI?: {
      getStats: () => Promise<any>
    }
  }
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

export {}; 