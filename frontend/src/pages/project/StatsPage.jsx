import React from 'react'
import { TrendingUp, Users, CheckCircle, Clock } from 'lucide-react'

const StatsPage = () => {
    const stats = [
        { id: 1, label: 'Total Tasks', value: '24', icon: CheckCircle, color: 'blue' },
        { id: 2, label: 'Completed', value: '18', icon: TrendingUp, color: 'green' },
        { id: 3, label: 'Team Members', value: '5', icon: Users, color: 'purple' },
        { id: 4, label: 'Hours Spent', value: '156', icon: Clock, color: 'orange' },
    ]

    const recentActivity = [
        { id: 1, user: 'John Doe', action: 'completed task "Setup Database"', time: '2 hours ago' },
        { id: 2, user: 'Jane Smith', action: 'added new task "Design Landing Page"', time: '4 hours ago' },
        { id: 3, user: 'Mike Johnson', action: 'commented on "UI Components"', time: '5 hours ago' },
        { id: 4, user: 'Sarah Williams', action: 'joined the project', time: '1 day ago' },
    ]

    const getColorClasses = (color) => {
        const colors = {
            blue: 'from-blue-600 to-blue-700',
            green: 'from-green-600 to-green-700',
            purple: 'from-purple-600 to-purple-700',
            orange: 'from-orange-600 to-orange-700',
        }
        return colors[color] || colors.blue
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Project Statistics</h2>
                <p className="text-slate-600 mt-1">Overview of project performance and activity</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => {
                    const Icon = stat.icon
                    return (
                        <div key={stat.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 bg-linear-to-br ${getColorClasses(stat.color)} rounded-lg flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
                            <div className="text-sm text-slate-600">{stat.label}</div>
                        </div>
                    )
                })}
            </div>

            {/* Progress Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Project Progress</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Completion Rate</span>
                            <span className="text-sm font-bold text-slate-800">75%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                            <div className="bg-linear-to-r from-blue-600 to-indigo-600 h-3 rounded-full" style={{ width: '75%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {recentActivity.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0" />
                            <div className="flex-1">
                                <p className="text-slate-700">
                                    <span className="font-semibold">{activity.user}</span> {activity.action}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default StatsPage
