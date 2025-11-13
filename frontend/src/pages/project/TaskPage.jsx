import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, CheckCircle, Circle, X, User, Lock, LockOpen, Trash2, RefreshCw, Calendar, Clock } from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast';
import API_BASE_URL from '../../config/api'

const TaskPage = () => {
    const { projectId } = useParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        onlyAuthorCanComplete: false,
        hasDueDate: false,
        dueDate: ''
    })
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)

    // Load current user
    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            try {
                const userData = JSON.parse(userStr)
                setCurrentUser(userData)
            } catch (error) {
                console.error('Error parsing user data:', error)
            }
        }
    }, [])

    // Fetch tasks when component mounts or projectId changes
    useEffect(() => {
        if (projectId) {
            fetchTasks(false) // Initial load

            // Set up auto-refresh every 10 seconds to sync with other users
            // Only refresh when tab is visible to save resources
            const refreshInterval = setInterval(() => {
                // Check if page is visible before refreshing
                if (document.visibilityState === 'visible') {
                    fetchTasks(true) // Auto-refresh
                }
            }, 5000) // Refresh every 10 seconds (reduced from 5)

            // Also refresh when user comes back to the tab
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    fetchTasks(true)
                }
            }
            document.addEventListener('visibilitychange', handleVisibilityChange)

            // Cleanup interval and event listener on unmount
            return () => {
                clearInterval(refreshInterval)
                document.removeEventListener('visibilitychange', handleVisibilityChange)
            }
        }
    }, [projectId])

    const fetchTasks = async (isAutoRefresh = false) => {
        try {
            // Only show main loading spinner on initial load, not on auto-refresh
            if (!isAutoRefresh) {
                setIsLoading(true)
            } else {
                setIsRefreshing(true)
            }

            const response = await axios.get(`${API_BASE_URL}/api/tasks/project/${projectId}`)

            if (response.data.success) {
                setTasks(response.data.tasks)
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
            if (!isAutoRefresh) {
                toast.error('Failed to load tasks')
            }
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!currentUser?.id) {
            toast.error('Please log in to create a task')
            return
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/tasks/create`, {
                projectId: projectId,
                title: formData.title,
                description: formData.description,
                taskAuthor: currentUser.name || currentUser.email?.split('@')[0] || 'User',
                taskAuthorId: currentUser.id,
                onlyAuthorCanComplete: formData.onlyAuthorCanComplete,
                dueDate: formData.hasDueDate ? formData.dueDate : null
            })

            if (response.data.success) {
                toast.success('Task created successfully!')
                await fetchTasks() // Refresh tasks list
                setIsModalOpen(false)
                setFormData({
                    title: '',
                    description: '',
                    onlyAuthorCanComplete: false,
                    hasDueDate: false,
                    dueDate: ''
                })
            }
        } catch (error) {
            console.error('Error creating task:', error)
            toast.error(error.response?.data?.message || 'Failed to create task')
        }
    }

    const toggleTask = async (taskId, task) => {
        if (!currentUser?.id) {
            toast.error('Please log in to update tasks')
            return
        }

        // Check if user can modify this task (both complete and uncomplete)
        if (task.onlyAuthorCanComplete && task.taskAuthorId != currentUser.id) {
            toast.error('This task is restricted! Only the task author can modify it.')
            return
        }

        try {
            const response = await axios.put(`${API_BASE_URL}/api/tasks/${taskId}/toggle`, {
                userId: currentUser.id,
                userName: currentUser.name || currentUser.email?.split('@')[0] || 'User'
            })

            if (response.data.success) {
                toast.success(response.data.message)
                // Always refresh tasks to get the latest state from server
                await fetchTasks()
            } else {
                // If server indicates failure, refresh to show correct state
                await fetchTasks()
                toast.error(response.data.message || 'Failed to update task')
            }
        } catch (error) {
            console.error('Error toggling task:', error)
            // Refresh tasks even on error to sync with server state
            await fetchTasks()
            toast.error(error.response?.data?.message || 'Failed to update task')
        }
    }

    const deleteTask = async (taskId) => {
        if (!currentUser?.id) {
            toast.error('Please log in to delete tasks')
            return
        }

        if (!window.confirm('Are you sure you want to delete this task?')) {
            return
        }

        try {
            const response = await axios.delete(`${API_BASE_URL}/api/tasks/${taskId}`, {
                data: { userId: currentUser.id }
            })

            if (response.data.success) {
                toast.success('Task deleted successfully!')
                await fetchTasks() // Refresh tasks list
            }
        } catch (error) {
            console.error('Error deleting task:', error)
            toast.error(error.response?.data?.message || 'Failed to delete task')
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

    const getTodayDate = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    return (
        <>
            <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Tasks</h2>
                        <p className="text-sm sm:text-base text-slate-600 mt-0.5 sm:mt-1 flex items-center gap-2">
                            {isLoading ? 'Loading...' : `${tasks.length} total tasks`}
                            {isRefreshing && (
                                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-600">
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    Syncing...
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => fetchTasks(false)}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh tasks"
                        >
                            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Add Task</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-8 sm:py-12">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                        <p className="text-sm sm:text-base text-slate-600">Loading tasks...</p>
                    </div>
                ) : (
                    <>
                        {/* Calendar Planner - Upcoming Tasks */}
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">Calendar Planner</h2>
                                </div>
                                {tasks.filter(task => task.dueDate && !task.completed).length > 0 && (
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs sm:text-sm font-semibold">
                                        {tasks.filter(task => task.dueDate && !task.completed).length} upcoming
                                    </span>
                                )}
                            </div>

                            {tasks.filter(task => task.dueDate && !task.completed).length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-medium">No upcoming deadlines</p>
                                    <p className="text-xs mt-1">Tasks with due dates will appear here</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                    {tasks
                                        .filter(task => task.dueDate && !task.completed)
                                        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                                        .map(task => {
                                            const dueDateInfo = formatDueDate(task.dueDate)

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`p-4 rounded-lg border-2 ${dueDateInfo.borderColor} ${dueDateInfo.bgColor} hover:shadow-md transition-all cursor-default`}
                                                >
                                                    {/* Date at top with urgent indicator */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className={`text-sm font-bold ${dueDateInfo.color}`}>
                                                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                        {dueDateInfo.urgent && (
                                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                        )}
                                                    </div>

                                                    {/* Task Title */}
                                                    <h4 className="font-bold text-slate-800 text-base mb-2 line-clamp-2">
                                                        {task.title}
                                                    </h4>

                                                    {/* Created by */}
                                                    <p className="text-sm text-slate-600 mb-2">
                                                        {task.taskAuthor}
                                                    </p>

                                                    {/* Description */}
                                                    {task.description && (
                                                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    )}

                                                    {/* Due Date Status */}
                                                    <div className={`flex items-center gap-1 text-xs font-medium ${dueDateInfo.color}`}>
                                                        <Clock className="w-3 h-3" />
                                                        <span>{dueDateInfo.text}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
                            {/* Pending Tasks */}
                            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                                    Pending Tasks ({tasks.filter(task => !task.completed).length})
                                </h3>
                                <div className="space-y-2.5 sm:space-y-3 min-h-[100px]">
                                    {tasks.filter(task => !task.completed).length === 0 ? (
                                        <div className="text-center py-6 sm:py-8 text-slate-400">
                                            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm sm:text-base">No pending tasks</p>
                                        </div>
                                    ) : (
                                        tasks.filter(task => !task.completed).map(task => {
                                            const isRestricted = task.onlyAuthorCanComplete && task.taskAuthorId != currentUser?.id
                                            return (
                                                <div
                                                    key={task.id}
                                                    className="p-3 sm:p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all"
                                                >
                                                    <div className="flex items-start gap-2 sm:gap-3">
                                                        <div
                                                            className={`mt-0.5 shrink-0 ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                            onClick={() => toggleTask(task.id, task)}
                                                            title={isRestricted ? 'Only author can complete this task' : 'Click to mark as complete'}
                                                        >
                                                            <Circle className={`w-4 h-4 sm:w-5 sm:h-5 ${isRestricted ? 'text-slate-300' : 'text-slate-400 hover:text-blue-600'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm sm:text-base text-slate-700 font-medium break-words">{task.title}</p>
                                                                    {task.description && (
                                                                        <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words">{task.description}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    {task.onlyAuthorCanComplete ? (
                                                                        <div
                                                                            className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-700 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap"
                                                                            title={isRestricted ? "You cannot complete this task - Only author can" : "Only you can complete this task"}
                                                                        >
                                                                            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                            {isRestricted && <span className="ml-0.5 sm:ml-1 hidden sm:inline">Restricted</span>}
                                                                        </div>
                                                                    ) : (
                                                                        ""
                                                                    )}
                                                                    {task.taskAuthorId == currentUser?.id && (
                                                                        <button
                                                                            onClick={() => deleteTask(task.id)}
                                                                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                                            title="Delete task"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
                                                                <div className="flex items-center gap-1">
                                                                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                    <span>Created by <span className="font-medium">{task.taskAuthor}</span></span>
                                                                </div>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="truncate">{formatDate(task.createdAt)}</span>
                                                            </div>
                                                            {task.dueDate && (
                                                                <div className={`flex items-center gap-1 mt-1.5 sm:mt-2 px-2 py-1 rounded text-[10px] sm:text-xs font-medium ${formatDueDate(task.dueDate).bgColor} ${formatDueDate(task.dueDate).color}`}>
                                                                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                    <span>{formatDueDate(task.dueDate).text}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Completed Tasks */}
                            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                                    Completed Tasks ({tasks.filter(task => task.completed).length})
                                </h3>
                                <div className="space-y-2.5 sm:space-y-3 min-h-[100px]">
                                    {tasks.filter(task => task.completed).length === 0 ? (
                                        <div className="text-center py-6 sm:py-8 text-slate-400">
                                            <Circle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm sm:text-base">No completed tasks</p>
                                        </div>
                                    ) : (
                                        tasks.filter(task => task.completed).map(task => {
                                            const isRestricted = task.onlyAuthorCanComplete && task.taskAuthorId != currentUser?.id
                                            return (
                                                <div
                                                    key={task.id}
                                                    className="p-3 sm:p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-slate-50 transition-all"
                                                >
                                                    <div className="flex items-start gap-2 sm:gap-3">
                                                        <div
                                                            className={`mt-0.5 shrink-0 ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                            onClick={() => toggleTask(task.id, task)}
                                                            title={isRestricted ? '🔒 Only author can modify this task' : 'Click to mark as incomplete'}
                                                        >
                                                            <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isRestricted ? 'text-green-400' : 'text-green-600 hover:text-green-700'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm sm:text-base text-slate-500 line-through font-medium break-words">{task.title}</p>
                                                                    {task.description && (
                                                                        <p className="text-xs sm:text-sm text-slate-400 mt-1 line-through break-words">{task.description}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    {task.onlyAuthorCanComplete ? (
                                                                        <div
                                                                            className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-700 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap"
                                                                            title={isRestricted ? "Restricted - Only author can modify" : "Author-only task"}
                                                                        >
                                                                            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                            {isRestricted && <span className="ml-0.5 sm:ml-1 hidden sm:inline">Restricted</span>}
                                                                        </div>
                                                                    ) : (
                                                                        ""
                                                                    )}
                                                                    {task.taskAuthorId == currentUser?.id && (
                                                                        <button
                                                                            onClick={() => deleteTask(task.id)}
                                                                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                                            title="Delete task"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-0.5 sm:space-y-1">
                                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
                                                                    <div className="flex items-center gap-1">
                                                                        <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                        <span>Created by <span className="font-medium">{task.taskAuthor}</span></span>
                                                                    </div>
                                                                    <span className="hidden sm:inline">•</span>
                                                                    <span className="truncate">{formatDate(task.createdAt)}</span>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-green-600">
                                                                    <div className="flex items-center gap-1">
                                                                        <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                        <span>Completed by <span className="font-medium">{task.completedBy}</span></span>
                                                                    </div>
                                                                    <span className="hidden sm:inline">•</span>
                                                                    <span className="truncate">{formatDate(task.completionDate)}</span>
                                                                </div>
                                                                {task.dueDate && (
                                                                    <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-medium bg-slate-100 text-slate-500">
                                                                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                        <span>Was due: {formatDate(task.dueDate)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Add Task Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-xl w-full">
                            {/* Modal Header */}
                            <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Add New Task</h2>
                                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">Create a new task for the project</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                {/* Task Title Field */}
                                <div>
                                    <label htmlFor="title" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                        Task Title *
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter task title"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Task Description Field */}
                                <div>
                                    <label htmlFor="description" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Enter task description (optional)"
                                        rows="3"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                {/* Author Field (Read-only) */}
                                <div>
                                    <label htmlFor="author" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        id="author"
                                        value={currentUser?.name?.toUpperCase() || currentUser?.email?.split('@')[0]?.toUpperCase() || 'USER'}
                                        readOnly
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                                    />
                                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">You will be set as the task author</p>
                                </div>

                                {/* Due Date Field with Toggle */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <label htmlFor="hasDueDate" className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5 sm:gap-2">
                                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
                                                <span>Set Due Date</span>
                                            </label>
                                            <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">
                                                Add a deadline for this task
                                            </p>
                                        </div>
                                        {/* Toggle Switch */}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, hasDueDate: !prev.hasDueDate }))}
                                            className={`shrink-0 outline-none relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${formData.hasDueDate ? 'bg-slate-600' : 'bg-slate-300'
                                                }`}
                                            role="switch"
                                            aria-checked={formData.hasDueDate}
                                            aria-labelledby="hasDueDate"
                                        >
                                            <span
                                                className={`outline-none inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${formData.hasDueDate ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Date Input - Show when toggle is ON */}
                                    {formData.hasDueDate && (
                                        <div className="mt-3">
                                            <input
                                                type="date"
                                                id="dueDate"
                                                name="dueDate"
                                                value={formData.dueDate}
                                                onChange={handleInputChange}
                                                min={getTodayDate()}
                                                required={formData.hasDueDate}
                                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Only Author Can Complete Toggle */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <label htmlFor="onlyAuthorCanComplete" className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5 sm:gap-2">
                                                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
                                                <span>Only I Can Complete This Task</span>
                                            </label>
                                            <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">
                                                When enabled, only you can mark this task as complete or incomplete. Other team members can view it but cannot modify its status.
                                            </p>
                                        </div>
                                        {/* Toggle Switch */}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, onlyAuthorCanComplete: !prev.onlyAuthorCanComplete }))}
                                            className={`shrink-0 outline-none relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.onlyAuthorCanComplete ? 'bg-blue-600' : 'bg-slate-300'
                                                }`}
                                            role="switch"
                                            aria-checked={formData.onlyAuthorCanComplete}
                                            aria-labelledby="onlyAuthorCanComplete"
                                        >
                                            <span
                                                className={`outline-none inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${formData.onlyAuthorCanComplete ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <Toaster position="bottom-right" />
        </>
    )
}

export default TaskPage
