import DashboardCards from "./components/DashboardCards"
import { dashboardCards } from "./constants"

export default function Dashboard() {
    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-gray-400">Monitor your system performance and productivity metrics</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardCards.map(card => <DashboardCards key={card.id} {...card} />)}
            </div>
        </div>
    )
}