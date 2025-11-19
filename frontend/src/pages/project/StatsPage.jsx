import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { TrendingUp, Users, CheckCircle, Clock, ListTodo, UserCheck, MessageSquare, UserPlus, PlusCircle, FileText } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import axios from 'axios'
import toast from 'react-hot-toast'
import API_BASE_URL from '../../config/api'

const StatsPage = () => {
    const { projectId } = useParams()
    const [tasks, setTasks] = useState([])
    const [members, setMembers] = useState([])
    const [notes, setNotes] = useState([])
    const [recentActivity, setRecentActivity] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState(null)

    // Load current user from localStorage so we can fetch notes (API requires userId)
    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            try {
                const userData = JSON.parse(userStr)
                setCurrentUser(userData)
            } catch (err) {
                console.error('Error parsing user from localStorage', err)
            }
        }
    }, [])

    useEffect(() => {
        if (projectId && currentUser) {
            fetchProjectData()
        }
    }, [projectId, currentUser])

    const fetchProjectData = async () => {
        try {
            setIsLoading(true)
            // Fetch tasks
            const tasksResponse = await axios.get(`${API_BASE_URL}/api/tasks/project/${projectId}`)
            if (tasksResponse.data.success) {
                setTasks(tasksResponse.data.tasks)
            }

            // Fetch project members
            const membersResponse = await axios.get(`${API_BASE_URL}/api/projects/${projectId}/members`)
            if (membersResponse.data.success) {
                setMembers(membersResponse.data.members)
            }

            // Fetch notes for project (requires userId query param)
            let notesResponse = null
            if (currentUser) {
                try {
                    notesResponse = await axios.get(`${API_BASE_URL}/api/notes/project/${projectId}?userId=${currentUser.id}`)
                    if (notesResponse.data.success) {
                        setNotes(notesResponse.data.notes || [])
                    }
                } catch (err) {
                    console.error('Error fetching notes:', err)
                }
            }

            // Generate recent activity based on tasks, members and notes
            const notesListForActivity = notesResponse && notesResponse.data && notesResponse.data.notes ? notesResponse.data.notes : []
            generateRecentActivity(tasksResponse.data.tasks || [], membersResponse.data.members || [], notesListForActivity)
        } catch (error) {
            console.error('Error fetching project data:', error)
            toast.error('Failed to load project statistics')
        } finally {
            setIsLoading(false)
        }
    }

    const generateRecentActivity = (tasksList, membersList, notesList = []) => {
        const activities = []

        // Add task activities
        tasksList.slice(0, 5).forEach(task => {
            activities.push({
                id: `task-${task.id}`,
                user: task.taskAuthor,
                action: 'created task',
                target: task.title,
                time: formatTimeAgo(task.createdAt),
                timestamp: new Date(task.createdAt).getTime(),
                icon: PlusCircle,
                color: 'blue'
            })

            if (task.completed) {
                activities.push({
                    id: `task-complete-${task.id}`,
                    user: task.completedBy,
                    action: 'completed task',
                    target: task.title,
                    time: formatTimeAgo(task.completionDate),
                    timestamp: new Date(task.completionDate).getTime(),
                    icon: CheckCircle,
                    color: 'green'
                })
            }
        })

        // Add member activities
        // Note: backend returns `id` (not `userId`) and `joinedAt` may be missing for some entries.
        membersList.slice(0, 5).forEach(member => {
            const joinedAt = member.joinedAt || member.joined_at || null
            const timestamp = joinedAt ? new Date(joinedAt).getTime() : Date.now()
            activities.push({
                id: `member-${member.id}`,
                user: member.name || member.displayName || 'Unknown',
                action: member.invitationStatus === 'pending' ? 'requested to join' : 'joined the project',
                target: '',
                time: joinedAt ? formatTimeAgo(joinedAt) : 'Just now',
                timestamp: timestamp,
                icon: UserPlus,
                color: 'purple'
            })
        })

        // Add note activities
        notesList.slice(0, 5).forEach(note => {
            const authorName = note.createdByName || note.createdBy || 'Unknown'
            const when = note.updatedAt || note.createdAt
            activities.push({
                id: `note-${note.id}`,
                user: authorName,
                action: 'created note',
                target: note.title,
                time: formatTimeAgo(when),
                timestamp: when ? new Date(when).getTime() : Date.now(),
                icon: FileText,
                color: 'orange'
            })
        })

        // Sort by timestamp descending and take top 10
        const sortedActivities = activities
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10)

        setRecentActivity(sortedActivities)
    }

    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Unknown'

        // Parse the date string - SQLite returns dates in format: YYYY-MM-DD HH:MM:SS
        // Convert to ISO format if needed
        let date
        if (dateString.includes('T')) {
            // Already in ISO format
            date = new Date(dateString)
        } else {
            // SQLite format: YYYY-MM-DD HH:MM:SS
            // Add 'Z' to treat as UTC or convert to local time
            date = new Date(dateString.replace(' ', 'T') + 'Z')
        }

        const now = new Date()
        const seconds = Math.floor((now - date) / 1000)

        if (seconds < 0) return 'Just now' // Handle future dates
        if (seconds < 60) return 'Just now'
        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60)
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
        }
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600)
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
        }
        if (seconds < 604800) {
            const days = Math.floor(seconds / 86400)
            return `${days} ${days === 1 ? 'day' : 'days'} ago`
        }
        if (seconds < 2592000) {
            const weeks = Math.floor(seconds / 604800)
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    // Calculate task statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length
    const pendingTasks = totalTasks - completedTasks

    // Calculate tasks per member (created)
    const tasksPerMember = {}
    tasks.forEach(task => {
        const authorId = task.taskAuthorId
        const authorName = task.taskAuthor
        if (!tasksPerMember[authorId]) {
            tasksPerMember[authorId] = { name: authorName, count: 0, color: '' }
        }
        tasksPerMember[authorId].count++
    })

    // Calculate completed tasks per member
    const completedTasksPerMember = {}
    tasks.filter(t => t.completed).forEach(task => {
        const completerId = task.completedById
        const completerName = task.completedBy
        if (completerId && completerName) {
            if (!completedTasksPerMember[completerId]) {
                completedTasksPerMember[completerId] = { name: completerName, count: 0, color: '' }
            }
            completedTasksPerMember[completerId].count++
        }
    })

    // Assign colors to members
    const memberColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1']
    Object.keys(tasksPerMember).forEach((memberId, index) => {
        tasksPerMember[memberId].color = memberColors[index % memberColors.length]
    })
    Object.keys(completedTasksPerMember).forEach((memberId, index) => {
        completedTasksPerMember[memberId].color = memberColors[index % memberColors.length]
    })

    const taskStatusData = [
        { name: 'Completed', value: completedTasks, color: '#10b981' },
        { name: 'Pending', value: pendingTasks, color: '#f59e0b' }
    ]

    const memberTaskData = Object.entries(tasksPerMember).map(([id, data]) => ({
        name: data.name,
        value: data.count,
        color: data.color
    }))

    const completedTasksData = Object.entries(completedTasksPerMember).map(([id, data]) => ({
        name: data.name,
        value: data.count,
        color: data.color
    }))

    // Notes statistics
    const totalNotes = notes.length
    const notesPerMember = {}
    notes.forEach(note => {
        const authorId = note.createdBy
        const authorName = note.createdByName || note.createdBy || 'Unknown'
        if (!notesPerMember[authorId]) {
            notesPerMember[authorId] = { name: authorName, count: 0, color: '' }
        }
        notesPerMember[authorId].count++
    })

    Object.keys(notesPerMember).forEach((memberId, index) => {
        notesPerMember[memberId].color = memberColors[index % memberColors.length]
    })

    const memberNotesData = Object.entries(notesPerMember).map(([id, data]) => ({
        name: data.name,
        value: data.count,
        color: data.color
    }))

    // Custom label for pie chart center
    const renderCustomLabel = (total) => {
        return (props) => {
            return null // We'll show total in center separately
        }
    }

    // Custom tooltip component with highest z-index
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white px-4 py-2 rounded-lg shadow-2xl border-2 border-slate-300" style={{ zIndex: 9999, position: 'relative' }}>
                    <p className="text-sm font-semibold text-slate-800">{payload[0].name}</p>
                    <p className="text-sm text-slate-600">{payload[0].value} items</p>
                </div>
            )
        }
        return null
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Project Statistics</h2>
                <p className="text-slate-600 mt-1">Overview of project performance and activity</p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col justify-center items-center bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <ListTodo className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{totalTasks}</div>
                    <div className="text-xs md:text-sm text-slate-600">Total Tasks</div>
                </div>

                <div className="flex flex-col justify-center items-center bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{completedTasks}</div>
                    <div className="text-xs md:text-sm text-slate-600">Completed Tasks</div>
                </div>

                <div className="flex flex-col justify-center items-center bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{pendingTasks}</div>
                    <div className="text-xs md:text-sm text-slate-600">Pending Tasks</div>
                </div>

                <div className="flex flex-col justify-center items-center bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{members.length}</div>
                    <div className="text-xs md:text-sm text-slate-600">Team Members</div>
                </div>

                <div className="flex flex-col justify-center items-center bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{totalNotes}</div>
                    <div className="text-xs md:text-sm text-slate-600">Notes</div>
                </div>

            </div>

            {/* Pie Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                {/* Task Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Task Distribution</h3>
                    <div className="flex flex-col items-center">
                        {totalTasks > 0 ? (
                            <>
                                <div className="relative w-full h-48 md:h-64" style={{ zIndex: 1 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={taskStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {taskStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                                        <div className="text-center">
                                            <p className="text-2xl md:text-3xl font-bold text-slate-800">{totalTasks}</p>
                                            <p className="text-xs text-slate-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full space-y-2 md:space-y-3 mt-4">
                                    {taskStatusData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 md:w-4 md:h-4 rounded"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-xs md:text-sm text-slate-700">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs md:text-sm font-semibold text-slate-800">{item.value}</span>
                                                <span className="text-xs text-slate-500">
                                                    ({totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No tasks yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks Created Per Member */}
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Tasks Created</h3>
                    <div className="flex flex-col items-center">
                        {memberTaskData.length > 0 ? (
                            <>
                                <div className="relative w-full h-48 md:h-64" style={{ zIndex: 1 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={memberTaskData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {memberTaskData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                                        <div className="text-center">
                                            <p className="text-2xl md:text-3xl font-bold text-slate-800">{totalTasks}</p>
                                            <p className="text-xs text-slate-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full space-y-2 md:space-y-3 mt-4 max-h-48 md:max-h-64 overflow-y-auto">
                                    {memberTaskData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 md:w-4 md:h-4 rounded"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-xs md:text-sm text-slate-700 truncate max-w-[120px] md:max-w-[150px]">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs md:text-sm font-semibold text-slate-800">{item.value}</span>
                                                <span className="text-xs text-slate-500">
                                                    ({totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No task assignments yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks Completed Per Member */}
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Tasks Completed</h3>
                    <div className="flex flex-col items-center">
                        {completedTasksData.length > 0 ? (
                            <>
                                <div className="relative w-full h-48 md:h-64" style={{ zIndex: 1 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={completedTasksData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {completedTasksData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                                        <div className="text-center">
                                            <p className="text-2xl md:text-3xl font-bold text-slate-800">{completedTasks}</p>
                                            <p className="text-xs text-slate-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full space-y-2 md:space-y-3 mt-4 max-h-48 md:max-h-64 overflow-y-auto">
                                    {completedTasksData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 md:w-4 md:h-4 rounded"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-xs md:text-sm text-slate-700 truncate max-w-[120px] md:max-w-[150px]">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs md:text-sm font-semibold text-slate-800">{item.value}</span>
                                                <span className="text-xs text-slate-500">
                                                    ({completedTasks > 0 ? Math.round((item.value / completedTasks) * 100) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No completed tasks yet</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* Notes Created Per Member */}
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Notes Created</h3>
                    <div className="flex flex-col items-center">
                        {memberNotesData.length > 0 ? (
                            <>
                                <div className="relative w-full h-48 md:h-64" style={{ zIndex: 1 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={memberNotesData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {memberNotesData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                                        <div className="text-center">
                                            <p className="text-2xl md:text-3xl font-bold text-slate-800">{totalNotes}</p>
                                            <p className="text-xs text-slate-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full space-y-2 md:space-y-3 mt-4 max-h-48 md:max-h-64 overflow-y-auto">
                                    {memberNotesData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 md:w-4 md:h-4 rounded"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-xs md:text-sm text-slate-700 truncate max-w-[120px] md:max-w-[150px]">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs md:text-sm font-semibold text-slate-800">{item.value}</span>
                                                <span className="text-xs text-slate-500">
                                                    ({totalNotes > 0 ? Math.round((item.value / totalNotes) * 100) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No notes yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Recent Activity</h3>
                {recentActivity.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                        {recentActivity.map(activity => {
                            const ActivityIcon = activity.icon
                            const colorClasses = {
                                blue: 'bg-blue-100 text-blue-600',
                                green: 'bg-green-100 text-green-600',
                                purple: 'bg-purple-100 text-purple-600',
                                orange: 'bg-orange-100 text-orange-600'
                            }
                            return (
                                <div key={activity.id} className="flex items-start gap-3 md:gap-4 pb-3 md:pb-4 border-b border-slate-100 last:border-0">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[activity.color]}`}>
                                        <ActivityIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm md:text-base text-slate-700">
                                            <span className="font-semibold">{activity.user}</span> {activity.action}
                                            {activity.target && (
                                                <span className="font-medium text-slate-900"> "{activity.target}"</span>
                                            )}
                                        </p>
                                        <p className="text-xs md:text-sm text-slate-500 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No recent activity</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StatsPage
