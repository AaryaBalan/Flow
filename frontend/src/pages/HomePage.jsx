import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle, Users, MessageSquare, AlertCircle, FileText, Clock, TrendingUp, Folder, Plus, Calendar, Activity, AlertTriangle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import API_BASE_URL from '../config/api'

const HomePage = () => {
    const navigate = useNavigate()
    const [currentUser, setCurrentUser] = useState(null)
    const [projects, setProjects] = useState([])
    const [recentActivities, setRecentActivities] = useState([])
    const [overdueTasks, setOverdueTasks] = useState([])
    const [upcomingTasks, setUpcomingTasks] = useState([])
    const [pendingTasks, setPendingTasks] = useState([])
    const [showAllOverdue, setShowAllOverdue] = useState(false)
    const [showAllUpcoming, setShowAllUpcoming] = useState(false)
    const [showAllPending, setShowAllPending] = useState(false)
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
        if (user) {
            fetchDashboardData(user.id)
        }
    }, [])

    const fetchDashboardData = async (userId) => {
        try {
            setLoading(true)

            // Fetch all projects
            console.log('Fetching projects for user:', userId)
            const projectsRes = await axios.get(`${API_BASE_URL}/api/projects/user/${userId}`)
            console.log('Projects response:', projectsRes.data)

            const userProjects = projectsRes.data?.projects || []
            setProjects(userProjects.slice(0, 6)) // Show only 6 recent projects

            // Fetch activities from all projects
            const activities = []
            const allOverdueTasks = []
            const allUpcomingTasks = []
            const allPendingTasks = []
            let totalTasks = 0
            let completedTasks = 0

            for (const project of userProjects) {
                try {
                    // Fetch tasks for this project
                    console.log(`Fetching tasks for project ${project.id}`)
                    const tasksRes = await axios.get(`${API_BASE_URL}/api/tasks/project/${project.id}`)
                    const tasks = tasksRes.data?.tasks || tasksRes.data || []
                    console.log(`Tasks for project ${project.id}:`, tasks)

                    totalTasks += tasks.length
                    completedTasks += tasks.filter(t => t.completed).length

                    // Categorize tasks by due date status
                    tasks.forEach(task => {
                        if (!task.completed) {
                            if (task.dueDate) {
                                const dueDate = new Date(task.dueDate)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                dueDate.setHours(0, 0, 0, 0)

                                const diffTime = dueDate - today
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                                if (diffDays < 0) {
                                    // Overdue task
                                    allOverdueTasks.push({
                                        ...task,
                                        projectTitle: project.title,
                                        projectId: project.id
                                    })
                                } else {
                                    // Upcoming task
                                    allUpcomingTasks.push({
                                        ...task,
                                        projectTitle: project.title,
                                        projectId: project.id
                                    })
                                }
                            } else {
                                // Pending task (no due date)
                                allPendingTasks.push({
                                    ...task,
                                    projectTitle: project.title,
                                    projectId: project.id
                                })
                            }
                        }
                    })

                    // Add task activities
                    tasks.slice(0, 3).forEach(task => {
                        activities.push({
                            id: `task-${task.id}`,
                            type: task.completed ? 'task_completed' : 'task_pending',
                            icon: task.completed ? CheckCircle : Clock,
                            iconColor: task.completed ? 'text-green-600' : 'text-orange-600',
                            bgColor: task.completed ? 'bg-green-50' : 'bg-orange-50',
                            action: task.completed ? 'completed task' : 'working on',
                            target: task.title,
                            project: project.title,
                            projectId: project.id,
                            time: formatTime(task.createdAt),
                            isNew: isRecent(task.createdAt)
                        })
                    })

                    // Fetch project members
                    const membersRes = await axios.get(`${API_BASE_URL}/api/projects/${project.id}/members`)
                    const members = membersRes.data?.members || []

                    if (members.length > 0) {
                        activities.push({
                            id: `project-${project.id}-members`,
                            type: 'team_activity',
                            icon: Users,
                            iconColor: 'text-blue-600',
                            bgColor: 'bg-blue-50',
                            action: `${members.length} team members in`,
                            target: project.title,
                            project: `${members.length} collaborators`,
                            projectId: project.id,
                            time: formatTime(project.createdAt),
                            isNew: false
                        })
                    }
                } catch (err) {
                    console.error(`Error fetching data for project ${project.id}:`, err.response?.data || err.message)
                }
            }

            // Sort activities by recent
            activities.sort((a, b) => b.isNew - a.isNew)
            setRecentActivities(activities.slice(0, 15))

            // Sort and set categorized tasks
            allOverdueTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)) // Earliest overdue first
            allUpcomingTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)) // Earliest upcoming first
            setOverdueTasks(allOverdueTasks)
            setUpcomingTasks(allUpcomingTasks)
            setPendingTasks(allPendingTasks)

            setStats({
                totalProjects: userProjects.length,
                totalTasks,
                completedTasks,
                pendingTasks: totalTasks - completedTasks
            })

            console.log('Dashboard data loaded successfully')
        } catch (error) {
            console.error('Error fetching dashboard data:', error.response?.data || error.message)
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load dashboard data'
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Recently'

        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        return date.toLocaleDateString()
    }

    const isRecent = (timestamp) => {
        if (!timestamp) return false
        const diffMs = new Date() - new Date(timestamp)
        return diffMs < 3600000 // Within 1 hour
    }

    const getInitials = (name) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const getProgressColor = (percentage) => {
        if (percentage >= 75) return 'bg-green-500'
        if (percentage >= 50) return 'bg-blue-500'
        if (percentage >= 25) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const formatDueDate = (dueDateString) => {
        if (!dueDateString) return null

        const dueDate = new Date(dueDateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dueDate.setHours(0, 0, 0, 0)

        const diffTime = dueDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
            return {
                text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`,
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                urgent: true
            }
        } else if (diffDays === 0) {
            return {
                text: 'Due Today',
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                urgent: true
            }
        } else if (diffDays === 1) {
            return {
                text: 'Due Tomorrow',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                urgent: false
            }
        } else if (diffDays <= 7) {
            return {
                text: `Due in ${diffDays} days`,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                urgent: false
            }
        } else {
            const dateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            return {
                text: `Due ${dateStr}`,
                color: 'text-slate-600',
                bgColor: 'bg-slate-50',
                borderColor: 'border-slate-200',
                urgent: false
            }
        }
    }

    const formatShortDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 sm:p-8 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                            Welcome back, {currentUser?.name || 'User'}!
                        </h1>
                        <p className="text-blue-100">
                            Here's what's happening with your projects today
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/projects')}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">New Project</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.totalProjects}</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Total Projects</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.totalTasks}</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Total Tasks</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.completedTasks}</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Completed</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.pendingTasks}</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Pending</p>
                </div>
            </div>

            {/* Calendar Planner - Upcoming Tasks */}
            {/* Task Sections */}
            <div className="space-y-6">
                {/* Overdue Tasks */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Overdue Tasks</h2>
                        </div>
                        {overdueTasks.length > 0 && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs sm:text-sm font-semibold animate-pulse">
                                {overdueTasks.length} overdue
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    ) : overdueTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
                            <p className="text-sm font-medium">No overdue tasks</p>
                            <p className="text-xs mt-1">Great job staying on track!</p>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                {(showAllOverdue ? overdueTasks : overdueTasks.slice(0, 5)).map(task => {
                                    const dueDateInfo = formatDueDate(task.dueDate)
                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => navigate(`/project/${task.projectId}/task`)}
                                            className={`p-3 sm:p-4 rounded-lg border-2 ${dueDateInfo.borderColor} ${dueDateInfo.bgColor} hover:shadow-md transition-all cursor-pointer ring-2 ring-offset-2 ring-red-200 animate-pulse`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className={`px-2 py-1 rounded text-xs font-bold ${dueDateInfo.bgColor} ${dueDateInfo.color}`}>
                                                    {formatShortDate(task.dueDate)}
                                                </div>
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                            </div>

                                            <h3 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">
                                                {task.title}
                                            </h3>

                                            <p className="text-xs text-slate-600 mb-2 truncate">
                                                {task.projectTitle}
                                            </p>

                                            {task.description && (
                                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${dueDateInfo.color}`}>
                                                <Clock className="w-3 h-3" />
                                                <span>{dueDateInfo.text}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {!showAllOverdue && overdueTasks.length > 5 && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={() => setShowAllOverdue(true)}
                                        className="px-6 py-2 text-sm sm:text-base font-semibold text-red-600 hover:text-red-700 border-2 border-red-200 hover:border-red-300 rounded-lg transition-all"
                                    >
                                        Show More ({overdueTasks.length - 5} more)
                                    </button>
                                </div>
                            )}

                            {showAllOverdue && overdueTasks.length > 5 && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={() => setShowAllOverdue(false)}
                                        className="px-6 py-2 text-sm sm:text-base font-semibold text-slate-600 hover:text-slate-700 border-2 border-slate-300 hover:border-slate-400 rounded-lg transition-all"
                                    >
                                        Show Less
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Upcoming Tasks */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Upcoming Tasks</h2>
                        </div>
                        {upcomingTasks.length > 0 && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs sm:text-sm font-semibold">
                                {upcomingTasks.length} upcoming
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : upcomingTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">No upcoming deadlines</p>
                            <p className="text-xs mt-1">Tasks with due dates will appear here</p>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                {(showAllUpcoming ? upcomingTasks : upcomingTasks.slice(0, 5)).map(task => {
                                    const dueDateInfo = formatDueDate(task.dueDate)
                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => navigate(`/project/${task.projectId}/task`)}
                                            className={`p-3 sm:p-4 rounded-lg border-2 ${dueDateInfo.borderColor} ${dueDateInfo.bgColor} hover:shadow-md transition-all cursor-pointer ${dueDateInfo.urgent ? 'ring-2 ring-offset-2 ring-orange-200' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className={`px-2 py-1 rounded text-xs font-bold ${dueDateInfo.bgColor} ${dueDateInfo.color}`}>
                                                    {formatShortDate(task.dueDate)}
                                                </div>
                                                {dueDateInfo.urgent && (
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                )}
                                            </div>

                                            <h3 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">
                                                {task.title}
                                            </h3>

                                            <p className="text-xs text-slate-600 mb-2 truncate">
                                                {task.projectTitle}
                                            </p>

                                            {task.description && (
                                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${dueDateInfo.color}`}>
                                                <Clock className="w-3 h-3" />
                                                <span>{dueDateInfo.text}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {!showAllUpcoming && upcomingTasks.length > 5 && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={() => setShowAllUpcoming(true)}
                                        className="px-6 py-2 text-sm sm:text-base font-semibold text-indigo-600 hover:text-indigo-700 border-2 border-indigo-200 hover:border-indigo-300 rounded-lg transition-all"
                                    >
                                        Show More ({upcomingTasks.length - 5} more)
                                    </button>
                                </div>
                            )}

                            {showAllUpcoming && upcomingTasks.length > 5 && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={() => setShowAllUpcoming(false)}
                                        className="px-6 py-2 text-sm sm:text-base font-semibold text-slate-600 hover:text-slate-700 border-2 border-slate-300 hover:border-slate-400 rounded-lg transition-all"
                                    >
                                        Show Less
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pending Tasks */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Pending Tasks</h2>
                        </div>
                        {pendingTasks.length > 0 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-semibold">
                                {pendingTasks.length} pending
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                    ) : pendingTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
                            <p className="text-sm font-medium">No pending tasks</p>
                            <p className="text-xs mt-1">All tasks have due dates or are completed</p>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                {(showAllPending ? pendingTasks : pendingTasks.slice(0, 5)).map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/project/${task.projectId}/task`)}
                                        className="p-3 sm:p-4 rounded-lg border-2 border-orange-200 bg-orange-50 hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">
                                                No Due Date
                                            </div>
                                        </div>

                                        <h3 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">
                                            {task.title}
                                        </h3>

                                        <p className="text-xs text-slate-600 mb-2 truncate">
                                            {task.projectTitle}
                                        </p>

                                        {task.description && (
                                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-600">
                                            <Clock className="w-3 h-3" />
                                            <span>Pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!showAllPending && pendingTasks.length > 5 && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={() => setShowAllPending(true)}
                                        className="px-6 py-2 text-sm sm:text-base font-semibold text-orange-600 hover:text-orange-700 border-2 border-orange-200 hover:border-orange-300 rounded-lg transition-all"
                                    >
                                        Show More ({pendingTasks.length - 5} more)
                                    </button>
                                </div>
                            )}

                            {showAllPending && pendingTasks.length > 5 && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={() => setShowAllPending(false)}
                                        className="px-6 py-2 text-sm sm:text-base font-semibold text-slate-600 hover:text-slate-700 border-2 border-slate-300 hover:border-slate-400 rounded-lg transition-all"
                                    >
                                        Show Less
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Projects */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Recent Projects</h2>
                        <button
                            onClick={() => navigate('/projects')}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View All
                        </button>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No projects yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map(project => {
                                const progress = project.progress || 0
                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => navigate(`/project/${project.id}/task`)}
                                        className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-slate-800 text-sm truncate flex-1">
                                                {project.title}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                            {project.description || 'No description'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getProgressColor(progress)} transition-all`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-slate-600">
                                                {progress}%
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Activity Feed</h2>
                                {recentActivities.filter(a => a.isNew).length > 0 && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                        {recentActivities.filter(a => a.isNew).length} new
                                    </span>
                                )}
                            </div>
                            <Bell className="w-5 h-5 text-slate-600" />
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            </div>
                        ) : recentActivities.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Activity className="w-16 h-16 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">No activities yet</p>
                                <p className="text-sm">Start creating projects and tasks to see activity here</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {recentActivities.map(activity => {
                                    const Icon = activity.icon
                                    return (
                                        <div
                                            key={activity.id}
                                            onClick={() => activity.projectId && navigate(`/project/${activity.projectId}/task`)}
                                            className={`p-3 sm:p-4 rounded-lg border transition-all ${activity.isNew
                                                ? 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/50'
                                                : 'border-slate-100 hover:border-slate-200'
                                                } ${activity.projectId ? 'cursor-pointer' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 ${activity.bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                                                    <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-800">
                                                        <span className="font-medium">{activity.action}</span>
                                                        {' '}
                                                        <span className="font-semibold">{activity.target}</span>
                                                    </p>
                                                    {activity.project && (
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {activity.project}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xs text-slate-400">{activity.time}</span>
                                                        {activity.isNew && (
                                                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage
