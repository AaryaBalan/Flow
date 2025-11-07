import React, { useState, useRef, useEffect } from 'react'
import { Link, useParams, Outlet, useLocation } from 'react-router-dom'
import {
    Menu,
    X,
    CheckSquare,
    Sparkles,
    MessageSquare,
    Users,
    BarChart3,
    ArrowLeft
} from 'lucide-react'
import axios from 'axios'

const SingleProjectPage = () => {
    const { projectId } = useParams()
    const location = useLocation()
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false)
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)
    const [projectName, setProjectName] = useState('Project')
    const leftSidebarRef = useRef(null)
    const rightSidebarRef = useRef(null)

    // Fetch project details
    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/projects/${projectId}`)
                if (response.data.success) {
                    setProjectName(response.data.project.title)
                }
            } catch (error) {
                console.error('Error fetching project details:', error)
            }
        }

        if (projectId) {
            fetchProjectDetails()
        }
    }, [projectId])

    // Close left sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (leftSidebarRef.current && !leftSidebarRef.current.contains(event.target)) {
                setIsLeftSidebarOpen(false)
            }
        }

        if (isLeftSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isLeftSidebarOpen])

    // Close right sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (rightSidebarRef.current && !rightSidebarRef.current.contains(event.target)) {
                setIsRightSidebarOpen(false)
            }
        }

        if (isRightSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isRightSidebarOpen])

    const leftNavItems = [
        { id: 'home', name: 'Home', icon: ArrowLeft, isLink: true, path: '/' },
        { id: 'projects', name: 'Projects', icon: CheckSquare, isLink: true, path: '/projects' },
        { id: 'ai', name: 'AI', icon: Sparkles, isLink: true, path: '/ai' },
        { id: 'profile', name: 'Profile', icon: Users, isLink: true, path: '/profile' },
    ]

    const rightNavItems = [
        { id: 'task', name: 'Task', icon: CheckSquare, path: `/project/${projectId}/task` },
        { id: 'ai', name: 'AI', icon: Sparkles, path: `/project/${projectId}/ai` },
        { id: 'chat', name: 'Chat', icon: MessageSquare, path: `/project/${projectId}/chat` },
        { id: 'peoples', name: 'Peoples', icon: Users, path: `/project/${projectId}/peoples` },
        { id: 'stats', name: 'Stats', icon: BarChart3, path: `/project/${projectId}/stats` },
    ]

    const isActiveRoute = (path) => {
        return location.pathname === path
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                aria-label="Toggle left sidebar"
                            >
                                <Menu className="w-6 h-6 text-slate-700" />
                            </button>

                            <Link
                                to="/projects"
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back to Projects</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                                <span className="text-lg font-bold text-white">{projectName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-slate-800">{projectName}</h1>
                                <p className="text-xs text-slate-500">Manage your project</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Left Sidebar Overlay */}
            {isLeftSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsLeftSidebarOpen(false)}
                />
            )}

            {/* Left Sidebar */}
            <aside
                ref={leftSidebarRef}
                className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                <span className="text-lg font-bold text-white">DC</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800">Dev Collab</span>
                        </div>
                        <button
                            onClick={() => setIsLeftSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {leftNavItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <li key={item.id}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsLeftSidebarOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                                        >
                                            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-200">
                        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-slate-800 mb-1">Need Help?</p>
                            <p className="text-xs text-slate-600">
                                Visit our documentation or contact support
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Right Sidebar Overlay */}
            {isRightSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsRightSidebarOpen(false)}
                />
            )}

            {/* Right Sidebar */}
            <aside
                ref={rightSidebarRef}
                className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                <span className="text-lg font-bold text-white">P</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Project Menu</h2>
                                <p className="text-xs text-slate-500">Navigate sections</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsRightSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {rightNavItems.map((item) => {
                                const Icon = item.icon
                                const isActive = isActiveRoute(item.path)
                                return (
                                    <li key={item.id}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsRightSidebarOpen(false)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${isActive
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-200">
                        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-slate-800 mb-1">Project Tools</p>
                            <p className="text-xs text-slate-600">
                                Access all project management features
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Fixed Right Menu Button */}
            <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-30"
                aria-label="Toggle project menu"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    )
}

export default SingleProjectPage
