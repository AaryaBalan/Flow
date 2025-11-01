import React, { useState } from 'react'
import { Mail, UserPlus, Crown, Check, X } from 'lucide-react'

const PeoplePage = () => {
    const [teamMembers, setTeamMembers] = useState([
        { id: 1, name: 'John Doe', role: 'Project Owner', email: 'john@example.com', avatar: 'J', isOwner: true },
        { id: 2, name: 'Jane Smith', role: 'Developer', email: 'jane@example.com', avatar: 'J' },
        { id: 3, name: 'Mike Johnson', role: 'Designer', email: 'mike@example.com', avatar: 'M' },
        { id: 4, name: 'Sarah Williams', role: 'Developer', email: 'sarah@example.com', avatar: 'S' },
        { id: 5, name: 'Tom Brown', role: 'QA Engineer', email: 'tom@example.com', avatar: 'T' },
    ])

    const [pendingRequests, setPendingRequests] = useState([
        { id: 101, name: 'Alex Martinez', role: 'Backend Developer', email: 'alex@example.com', avatar: 'A', requestedAt: '2025-10-30' },
        { id: 102, name: 'Emily Chen', role: 'UI/UX Designer', email: 'emily@example.com', avatar: 'E', requestedAt: '2025-10-31' },
        { id: 103, name: 'David Wilson', role: 'DevOps Engineer', email: 'david@example.com', avatar: 'D', requestedAt: '2025-11-01' },
    ])

    const handleApprove = (request) => {
        // Add to team members
        setTeamMembers([...teamMembers, {
            id: request.id,
            name: request.name,
            role: request.role,
            email: request.email,
            avatar: request.avatar
        }])
        // Remove from pending requests
        setPendingRequests(pendingRequests.filter(req => req.id !== request.id))
    }

    const handleDeny = (requestId) => {
        setPendingRequests(pendingRequests.filter(req => req.id !== requestId))
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Team Members</h2>
                    <p className="text-slate-600 mt-1">{teamMembers.length} people working on this project</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <UserPlus className="w-5 h-5" />
                    Add Member
                </button>
            </div>

            {/* Pending Approval Requests */}
            {pendingRequests.length > 0 && (
                <div className="bg-linear-to-r bg-[#eef2ff] border border-[#3352fa] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Pending Approval Requests</h3>
                            <p className="text-sm text-slate-600 mt-1">{pendingRequests.length} people waiting for approval</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="bg-[#eef2ff] border border-[#3352fa] rounded-lg p-4 shadow-sm">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 bg-linear-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-lg font-bold text-white">{request.avatar}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-semibold text-slate-800">{request.name}</h4>
                                        <p className="text-sm text-slate-600">{request.role}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{request.email}</span>
                                            <span>•</span>
                                            <span>Requested {formatDate(request.requestedAt)}</span>
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
                                            onClick={() => handleDeny(request.id)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamMembers.map(member => (
                        <div key={member.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                    <span className="text-xl font-bold text-white">{member.avatar}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-slate-800 truncate">
                                            {member.name}
                                        </h3>
                                        {member.isOwner && (
                                            <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3">{member.role}</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{member.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PeoplePage
