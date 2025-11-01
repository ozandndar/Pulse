import { NavLink } from "react-router-dom";
import { HomeIcon, CpuChipIcon, ChartBarIcon, ClockIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

import Powered from "./Powered";
import pulseLogo from "../assets/pulse_logo.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: HomeIcon },
  { to: "/system", label: "System", icon: CpuChipIcon },
  { to: "/app-usage", label: "App Usage", icon: ChartBarIcon },
  { to: "/focus", label: "Focus", icon: ClockIcon },
  { to: "/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-50 min-h-0 flex-col border-r border-t border-gray-700 bg-gray-800 text-gray-200">
      <div className="flex items-center gap-3 border-b border-gray-700/80 px-4 py-5">
        <img src={pulseLogo} alt="Pulse" className="h-10 w-auto" />
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon className="w-5 h-5 mr-3" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-700/80 p-4">
        <Powered />
      </div>
    </aside>
  );
}
