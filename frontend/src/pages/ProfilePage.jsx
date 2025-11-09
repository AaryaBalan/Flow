import React, { useState, useEffect } from 'react'
import { Mail, Calendar, MapPin, Edit, Phone, Building2, Briefcase, Code, Github, Linkedin, ExternalLink, Clock, Target, Users as UsersIcon, Coffee } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import EditProfileModal from '../components/EditProfileModal'
import toast from 'react-hot-toast'
import axios from 'axios'

const ProfilePage = () => {
    const navigate = useNavigate()
    const { userId } = useParams()
    const [user, setUser] = useState(null)
    const [activity, setActivity] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))
    const isOwnProfile = !userId || parseInt(userId) === currentUser.id

    useEffect(() => {
        if (userId) {
            // Fetch user by ID from backend
            fetchUserById(userId)
            fetchUserActivity(userId)
        } else {
            // Load current user from localStorage
            const userData = localStorage.getItem('user')
            if (userData) {
                const parsedUser = JSON.parse(userData)
                setUser(parsedUser)
                if (parsedUser.id) {
                    fetchUserActivity(parsedUser.id)
                }
            }
            setIsLoading(false)
        }

        // Set up polling for activity updates (every 30 seconds)
        const activityInterval = setInterval(() => {
            const targetUserId = userId || currentUser.id
            if (targetUserId) {
                fetchUserActivity(targetUserId)
            }
        }, 30000)

        return () => clearInterval(activityInterval)
    }, [userId])

    const fetchUserById = async (id) => {
        try {
            setIsLoading(true)
            const response = await axios.get(`http://localhost:3000/api/users/${id}`)
            if (response.data.success) {
                setUser(response.data.user)
            }
        } catch (error) {
            console.error('Error fetching user:', error)
            toast.error('Failed to load user profile')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchUserActivity = async (id) => {
        try {
            const response = await axios.get(`http://localhost:3000/api/users/${id}/activity`)
            if (response.data.success) {
                setActivity(response.data.activity)
            }
        } catch (error) {
            console.error('Error fetching activity:', error)
        }
    }

    const formatWorkTime = (minutes) => {
        if (!minutes) return '0h 0m'
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    const formatLastBreak = (timestamp) => {
        if (!timestamp) return 'No breaks yet'
        const breakTime = new Date(timestamp)
        const now = new Date()
        const diff = Math.floor((now - breakTime) / 60000) // minutes

        if (diff < 60) return `${diff} minutes ago`
        if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
        return breakTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const handleEditProfile = () => {
        setIsModalOpen(true)
    }

    const handleSaveProfile = async (updatedData) => {
        try {
            // Call backend API to update profile
            const response = await axios.put(`http://localhost:3000/api/users/profile/${user.id}`, updatedData)

            if (response.data.success) {
                // Update localStorage with new data
                const updatedUser = { ...user, ...updatedData }
                localStorage.setItem('user', JSON.stringify(updatedUser))
                setUser(updatedUser)

                setIsModalOpen(false)
                toast.success('Profile updated successfully!')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error(error.response?.data?.message || 'Failed to update profile')
        }
    }

    const getInitials = () => {
        if (user?.name) {
            const names = user.name.split(' ')
            if (names.length >= 2) {
                return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            }
            return names[0][0].toUpperCase()
        }
        return 'DC'
    }

    const getJoinDate = () => {
        if (user?.createdAt) {
            const date = new Date(user.createdAt)
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        }
        return 'Recently'
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Cover Image */}
                <div className="h-24 sm:h-32 bg-linear-to-r from-blue-600 to-indigo-600"></div>

                {/* Profile Info */}
                <div className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 sm:-mt-16 mb-4 sm:mb-6 gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 w-full sm:w-auto">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl sm:text-4xl font-bold text-blue-600">
                                {getInitials()}
                            </div>
                            <div className="mb-0 sm:mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                                        {user?.name || user?.email?.split('@')[0] || 'User'}
                                    </h1>
                                    {activity && (
                                        <div className={`w-3 h-3 rounded-full ${activity.currentStatus === 'active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm sm:text-base text-slate-600">{user?.designation || 'Developer'}</p>
                                    {activity && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activity.currentStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {activity.currentStatus === 'active' ? 'Active' : 'On Break'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {isOwnProfile && (
                            <button
                                onClick={handleEditProfile}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center sm:mb-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3 text-slate-600 text-sm sm:text-base">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                            <span className="truncate">{user?.email || 'No email'}</span>
                        </div>
                        {user?.phone && (
                            <div className="flex items-center gap-2 sm:gap-3 text-slate-600 text-sm sm:text-base">
                                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                                <span>{user.phone}</span>
                            </div>
                        )}
                        {user?.location && (
                            <div className="flex items-center gap-2 sm:gap-3 text-slate-600 text-sm sm:text-base">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0" />
                                <span>{user.location}</span>
                            </div>
                        )}
                        {user?.company && (
                            <div className="flex items-center gap-2 sm:gap-3 text-slate-600 text-sm sm:text-base">
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                                <span>{user.company}</span>
                            </div>
                        )}
                        {user?.experience && (
                            <div className="flex items-center gap-2 sm:gap-3 text-slate-600 text-sm sm:text-base">
                                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                                <span>{user.experience} years experience</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 sm:gap-3 text-slate-600 text-sm sm:text-base">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                            <span>Joined {getJoinDate()}</span>
                        </div>
                    </div>

                    {/* Today's Activity Section */}
                    {activity && (
                        <div className="mb-4 sm:mb-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" />
                                Today's Activity
                            </h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {/* Work Time */}
                                <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs sm:text-sm font-medium">Work Time</span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{formatWorkTime(activity.workTimeToday)}</p>
                                </div>

                                {/* Last Break */}
                                <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                                        <Coffee className="w-4 h-4" />
                                        <span className="text-xs sm:text-sm font-medium">Last Break</span>
                                    </div>
                                    <p className="text-sm sm:text-base font-semibold text-slate-800">{formatLastBreak(activity.lastBreakTime)}</p>
                                </div>

                                {/* Tasks Done */}
                                <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                                        <Target className="w-4 h-4" />
                                        <span className="text-xs sm:text-sm font-medium">Tasks Done</span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{activity.tasksCompletedToday}</p>
                                </div>

                                {/* Active Projects */}
                                <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                                        <UsersIcon className="w-4 h-4" />
                                        <span className="text-xs sm:text-sm font-medium">Active Projects</span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{activity.activeProjects}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* About Section */}
                    {user?.about ? (
                        <div className="mb-4 sm:mb-6">
                            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3">About</h2>
                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                                {user.about}
                            </p>
                        </div>
                    ) : isOwnProfile ? (
                        <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-center">
                            <p className="text-xs sm:text-sm text-slate-500">No bio added yet. Click "Edit Profile" to add information about yourself.</p>
                        </div>
                    ) : null}

                    {/* Skills Section */}
                    {user?.skills ? (
                        <div className="mb-4 sm:mb-6">
                            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                                <Code className="w-4 h-4 sm:w-5 sm:h-5" />
                                Skills & Technologies
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.split(',').map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-2.5 sm:px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-medium"
                                    >
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : isOwnProfile ? (
                        <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-center">
                            <Code className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm text-slate-500">No skills listed yet. Add your skills to showcase your expertise.</p>
                        </div>
                    ) : null}

                    {/* Social Links */}
                    {(user?.github || user?.linkedin) ? (
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3">Connect</h2>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                                {user.github && (
                                    <a
                                        href={user.github.startsWith('http') ? user.github : `https://github.com/${user.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 sm:py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm sm:text-base"
                                    >
                                        <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>GitHub</span>
                                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </a>
                                )}
                                {user.linkedin && (
                                    <a
                                        href={user.linkedin.startsWith('http') ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                                    >
                                        <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>LinkedIn</span>
                                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : isOwnProfile ? (
                        <div className="p-4 sm:p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Github className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                                <Linkedin className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500">No social links added yet. Connect your GitHub and LinkedIn profiles.</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center hover:shadow-md transition-shadow">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                        {user?.projectsCount || 0}
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-slate-600">Projects</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center hover:shadow-md transition-shadow">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                        {user?.completedCount || 0}
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-slate-600">Completed</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center hover:shadow-md transition-shadow">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                        {user?.collaboratorsCount || 0}
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-slate-600">Collaborators</div>
                </div>
            </div>

            {/* Edit Profile Modal - Only show for own profile */}
            {isOwnProfile && (
                <EditProfileModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userData={user}
                    onSave={handleSaveProfile}
                />
            )}
        </div>
    )
}

export default ProfilePage
