import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mail, UserPlus, Crown, Check, X } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const PeoplePage = () => {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const [teamMembers, setTeamMembers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [pendingRequests, setPendingRequests] = useState([])
    const [currentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))
    const [project, setProject] = useState(null)

    // Fetch project details and members
    useEffect(() => {
        if (projectId) {
            fetchProjectDetails()
            fetchProjectMembers()
            fetchPendingRequests()
        }
    }, [projectId])

    const fetchProjectDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/projects/${projectId}`)
            if (response.data.success) {
                setProject(response.data.project)
            }
        } catch (error) {
            console.error('Error fetching project details:', error)
        }
    }

    const fetchProjectMembers = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get(`http://localhost:3000/api/projects/${projectId}/members`)

            if (response.data.success) {
                setTeamMembers(response.data.members)
            }
        } catch (error) {
            console.error('Error fetching project members:', error)
            toast.error('Failed to load team members')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/projects/${projectId}/requests`)
            if (response.data.success) {
                setPendingRequests(response.data.requests)
            }
        } catch (error) {
            console.error('Error fetching pending requests:', error)
        }
    }

    const getInitials = (name) => {
        if (!name) return '?'
        const names = name.split(' ')
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        }
        return names[0][0].toUpperCase()
    }

    const handleApprove = async (request) => {
        try {
            const response = await axios.put(
                `http://localhost:3000/api/projects/${projectId}/requests/${request.id}/approve`
            )

            if (response.data.success) {
                toast.success(`${request.name} has been approved!`)
                // Refresh both lists
                fetchProjectMembers()
                fetchPendingRequests()
            }
        } catch (error) {
            console.error('Error approving request:', error)
            toast.error('Failed to approve request')
        }
    }

    const handleDeny = async (requestId, userName) => {
        try {
            const response = await axios.put(
                `http://localhost:3000/api/projects/${projectId}/requests/${requestId}/reject`
            )

            if (response.data.success) {
                toast.success(`Request from ${userName} has been rejected`)
                // Remove from pending requests
                setPendingRequests(pendingRequests.filter(req => req.id !== requestId))
            }
        } catch (error) {
            console.error('Error rejecting request:', error)
            toast.error('Failed to reject request')
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Team Members</h2>
                    <p className="text-slate-600 mt-1">
                        {isLoading ? 'Loading...' : `${teamMembers.length} people working on this project`}
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <UserPlus className="w-5 h-5" />
                    Add Member
                </button>
            </div>

            {/* Pending Approval Requests */}
            {project && project.authorId === currentUser.id && pendingRequests.length > 0 && (
                <div className="bg-white border border-indigo-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Pending Approval Requests</h3>
                            <p className="text-sm text-slate-600 mt-1">{pendingRequests.length} people waiting for approval</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 bg-linear-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-lg font-bold text-white">{getInitials(request.name)}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4
                                            className="text-base font-semibold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors"
                                            onClick={() => handleUserClick(request.id)}
                                        >
                                            {request.name}
                                        </h4>
                                        <p className="text-sm text-slate-600">{request.designation || 'Team Member'}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{request.email}</span>
                                            {request.company && (
                                                <>
                                                    <span>•</span>
                                                    <span>{request.company}</span>
                                                </>
                                            )}
                                            {request.requestedAt && (
                                                <>
                                                    <span>•</span>
                                                    <span>Requested {formatDate(request.requestedAt)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleApprove(request)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            title="Approve request"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span className="hidden sm:inline">Approve</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeny(request.id, request.name)}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                            title="Deny request"
                                        >
                                            <X className="w-4 h-4" />
                                            <span className="hidden sm:inline">Deny</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Team Members Grid */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Current Team</h3>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading team members...</p>
                    </div>
                ) : teamMembers.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl">
                        <UserPlus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Team Members Yet</h3>
                        <p className="text-slate-600">Invite people to join this project</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teamMembers.map(member => (
                            <div key={member.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 ${member.isOwner ? 'bg-linear-to-br from-amber-500 to-orange-500' : 'bg-linear-to-br from-blue-600 to-indigo-600'} rounded-xl flex items-center justify-center shrink-0`}>
                                        <span className="text-xl font-bold text-white">{getInitials(member.name)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3
                                                className="text-lg font-semibold text-slate-800 truncate hover:text-blue-600 cursor-pointer transition-colors"
                                                onClick={() => handleUserClick(member.id)}
                                            >
                                                {member.name || 'Unknown User'}
                                            </h3>
                                            {member.isOwner && (
                                                <Crown className="w-4 h-4 text-yellow-500 shrink-0" title="Project Owner" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mb-3">
                                            {member.isOwner ? 'Project Owner' : (member.designation || 'Team Member')}
                                        </p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Mail className="w-4 h-4" />
                                                <span className="truncate">{member.email || 'No email'}</span>
                                            </div>
                                            {member.company && (
                                                <p className="text-xs text-slate-500 pl-6">
                                                    {member.company}
                                                </p>
                                            )}
                                            {member.joinedAt && (
                                                <p className="text-xs text-slate-400 pl-6">
                                                    Joined {formatDate(member.joinedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PeoplePage
