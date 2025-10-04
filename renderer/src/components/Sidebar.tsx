import { NavLink } from "react-router-dom";
import { HomeIcon, CpuChipIcon, ChartBarIcon, WifiIcon, ClockIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

const navItems = [
  { to: "/", label: "Dashboard", icon: HomeIcon },
  { to: "/system", label: "System", icon: CpuChipIcon },
  { to: "/app-usage", label: "App Usage", icon: ChartBarIcon },
  { to: "/network", label: "Network", icon: WifiIcon },
  { to: "/focus", label: "Focus", icon: ClockIcon },
  { to: "/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-gray-200 h-screen flex flex-col">
      <div className="p-4 text-xl font-bold text-white border-b border-gray-700">
        Pulse
      </div>
      <nav className="flex-1 p-4 space-y-2">
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
    </aside>
  );
}
