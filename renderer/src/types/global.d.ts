declare global {
  interface Window {
    electronAPI?: {
      windowControl: (action: string) => void;
    };
    api?: any; // future expanded typed API placeholder
  }
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

export {}; 