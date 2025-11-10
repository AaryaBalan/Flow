import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Users, Calendar, Clock, Coffee, Target, TrendingUp, Copy, Check, UserPlus, MoreVertical, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

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
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        author: ''
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
            const response = await axios.get(`http://localhost:3000/api/users/${currentUser.id}/activity`)
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
            const response = await axios.get(`http://localhost:3000/api/projects/user/${currentUser.id}`)

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
            await navigator.clipboard.writeText(code)
            setCopiedCodeId(codeId)
            toast.success('Join code copied to clipboard!')
            setTimeout(() => setCopiedCodeId(null), 2000)
        } catch (error) {
            toast.error('Failed to copy join code')
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
                const response = await axios.put(`http://localhost:3000/api/projects/${editingProjectId}`, {
                    title: formData.title,
                    description: formData.description,
                    userId: currentUser.id
                })

                if (response.data.success) {
                    toast.success('Project updated successfully!')
                    await fetchUserProjects()
                    setIsModalOpen(false)
                    setIsEditMode(false)
                    setEditingProjectId(null)
                    setFormData({ title: '', description: '', author: '' })
                }
            } else {
                // Create new project
                const response = await axios.post('http://localhost:3000/api/projects/create', {
                    title: formData.title,
                    description: formData.description,
                    authorId: currentUser.id,
                    authorName: authorName,
                    joinCode: joinCode
                })

                if (response.data.success) {
                    toast.success('Project created successfully!')
                    await fetchUserProjects()
                    setIsModalOpen(false)
                    setFormData({ title: '', description: '', author: '' })
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
            author: project.authorName
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
            const response = await axios.delete(`http://localhost:3000/api/projects/${projectId}`, {
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
        setFormData({ title: '', description: '', author: '' })
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
            const response = await axios.post('http://localhost:3000/api/projects/join', {
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
            const response = await axios.post(`http://localhost:3000/api/users/${currentUser.id}/status`, {
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Projects</h1>
                    <p className="text-slate-600">Manage and track all your projects</p>
                </div>
            </div>

            {/* Overall Work Stats Section */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-800">Today's Activity</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${userActivity?.currentStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {userActivity?.currentStatus === 'active' ? '🟢 Working' : '🔴 On Break'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* Work Time */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Work Time</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{formatWorkTime(userActivity?.workTimeToday || 0)}</p>
                    </div>

                    {/* Last Break */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Coffee className="w-4 h-4" />
                            <span className="text-sm font-medium">Last Break</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-800">{formatLastBreak(userActivity?.lastBreakTime)}</p>
                    </div>

                    {/* Tasks Completed */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Target className="w-4 h-4" />
                            <span className="text-sm font-medium">Tasks Done</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{userActivity?.tasksCompletedToday || 0}</p>
                    </div>

                    {/* Active Projects */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Active Projects</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{userActivity?.activeProjects || 0}</p>
                    </div>
                </div>

                {/* Suggestion Banner */}
                {(() => {
                    const suggestion = getSuggestion(userActivity?.workTimeToday || 0, userActivity?.currentStatus === 'active')
                    const SuggestionIcon = suggestion.icon
                    return (
                        <div className={`flex items-center justify-between p-4 rounded-lg border ${suggestion.color}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg">
                                    <SuggestionIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{suggestion.text}</p>
                                    <p className="text-sm opacity-90">{suggestion.message}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleBreak}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-md transition-all ${userActivity?.currentStatus === 'active'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Projects Yet</h3>
                        <p className="text-slate-600 mb-4">Create your first project or join an existing one</p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                            >
                                Create Project
                            </button>
                            <button
                                onClick={() => setIsJoinModalOpen(true)}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                            >
                                Join Project
                            </button>
                        </div>
                    </div>
                ) : (
                    projects.map(project => {
                        const isPending = project.invitationStatus === 'pending';
                        const ProjectWrapper = isPending ? 'div' : Link;
                        const wrapperProps = isPending
                            ? { className: "bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden block opacity-75 cursor-not-allowed" }
                            : {
                                to: `/project/${project.id}`,
                                className: "bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 overflow-hidden block"
                            };

                        return (
                            <ProjectWrapper
                                key={project.id}
                                {...wrapperProps}
                            >
                                {/* Pending Banner */}
                                {isPending && (
                                    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2">
                                        <p className="text-sm font-semibold text-amber-800 text-center">
                                            Waiting for project owner approval
                                        </p>
                                    </div>
                                )}

                                {/* Project Header */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-start gap-4 mb-4">
                                        {/* Profile Image with First Letter */}
                                        <div className={`w-14 h-14 rounded-xl ${isPending ? 'bg-linear-to-br from-amber-500 to-orange-500' : 'bg-linear-to-br from-blue-600 to-indigo-600'} flex items-center justify-center shrink-0 shadow-md`}>
                                            <span className="text-2xl font-bold text-white">{getInitials(project.title)}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-800 truncate">{project.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${isPending
                                                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                                        : project.status === 'Active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {isPending ? 'Pending' : project.status}
                                                    </span>

                                                    {/* Three Dot Menu - Only show for project owner */}
                                                    {!isPending && project.authorId == currentUser?.id && (
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    setOpenMenuId(openMenuId === project.id ? null : project.id)
                                                                }}
                                                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                            >
                                                                <MoreVertical className="w-5 h-5 text-slate-600" />
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            {openMenuId === project.id && (
                                                                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[150px]">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            handleEditProject(project)
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                        Edit Project
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            handleDeleteProject(project.id)
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Delete Project
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Author */}
                                    <div className="mb-3">
                                        <p className="text-sm text-slate-500">
                                            <span className="font-medium text-slate-700">Author:</span> {project.authorName}
                                        </p>
                                    </div>

                                    {/* Join Code - Only show for project owner and approved members */}
                                    {!isPending && project.authorId == currentUser?.id ? (
                                        <div className="mb-3 p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="text-xs text-slate-600 mb-1 font-medium">Join Code</p>
                                                    <p className="text-lg font-bold text-green-600 font-mono">{project.joinCode}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        handleCopyCode(project.joinCode, `project-${project.id}`)
                                                    }}
                                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1 text-sm font-medium shrink-0"
                                                >
                                                    {copiedCodeId === `project-${project.id}` ? (
                                                        <>
                                                            <Check className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ) : !isPending && (
                                        <div className="mb-3 py-4 px-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <Users className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className='flex flex-col gap-y-1.5'>
                                                    <p className="text-xs text-blue-700 font-semibold">Team Member</p>
                                                    <p className="text-sm text-slate-700 font-medium">Collaborating on this project</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            <span>{project.peopleJoined} joined</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(project.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 font-medium">Progress</span>
                                            <span className="font-semibold text-slate-800">{project.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div
                                                className={`${isPending ? 'bg-linear-to-r from-amber-500 to-orange-500' : 'bg-linear-to-r from-blue-600 to-indigo-600'} h-2 rounded-full transition-all`}
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </ProjectWrapper>
                        );
                    })
                )}
            </div>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-8 right-8 flex items-center gap-4">
                {/* Join Button */}
                <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="w-16 h-16 bg-linear-to-br from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
                    aria-label="Join a project"
                >
                    <UserPlus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>

                {/* Add Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-16 h-16 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
                    aria-label="Add new project"
                >
                    <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {isEditMode ? 'Edit Project' : 'Create New Project'}
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    {isEditMode ? 'Update your project details' : 'Fill in the details to start a new project'}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6 text-slate-600" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Join Code Field (Read-only) - Only show when creating */}
                            {!isEditMode && (
                                <div>
                                    <label htmlFor="joinCode" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Join Code
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="joinCode"
                                            value={joinCode}
                                            readOnly
                                            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-mono text-lg font-semibold cursor-not-allowed"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCopyCode(joinCode, 'modal')}
                                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                                        >
                                            {copiedCodeId === 'modal' ? (
                                                <>
                                                    <Check className="w-5 h-5" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-5 h-5" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Share this code with others to let them join your project</p>
                                </div>
                            )}

                            {/* Title Field */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
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
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Description Field */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
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
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            {/* Author Field */}
                            <div>
                                <label htmlFor="author" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Author Name
                                </label>
                                <input
                                    type="text"
                                    id="author"
                                    name="author"
                                    value={currentUser?.name?.toUpperCase() || currentUser?.email?.split('@')[0] || 'User'}
                                    readOnly
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500 mt-2">You will be set as the project author</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                >
                                    {isEditMode ? 'Update Project' : 'Create Project'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Project Modal */}
            {isJoinModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Join a Project</h2>
                                <p className="text-sm text-slate-600 mt-1">Enter the project join code</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsJoinModalOpen(false)
                                    setJoinCodeInput('')
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6 text-slate-600" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleJoinProject} className="p-6 space-y-6">
                            {/* Join Code Input */}
                            <div>
                                <label htmlFor="joinCodeInput" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Enter Join Code *
                                </label>
                                <input
                                    type="text"
                                    id="joinCodeInput"
                                    value={joinCodeInput}
                                    onChange={(e) => setJoinCodeInput(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-mono text-lg text-center tracking-wider"
                                />
                                <p className="text-xs text-slate-500 mt-2">Ask the project owner for the join code</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                    Join Project
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsJoinModalOpen(false)
                                        setJoinCodeInput('')
                                    }}
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
    )
}

export default ProjectsPage
