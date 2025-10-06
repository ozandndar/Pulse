import { Link } from "react-router-dom";
import { IDashboardCard } from "../types/DashboardTypes";

export default function DashboardCards(props: IDashboardCard) {
    const { id, description, name, path, icon: Icon } = props;
    return (
        <Link to={path} className="block">
            <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20 group h-50">
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors duration-200">
                            {name}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
                <div className="mt-auto mb-0 flex items-center align-end text-blue-400 text-sm">
                    <span>View details</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    )
}