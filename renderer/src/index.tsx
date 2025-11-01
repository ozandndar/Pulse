import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./routes/Dashboard";

import Sidebar from "./components/Sidebar";
import Titlebar from "./components/TitleBar";
import System from "./routes/System";
import AppUsage from "./routes/AppUsage";
import Focus from "./routes/Focus";
import Settings from "./routes/Setttings";

function App() {
  return (
    <div className="app-base flex h-screen flex-col overflow-hidden shadow-xl">
      <Titlebar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/system" element={<System />} />
            <Route path="/app-usage" element={<AppUsage />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <App />
  </HashRouter>
);

declare global {
  interface Window {
    electron: any;
  }
}