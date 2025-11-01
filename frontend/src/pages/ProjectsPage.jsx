import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Users, Calendar, Clock, Coffee, Target, TrendingUp } from 'lucide-react'

const ProjectsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        author: ''
    })

    // Personal work stats
    const [workStats] = useState({
        workedMinutes: 195, // 3h 15m
        isWorking: true,
        lastBreak: '1.5 hours ago',
        tasksCompleted: 8,
        projectsActive: 2
    })

    const [projects, setProjects] = useState([
        {
            id: 1,
            title: 'E-commerce Platform',
            description: 'Building a modern e-commerce platform with React and Node.js',
            author: 'John Doe',
            peopleJoined: 5,
            createdAt: '2025-10-15',
            status: 'Active',
            progress: 75
        },
        {
            id: 2,
            title: 'Mobile App',
            description: 'Cross-platform mobile application for task management',
            author: 'Jane Smith',
            peopleJoined: 3,
            createdAt: '2025-10-20',
            status: 'Active',
            progress: 45
        },
        {
            id: 3,
            title: 'Dashboard UI',
            description: 'Admin dashboard with analytics and reporting features',
            author: 'Mike Johnson',
            peopleJoined: 8,
            createdAt: '2025-09-10',
            status: 'Completed',
            progress: 100
        },
    ])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        // Create new project object
        const newProject = {
            id: projects.length + 1,
            title: formData.title,
            description: formData.description,
            author: formData.author,
            peopleJoined: 1,
            createdAt: new Date().toISOString().split('T')[0],
            status: 'Active',
            progress: 0
        }

        // Add new project to the beginning of the list
        setProjects(prev => [newProject, ...prev])

        // Close modal and reset form
        setIsModalOpen(false)
        setFormData({ title: '', description: '', author: '' })
    }

    const getInitials = (title) => {
        return title.charAt(0).toUpperCase()
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatWorkTime = (minutes) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    const getSuggestion = (workedMinutes, isWorking) => {
        if (!isWorking) {
            return {
                text: 'On break',
                color: 'bg-green-100 text-green-700 border-green-200',
                icon: Coffee,
                message: 'Enjoy your break! 😊'
            }
        }
        if (workedMinutes >= 240) { // 4+ hours
            return {
                text: 'Take a break!',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: Coffee,
                message: 'You\'ve been working for a while. Time for a break! 🌟'
            }
        } else if (workedMinutes >= 180) { // 3+ hours
            return {
                text: 'Break soon',
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: Coffee,
                message: 'Consider taking a break in the next 15-30 minutes 💪'
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
                message: 'Fresh start! Perfect time to tackle important tasks ✨'
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${workStats.isWorking ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {workStats.isWorking ? '🟢 Working' : '⚪ On Break'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* Work Time */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Work Time</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{formatWorkTime(workStats.workedMinutes)}</p>
                    </div>

                    {/* Last Break */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Coffee className="w-4 h-4" />
                            <span className="text-sm font-medium">Last Break</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-800">{workStats.lastBreak}</p>
                    </div>

                    {/* Tasks Completed */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Target className="w-4 h-4" />
                            <span className="text-sm font-medium">Tasks Done</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{workStats.tasksCompleted}</p>
                    </div>

                    {/* Active Projects */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Active Projects</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{workStats.projectsActive}</p>
                    </div>
                </div>

                {/* Suggestion Banner */}
                {(() => {
                    const suggestion = getSuggestion(workStats.workedMinutes, workStats.isWorking)
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
                            {suggestion.text !== 'On break' && (
                                <button className="px-4 py-2 bg-white rounded-lg font-semibold text-sm hover:shadow-md transition-all">
                                    {suggestion.text.includes('break') || suggestion.text.includes('Break') ? 'Take Break' : 'Keep Going'}
                                </button>
                            )}
                        </div>
                    )
                })()}
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <Link
                        key={project.id}
                        to={`/project/${project.id}`}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 overflow-hidden block"
                    >
                        {/* Project Header */}
                        <div className="p-6 pb-4">
                            <div className="flex items-start gap-4 mb-4">
                                {/* Profile Image with First Letter */}
                                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                                    <span className="text-2xl font-bold text-white">{getInitials(project.title)}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-slate-800 truncate">{project.title}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${project.status === 'Active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                        {project.description}
                                    </p>
                                </div>
                            </div>

                            {/* Author */}
                            <div className="mb-3">
                                <p className="text-sm text-slate-500">
                                    <span className="font-medium text-slate-700">Author:</span> {project.author}
                                </p>
                            </div>

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
                                        className="bg-linear-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Floating Add Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
                aria-label="Add new project"
            >
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Create New Project</h2>
                                <p className="text-sm text-slate-600 mt-1">Fill in the details to start a new project</p>
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
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                                    Author Name *
                                </label>
                                <input
                                    type="text"
                                    id="author"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                >
                                    Create Project
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
    )
}

export default ProjectsPage
