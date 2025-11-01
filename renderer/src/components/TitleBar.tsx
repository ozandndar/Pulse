import { useEffect } from "react";

export default function Titlebar() {
  const handleWindow = (action: string) => {
    window.electronAPI?.windowControl(action);
  };

  return (
    <div className="flex justify-between items-center bg-gray-800 text-white px-4 py-2 select-none"
         style={{ WebkitAppRegion: "drag" }}>
      <span className="text-sm font-semibold"></span>
      <div className="flex space-x-3"
           style={{ WebkitAppRegion: "no-drag" }}>
        <button onClick={() => handleWindow("minimize")}>➖</button>
        <button onClick={() => handleWindow("maximize")}>🗖</button>
        <button onClick={() => handleWindow("close")}>✖</button>
      </div>
    </div>
  );
}
