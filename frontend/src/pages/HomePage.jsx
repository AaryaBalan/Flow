import React from 'react'
import { Bell, CheckCircle, Users, MessageSquare, AlertCircle, GitBranch, FileText, Clock } from 'lucide-react'

const HomePage = () => {
    const notifications = [
        {
            id: 1,
            type: 'task_completed',
            icon: CheckCircle,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-50',
            user: 'Jane Smith',
            action: 'completed the task',
            target: '"Design UI components"',
            project: 'E-commerce Platform',
            time: '5 minutes ago',
            isNew: true
        },
        {
            id: 2,
            type: 'member_joined',
            icon: Users,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            user: 'Mike Johnson',
            action: 'joined the project',
            target: '"Mobile App"',
            project: null,
            time: '15 minutes ago',
            isNew: true
        },
        {
            id: 3,
            type: 'new_message',
            icon: MessageSquare,
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            user: 'Sarah Williams',
            action: 'sent a message in',
            target: '"Dashboard UI"',
            project: 'Project Chat',
            time: '1 hour ago',
            isNew: true
        },
        {
            id: 4,
            type: 'task_assigned',
            icon: AlertCircle,
            iconColor: 'text-orange-600',
            bgColor: 'bg-orange-50',
            user: 'John Doe',
            action: 'assigned you to',
            target: '"Implement authentication"',
            project: 'E-commerce Platform',
            time: '2 hours ago',
            isNew: false
        },
        {
            id: 5,
            type: 'project_update',
            icon: GitBranch,
            iconColor: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            user: 'Tom Brown',
            action: 'updated the project',
            target: '"Mobile App"',
            project: 'Progress: 45% → 52%',
            time: '3 hours ago',
            isNew: false
        },
        {
            id: 6,
            type: 'document_shared',
            icon: FileText,
            iconColor: 'text-teal-600',
            bgColor: 'bg-teal-50',
            user: 'Emily Chen',
            action: 'shared a document',
            target: '"API Documentation"',
            project: 'E-commerce Platform',
            time: '5 hours ago',
            isNew: false
        },
        {
            id: 7,
            type: 'deadline_reminder',
            icon: Clock,
            iconColor: 'text-red-600',
            bgColor: 'bg-red-50',
            user: 'System',
            action: 'reminder',
            target: '"Dashboard UI deadline in 2 days"',
            project: null,
            time: '6 hours ago',
            isNew: false
        },
        {
            id: 8,
            type: 'task_completed',
            icon: CheckCircle,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-50',
            user: 'Alex Martinez',
            action: 'completed the task',
            target: '"Setup project structure"',
            project: 'Mobile App',
            time: 'Yesterday',
            isNew: false
        }
    ]

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">
                            Activity Feed
                        </h1>
                        <p className="text-slate-600">
                            Stay updated with all your project activities
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Bell className="w-6 h-6 text-slate-600" />
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                            {notifications.filter(n => n.isNew).length} new
                        </span>
                    </div>
                </div>
            </div>

            {/* Notifications Feed */}
            <div className="space-y-3">
                {notifications.map(notification => {
                    const Icon = notification.icon
                    return (
                        <div
                            key={notification.id}
                            className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all border ${notification.isNew ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'} overflow-hidden`}
                        >
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 ${notification.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-6 h-6 ${notification.iconColor}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex-1">
                                                <p className="text-slate-800 leading-relaxed">
                                                    <span className="font-semibold">{notification.user}</span>
                                                    <span className="text-slate-600"> {notification.action} </span>
                                                    <span className="font-medium text-slate-800">{notification.target}</span>
                                                </p>
                                                {notification.project && (
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {notification.project}
                                                    </p>
                                                )}
                                            </div>
                                            {notification.isNew && (
                                                <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold shrink-0">
                                                    NEW
                                                </span>
                                            )}
                                        </div>

                                        {/* Time and Avatar */}
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="w-7 h-7 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">{getInitials(notification.user)}</span>
                                            </div>
                                            <span className="text-sm text-slate-500">{notification.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Load More */}
            <div className="flex justify-center pt-4">
                <button className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    Load More Activities
                </button>
            </div>
        </div>
    )
}

export default HomePage
