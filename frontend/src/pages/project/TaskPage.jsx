import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, CheckCircle, Circle, X, User, Lock, LockOpen, Trash2, RefreshCw } from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast';
import API_BASE_URL from '../../config/api'

const TaskPage = () => {
    const { projectId } = useParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        onlyAuthorCanComplete: false
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
                onlyAuthorCanComplete: formData.onlyAuthorCanComplete
            })

            if (response.data.success) {
                toast.success('Task created successfully!')
                await fetchTasks() // Refresh tasks list
                setIsModalOpen(false)
                setFormData({ title: '', description: '', onlyAuthorCanComplete: false })
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

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Tasks</h2>
                        <p className="text-slate-600 mt-1 flex items-center gap-2">
                            {isLoading ? 'Loading...' : `${tasks.length} total tasks`}
                            {isRefreshing && (
                                <span className="flex items-center gap-1 text-xs text-blue-600">
                                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    Syncing...
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchTasks(false)}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh tasks"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Add Task</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading tasks...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Pending Tasks */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                Pending Tasks ({tasks.filter(task => !task.completed).length})
                            </h3>
                            <div className="space-y-3 min-h-[100px]">
                                {tasks.filter(task => !task.completed).length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>No pending tasks</p>
                                    </div>
                                ) : (
                                    tasks.filter(task => !task.completed).map(task => {
                                        const isRestricted = task.onlyAuthorCanComplete && task.taskAuthorId != currentUser?.id
                                        return (
                                            <div
                                                key={task.id}
                                                className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`mt-0.5 ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                        onClick={() => toggleTask(task.id, task)}
                                                        title={isRestricted ? 'Only author can complete this task' : 'Click to mark as complete'}
                                                    >
                                                        <Circle className={`w-5 h-5 ${isRestricted ? 'text-slate-300' : 'text-slate-400 hover:text-blue-600'}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex-1">
                                                                <p className="text-slate-700 font-medium">{task.title}</p>
                                                                {task.description && (
                                                                    <p className="text-slate-500 text-sm mt-1">{task.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {task.onlyAuthorCanComplete ? (
                                                                    <div
                                                                        className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium"
                                                                        title={isRestricted ? "You cannot complete this task - Only author can" : "Only you can complete this task"}
                                                                    >
                                                                        <Lock className="w-3 h-3" />
                                                                        {isRestricted && <span className="ml-1">Restricted</span>}
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
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <User className="w-3 h-3" />
                                                            <span>Created by <span className="font-medium">{task.taskAuthor}</span></span>
                                                            <span>•</span>
                                                            <span>{formatDate(task.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Completed Tasks */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                Completed Tasks ({tasks.filter(task => task.completed).length})
                            </h3>
                            <div className="space-y-3 min-h-[100px]">
                                {tasks.filter(task => task.completed).length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Circle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>No completed tasks</p>
                                    </div>
                                ) : (
                                    tasks.filter(task => task.completed).map(task => {
                                        const isRestricted = task.onlyAuthorCanComplete && task.taskAuthorId != currentUser?.id
                                        return (
                                            <div
                                                key={task.id}
                                                className="p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-slate-50 transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`mt-0.5 ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                        onClick={() => toggleTask(task.id, task)}
                                                        title={isRestricted ? '🔒 Only author can modify this task' : 'Click to mark as incomplete'}
                                                    >
                                                        <CheckCircle className={`w-5 h-5 ${isRestricted ? 'text-green-400' : 'text-green-600 hover:text-green-700'}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex-1">
                                                                <p className="text-slate-500 line-through font-medium">{task.title}</p>
                                                                {task.description && (
                                                                    <p className="text-slate-400 text-sm mt-1 line-through">{task.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {task.onlyAuthorCanComplete ? (
                                                                    <div
                                                                        className="flex items-center gap-1 px-2 py-1  bg-amber-100 text-amber-700 rounded text-xs font-medium"
                                                                        title={isRestricted ? "Restricted - Only author can modify" : "Author-only task"}
                                                                    >
                                                                        <Lock className="w-3 h-3" />
                                                                        {isRestricted && <span className="ml-1">Restricted</span>}
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
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <User className="w-3 h-3" />
                                                                <span>Created by <span className="font-medium">{task.taskAuthor}</span></span>
                                                                <span>•</span>
                                                                <span>{formatDate(task.createdAt)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-green-600">
                                                                <CheckCircle className="w-3 h-3" />
                                                                <span>Completed by <span className="font-medium">{task.completedBy}</span></span>
                                                                <span>•</span>
                                                                <span>{formatDate(task.completionDate)}</span>
                                                            </div>
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
                )}

                {/* Add Task Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Add New Task</h2>
                                    <p className="text-sm text-slate-600 mt-1">Create a new task for the project</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-6 h-6 text-slate-600" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Task Title Field */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
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
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Task Description Field */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Enter task description (optional)"
                                        rows="3"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                {/* Author Field (Read-only) */}
                                <div>
                                    <label htmlFor="author" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        id="author"
                                        value={currentUser?.name?.toUpperCase() || currentUser?.email?.split('@')[0]?.toUpperCase() || 'USER'}
                                        readOnly
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">You will be set as the task author</p>
                                </div>

                                {/* Only Author Can Complete Toggle */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <label htmlFor="onlyAuthorCanComplete" className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-blue-600" />
                                                Only I Can Complete This Task
                                            </label>
                                            <p className="text-xs text-slate-600 mt-1">
                                                When enabled, only you can mark this task as complete or incomplete. Other team members can view it but cannot modify its status.
                                            </p>
                                        </div>
                                        {/* Toggle Switch */}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, onlyAuthorCanComplete: !prev.onlyAuthorCanComplete }))}
                                            className={`outline-none relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.onlyAuthorCanComplete ? 'bg-blue-600' : 'bg-slate-300'
                                                }`}
                                            role="switch"
                                            aria-checked={formData.onlyAuthorCanComplete}
                                            aria-labelledby="onlyAuthorCanComplete"
                                        >
                                            <span
                                                className={`outline-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.onlyAuthorCanComplete ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        Create Task
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
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
