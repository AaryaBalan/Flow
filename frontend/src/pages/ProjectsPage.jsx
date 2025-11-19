import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Users, Calendar, Clock, Coffee, Target, TrendingUp, Copy, RotateCw, Check, UserPlus, MoreVertical, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import API_BASE_URL from '../config/api'
import TimeTracker from '../utils/timeTracker'

const ProjectsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingProjectId, setEditingProjectId] = useState(null)
    const [openMenuId, setOpenMenuId] = useState(null)
    const [joinCode, setJoinCode] = useState('')
    const [joinCodeInput, setJoinCodeInput] = useState('')
    const [copiedCodeId, setCopiedCodeId] = useState(null) // Track which code was copied
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState(null)
    const [userActivity, setUserActivity] = useState(null)
    const [workMinutes, setWorkMinutes] = useState(0)
    const [breakMinutes, setBreakMinutes] = useState(0)
    const [trackingStatus, setTrackingStatus] = useState('stopped')
    const [lastBreakTime, setLastBreakTime] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        author: '',
        dueDate: ''
    })

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

    // Generate join code when modal opens
    useEffect(() => {
        if (isModalOpen) {
            // Generate a 6-character code from UUID (more secure than Math.random)
            const uuid = uuidv4().replace(/-/g, '')
            const code = uuid.substring(0, 6).toUpperCase()
            setJoinCode(code)
            setCopiedCodeId(null) // Reset copied state when modal opens
        }
    }, [isModalOpen])

    const [projects, setProjects] = useState([])

    // Fetch projects when component mounts or user changes
    useEffect(() => {
        if (currentUser?.id) {
            fetchUserProjects()
            fetchUserActivity()
        }
    }, [currentUser])

    // Initialize TimeTracker when user is loaded
    useEffect(() => {
        if (currentUser?.id) {
            const timeTracker = TimeTracker.getInstance();

            // Set up callbacks for time updates
            timeTracker.onTimeUpdate = (data) => {
                setWorkMinutes(data.workMinutes);
                setBreakMinutes(data.breakMinutes);
                setTrackingStatus(data.status);
                setLastBreakTime(data.lastBreakTime);
            };

            timeTracker.onStatusChange = (status) => {
                setTrackingStatus(status);
            };

            // Start tracking
            timeTracker.startTracking(currentUser.id);

            return () => {
                // Cleanup on unmount
                timeTracker.stopTracking();
            };
        }
    }, [currentUser])

    // Poll for activity updates every 30 seconds
    useEffect(() => {
        if (!currentUser?.id) return

        const activityInterval = setInterval(() => {
            fetchUserActivity()
        }, 30000)

        return () => clearInterval(activityInterval)
    }, [currentUser])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openMenuId && !e.target.closest('.relative')) {
                setOpenMenuId(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [openMenuId])

    const fetchUserActivity = async () => {
        if (!currentUser?.id) return

        try {
            const response = await axios.get(`${API_BASE_URL}/api/users/${currentUser.id}/activity`)
            if (response.data.success) {
                setUserActivity(response.data.activity)
            }
        } catch (error) {
            console.error('Error fetching user activity:', error)
        }
    }

    const fetchUserProjects = async () => {
        if (!currentUser?.id) return

        try {
            setIsLoading(true)
            const response = await axios.get(`${API_BASE_URL}/api/projects/user/${currentUser.id}`)

            if (response.data.success) {
                setProjects(response.data.projects)
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
            toast.error('Failed to load projects')
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleCopyCode = async (code, codeId) => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(code)
                setCopiedCodeId(codeId)
                toast.success('Join code copied to clipboard!')
                setTimeout(() => setCopiedCodeId(null), 2000)
            } else {
                // Fallback for non-secure contexts (like network IP)
                const textArea = document.createElement('textarea')
                textArea.value = code
                textArea.style.position = 'fixed'
                textArea.style.left = '-999999px'
                textArea.style.top = '-999999px'
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()

                try {
                    const successful = document.execCommand('copy')
                    textArea.remove()

                    if (successful) {
                        setCopiedCodeId(codeId)
                        toast.success('Join code copied to clipboard!')
                        setTimeout(() => setCopiedCodeId(null), 2000)
                    } else {
                        throw new Error('Copy command failed')
                    }
                } catch (err) {
                    textArea.remove()
                    // Show the code in a prompt as last resort
                    toast.info(`Join Code: ${code}`, { duration: 5000 })
                }
            }
        } catch (error) {
            console.error('Copy error:', error)
            // Show the code in a toast as fallback
            toast.info(`Join Code: ${code}`, { duration: 5000 })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!currentUser?.id) {
            toast.error('Please log in to create a project')
            return
        }

        const authorName = currentUser?.name || currentUser?.fullName || currentUser?.email?.split('@')[0] || 'User'

        try {
            if (isEditMode && editingProjectId) {
                // Update existing project
                const response = await axios.put(`${API_BASE_URL}/api/projects/${editingProjectId}`, {
                    title: formData.title,
                    description: formData.description,
                    dueDate: formData.dueDate || null,
                    userId: currentUser.id
                })

                if (response.data.success) {
                    toast.success('Project updated successfully!')
                    await fetchUserProjects()
                    setIsModalOpen(false)
                    setIsEditMode(false)
                    setEditingProjectId(null)
                    setFormData({ title: '', description: '', author: '', dueDate: '' })
                }
            } else {
                // Create new project
                const response = await axios.post(`${API_BASE_URL}/api/projects/create`, {
                    title: formData.title,
                    description: formData.description,
                    dueDate: formData.dueDate || null,
                    authorId: currentUser.id,
                    authorName: authorName,
                    joinCode: joinCode
                })

                if (response.data.success) {
                    toast.success('Project created successfully!')
                    await fetchUserProjects()
                    setIsModalOpen(false)
                    setFormData({ title: '', description: '', author: '', dueDate: '' })
                }
            }
        } catch (error) {
            console.error('Error saving project:', error)
            toast.error(error.response?.data?.message || 'Failed to save project')
        }
    }

    const handleEditProject = (project) => {
        setFormData({
            title: project.title,
            description: project.description,
            author: project.authorName,
            dueDate: project.dueDate ? project.dueDate.split('T')[0] : ''
        })
        setEditingProjectId(project.id)
        setIsEditMode(true)
        setIsModalOpen(true)
        setOpenMenuId(null)
    }

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project? All members will be removed and this action cannot be undone.')) {
            return
        }

        try {
            const response = await axios.delete(`${API_BASE_URL}/api/projects/${projectId}`, {
                data: { userId: currentUser.id }
            })

            if (response.data.success) {
                toast.success('Project deleted successfully!')
                await fetchUserProjects()
                setOpenMenuId(null)
            }
        } catch (error) {
            console.error('Error deleting project:', error)
            toast.error(error.response?.data?.message || 'Failed to delete project')
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setIsEditMode(false)
        setEditingProjectId(null)
        setFormData({ title: '', description: '', author: '', dueDate: '' })
    }

    const handleJoinProject = async (e) => {
        e.preventDefault()

        if (!joinCodeInput.trim()) {
            toast.error('Please enter a join code')
            return
        }

        if (!currentUser?.id) {
            toast.error('Please log in to join a project')
            return
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/projects/join`, {
                joinCode: joinCodeInput,
                userId: currentUser.id
            })

            if (response.data.success) {
                toast.success(response.data.message)
                await fetchUserProjects() // Refresh projects list
                setIsJoinModalOpen(false)
                setJoinCodeInput('')
            }
        } catch (error) {
            console.error('Error joining project:', error)
            toast.error(error.response?.data?.message || 'Failed to join project')
        }
    }

    const handleToggleBreak = async () => {
        if (!currentUser?.id) {
            toast.error('Please log in to manage your status')
            return
        }

        const newStatus = userActivity?.currentStatus === 'active' ? 'break' : 'active'

        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/${currentUser.id}/status`, {
                status: newStatus
            })

            if (response.data.success) {
                toast.success(response.data.message)
                await fetchUserActivity() // Refresh activity data
            }
        } catch (error) {
            console.error('Error toggling break status:', error)
            toast.error(error.response?.data?.message || 'Failed to update status')
        }
    }

    const formatWorkTime = (minutes) => {
        if (!minutes) return '0h 0m'
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    const formatLastBreak = (timestamp) => {
        if (!timestamp) return 'No breaks today'
        const breakTime = new Date(timestamp)
        const hours = breakTime.getHours()
        const minutes = breakTime.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        const displayMinutes = minutes.toString().padStart(2, '0')
        return `${displayHours}:${displayMinutes} ${ampm}`
    }

    const getInitials = (title) => {
        return title.charAt(0).toUpperCase()
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const getSuggestion = (workedMinutes, isWorking) => {
        if (!isWorking) {
            return {
                text: 'On break',
                color: 'bg-green-100 text-green-700 border-green-200',
                icon: Coffee,
                message: 'Enjoy your break!'
            }
        }
        if (workedMinutes >= 240) { // 4+ hours
            return {
                text: 'Take a break!',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: Coffee,
                message: 'You\'ve been working for a while. Time for a break!'
            }
        } else if (workedMinutes >= 180) { // 3+ hours
            return {
                text: 'Break soon',
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: Coffee,
                message: 'Consider taking a break in the next 15-30 minutes'
            }
        } else if (workedMinutes >= 120) { // 2+ hours
            return {
                text: 'Keep focused',
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: Target,
                message: 'Great momentum! Keep up the good work 🚀'
            }
        } else {
            return {
                text: 'Focus time',
                color: 'bg-green-100 text-green-700 border-green-200',
                icon: Target,
                message: 'Fresh start! Perfect time to tackle important tasks'
            }
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Projects</h1>
                    <p className="text-sm sm:text-base text-slate-600">Manage and track all your projects</p>
                </div>
            </div>

            {/* Overall Work Stats Section */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Overall Activity</h2>
                    </div>
                    <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto ${userActivity?.currentStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {userActivity?.currentStatus === 'active' ? '🟢 Working' : '🔴 On Break'}
                    </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {/* Work Time */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 mb-1.5 sm:mb-2">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">Work Time</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-slate-800">{formatWorkTime(userActivity?.workTimeToday || 0)}</p>
                    </div>

                    {/* Last Break */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 mb-1.5 sm:mb-2">
                            <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">Last Break</span>
                        </div>
                        <p className="text-sm sm:text-lg font-semibold text-slate-800">{formatLastBreak(userActivity?.lastBreakTime)}</p>
                    </div>

                    {/* Tasks Completed */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 mb-1.5 sm:mb-2">
                            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">Tasks Done</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-slate-800">{userActivity?.tasksCompletedTotal || 0}</p>
                    </div>

                    {/* Active Projects */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 mb-1.5 sm:mb-2">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">Active Projects</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-slate-800">{userActivity?.activeProjects || 0}</p>
                    </div>
                </div>

                {/* Suggestion Banner */}
                {(() => {
                    const suggestion = getSuggestion(userActivity?.workTimeToday || 0, userActivity?.currentStatus === 'active')
                    const SuggestionIcon = suggestion.icon
                    return (
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border ${suggestion.color}`}>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-white rounded-lg shrink-0">
                                    <SuggestionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-xs sm:text-sm">{suggestion.text}</p>
                                    <p className="text-xs sm:text-sm opacity-90">{suggestion.message}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleBreak}
                                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm hover:shadow-md transition-all whitespace-nowrap ${userActivity?.currentStatus === 'active'
                                    ? 'bg-white hover:bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-white hover:bg-green-50 text-green-700 border border-green-200'
                                    }`}
                            >
                                {userActivity?.currentStatus === 'active' ? 'Take a Break' : 'Resume Work'}
                            </button>
                        </div>
                    )
                })()}
            </div>

            {/* Projects Grid */}
            {(() => {
                // Helper function to check if project is overdue
                const isOverdue = (dueDate) => {
                    if (!dueDate) return false;
                    return new Date(dueDate) < new Date();
                };

                // Separate projects into active, overdue and completed
                const completedProjects = projects.filter(p => p.status && p.status.toLowerCase() === 'completed');
                const activeProjects = projects.filter(p => p.status && p.status.toLowerCase() !== 'completed' && !isOverdue(p.dueDate));
                const overdueProjects = projects.filter(p => p.status && p.status.toLowerCase() !== 'completed' && isOverdue(p.dueDate));

                // Helper function to render project grid
                const renderProjectsGrid = (projectList, isOverdueSection = false) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {projectList.length === 0 ? (
                            <div className="col-span-full text-center py-8 sm:py-12 px-4">
                                <p className="text-sm sm:text-base text-slate-600">{isOverdueSection ? 'No overdue projects' : 'No active projects'}</p>
                            </div>
                        ) : (
                            projectList.map(project => {
                                const isPending = project.invitationStatus === 'pending';
                                const ProjectWrapper = isPending ? 'div' : Link;
                                const wrapperProps = isPending
                                    ? { className: "bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-100 overflow-hidden block opacity-75 cursor-not-allowed" }
                                    : {
                                        to: `/project/${project.id}`,
                                        className: "bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 overflow-hidden block"
                                    };

                                return (
                                    <ProjectWrapper
                                        key={project.id}
                                        {...wrapperProps}
                                    >
                                        {/* Pending Banner */}
                                        {isPending && (
                                            <div className="bg-amber-100 border-b border-amber-200 px-3 sm:px-4 py-1.5 sm:py-2">
                                                <p className="text-xs sm:text-sm font-semibold text-amber-800 text-center">
                                                    Waiting for project owner approval
                                                </p>
                                            </div>
                                        )}

                                        {/* Overdue Banner */}
                                        {isOverdueSection && (
                                            <div className="bg-red-100 border-b border-red-200 px-3 sm:px-4 py-1.5 sm:py-2">
                                                <p className="text-xs sm:text-sm font-semibold text-red-800 text-center">
                                                    Overdue
                                                </p>
                                            </div>
                                        )}

                                        {/* Project Header */}
                                        <div className="p-3 sm:p-4 md:p-5 pb-3 sm:pb-4">
                                            <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                                                {/* Profile Image with First Letter */}
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl ${isPending ? 'bg-linear-to-br from-amber-500 to-orange-500' : isOverdueSection ? 'bg-linear-to-br from-red-600 to-orange-600' : 'bg-linear-to-br from-blue-600 to-indigo-600'} flex items-center justify-center shrink-0 shadow-sm sm:shadow-md`}>
                                                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{getInitials(project.title)}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{project.title}</h3>
                                                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                                            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${isPending
                                                                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                                                : isOverdueSection
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : project.status === 'Active'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {isPending ? 'Pending' : isOverdueSection ? 'Overdue' : project.status}
                                                            </span>

                                                            {/* Three Dot Menu - Only show for project owner */}
                                                            {!isPending && project.authorId == currentUser?.id && (
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            setOpenMenuId(openMenuId === project.id ? null : project.id)
                                                                        }}
                                                                        className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                                    >
                                                                        <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                                                                    </button>

                                                                    {/* Dropdown Menu */}
                                                                    {openMenuId === project.id && (
                                                                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[120px] sm:min-w-[150px]">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault()
                                                                                    handleEditProject(project)
                                                                                }}
                                                                                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 sm:gap-2"
                                                                            >
                                                                                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault()
                                                                                    handleDeleteProject(project.id)
                                                                                }}
                                                                                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-1.5 sm:gap-2"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                                Delete
                                                                            </button>
                                                                            {/* Mark Complete / Reopen - owner-only actions */}
                                                                            {project.authorId == currentUser?.id && project.status && project.status.toLowerCase() !== 'completed' && (
                                                                                <button
                                                                                    onClick={async (e) => {
                                                                                        e.preventDefault()
                                                                                        if (!window.confirm('Mark this project as completed?')) return
                                                                                        try {
                                                                                            const resp = await axios.put(`${API_BASE_URL}/api/projects/${project.id}`, { status: 'Completed', userId: currentUser.id })
                                                                                            if (resp.data.success) {
                                                                                                toast.success('Project marked as completed')
                                                                                                await fetchUserProjects()
                                                                                                setOpenMenuId(null)
                                                                                            }
                                                                                        } catch (err) {
                                                                                            console.error('Error marking project completed', err)
                                                                                            toast.error(err.response?.data?.message || 'Failed to mark project completed')
                                                                                        }
                                                                                    }}
                                                                                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 sm:gap-2"
                                                                                >
                                                                                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                                    Mark Complete
                                                                                </button>
                                                                            )}

                                                                            {project.authorId == currentUser?.id && project.status && project.status.toLowerCase() === 'completed' && (
                                                                                <button
                                                                                    onClick={async (e) => {
                                                                                        e.preventDefault()
                                                                                        if (!window.confirm('Reopen this project (mark as active)?')) return
                                                                                        try {
                                                                                            const resp = await axios.put(`${API_BASE_URL}/api/projects/${project.id}`, { status: 'Active', userId: currentUser.id })
                                                                                            if (resp.data.success) {
                                                                                                toast.success('Project reopened')
                                                                                                await fetchUserProjects()
                                                                                                setOpenMenuId(null)
                                                                                            }
                                                                                        } catch (err) {
                                                                                            console.error('Error reopening project', err)
                                                                                            toast.error(err.response?.data?.message || 'Failed to reopen project')
                                                                                        }
                                                                                    }}
                                                                                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-green-600 hover:bg-green-50 flex items-center gap-1.5 sm:gap-2"
                                                                                >
                                                                                    <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                                    Reopen Project
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{project.description}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Project Stats */}
                                        <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-t border-slate-100 space-y-2 sm:space-y-3">
                                            {/* Author and People */}
                                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                                <div className="flex items-center gap-1">
                                                    <p className="text-slate-600">Author:</p>
                                                    <p className="font-semibold text-slate-800">{project.authorName}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <p className="text-slate-600">People Joined:</p>
                                                    <p className="font-semibold text-slate-800">{project.peopleJoined}</p>
                                                </div>
                                            </div>

                                            {/* Due Date */}
                                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                                <span className="text-slate-600 font-medium">Due Date:</span>
                                                <span className="font-semibold text-slate-800">
                                                    {project.dueDate
                                                        ? new Date(project.dueDate).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })
                                                        : 'No due date'
                                                    }
                                                </span>
                                            </div>

                                            {/* Join Code - Only show for project owner */}
                                            {!isPending && project.authorId == currentUser?.id && (
                                                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] sm:text-xs text-green-700 font-semibold mb-0.5">Join Code</p>
                                                            <p className="text-sm sm:text-base font-bold text-green-600 font-mono">{project.joinCode}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                handleCopyCode(project.joinCode, `project-${project.id}`)
                                                            }}
                                                            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
                                                        >
                                                            {copiedCodeId === `project-${project.id}` ? (
                                                                <>
                                                                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                                    <span className="inline">Copied!</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                                    <span className="inline">Copy</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Team Member Badge - Show for non-owners */}
                                            {!isPending && project.authorId != currentUser?.id && (
                                                <div className="mt-2 sm:mt-3 py-2 sm:py-2.5 px-2 sm:px-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 bg-white rounded shrink-0">
                                                            <Users className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <div className='min-w-0'>
                                                            <p className="text-[10px] sm:text-xs text-blue-700 font-semibold">Team Member</p>
                                                            <p className="text-[10px] sm:text-xs text-slate-700">Collaborating on this project</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ProjectWrapper>
                                );
                            })
                        )}
                    </div>
                );

                if (isLoading) {
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="col-span-full text-center py-8 sm:py-12">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                                <p className="text-sm sm:text-base text-slate-600">Loading projects...</p>
                            </div>
                        </div>
                    );
                }

                if (projects.length === 0) {
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="col-span-full text-center py-8 sm:py-12 px-4">
                                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">No Projects Yet</h3>
                                <p className="text-sm sm:text-base text-slate-600 mb-4">Create your first project or join an existing one</p>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                                    >
                                        Create Project
                                    </button>
                                    <button
                                        onClick={() => setIsJoinModalOpen(true)}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                                    >
                                        Join Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <>
                        {/* Active Projects Section */}
                        {activeProjects.length > 0 && (
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    Active Projects
                                </h2>
                                {renderProjectsGrid(activeProjects, false)}
                            </div>
                        )}

                        {/* Overdue Projects Section */}
                        {overdueProjects.length > 0 && (
                            <div className="mt-8 sm:mt-12">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                    Overdue Projects
                                </h2>
                                {renderProjectsGrid(overdueProjects, true)}
                            </div>
                        )}
                        {/* Completed Projects Section */}
                        {completedProjects.length > 0 && (
                            <div className="mt-8 sm:mt-12">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                    Completed Projects
                                </h2>
                                {renderProjectsGrid(completedProjects, false)}
                            </div>
                        )}
                    </>
                );
            })()}

            {/* Floating Action Buttons */}
            <div className="fixed bottom-6 sm:bottom-8 right-6 sm:right-8 flex items-center gap-3 sm:gap-4">
                {/* Join Button */}
                <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
                    aria-label="Join a project"
                >
                    <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                </button>

                {/* Add Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
                    aria-label="Add new project"
                >
                    <Plus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-3">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">
                                    {isEditMode ? 'Edit Project' : 'Create New Project'}
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
                                    {isEditMode ? 'Update your project details' : 'Fill in the details to start a new project'}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Join Code Field (Read-only) - Only show when creating */}
                            {!isEditMode && (
                                <div>
                                    <label htmlFor="joinCode" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                        Join Code
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            id="joinCode"
                                            value={joinCode}
                                            readOnly
                                            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-mono text-base sm:text-lg font-semibold cursor-not-allowed"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCopyCode(joinCode, 'modal')}
                                            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base whitespace-nowrap"
                                        >
                                            {copiedCodeId === 'modal' ? (
                                                <>
                                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">Share this code with others to let them join your project</p>
                                </div>
                            )}

                            {/* Title Field */}
                            <div>
                                <label htmlFor="title" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                    Project Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter project title"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Description Field */}
                            <div>
                                <label htmlFor="description" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows="4"
                                    placeholder="Describe your project..."
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            {/* Due Date Field */}
                            <div>
                                <label htmlFor="dueDate" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                    Project Due Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    id="dueDate"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-1.5 sm:mt-2">Leave empty for no due date</p>
                            </div>

                            {/* Author Field */}
                            <div>
                                <label htmlFor="author" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                    Author Name
                                </label>
                                <input
                                    type="text"
                                    id="author"
                                    name="author"
                                    value={currentUser?.name?.toUpperCase() || currentUser?.email?.split('@')[0] || 'User'}
                                    readOnly
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                                />
                                <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">You will be set as the project author</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                >
                                    {isEditMode ? 'Update Project' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Project Modal */}
            {isJoinModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-slate-200 gap-3">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Join a Project</h2>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">Enter the project join code</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsJoinModalOpen(false)
                                    setJoinCodeInput('')
                                }}
                                className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleJoinProject} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Join Code Input */}
                            <div>
                                <label htmlFor="joinCodeInput" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                    Enter Join Code *
                                </label>
                                <input
                                    type="text"
                                    id="joinCodeInput"
                                    value={joinCodeInput}
                                    onChange={(e) => setJoinCodeInput(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-mono text-base sm:text-lg text-center tracking-wider"
                                />
                                <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">Ask the project owner for the join code</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsJoinModalOpen(false)
                                        setJoinCodeInput('')
                                    }}
                                    className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                    Join Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProjectsPage
