import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./routes/Dashboard";

import Sidebar from "./components/Sidebar";
import Titlebar from "./components/TitleBar";
import Powered from "./components/Powered";
import System from "./routes/System";
import AppUsage from "./routes/AppUsage";
import Focus from "./routes/Focus";
import Settings from "./routes/Setttings";

function App() {
  return (
    <div className="app-base shadow-xl overflow-hidden">
      <Titlebar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/system" element={<System />} />
            <Route path="/app-usage" element={<AppUsage />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <Powered />
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