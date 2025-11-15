import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    Home as HomeIcon,
    FolderKanban,
    Sparkles,
    User,
    Menu,
    X,
    LogOut
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast';

const Navbar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const sidebarRef = useRef(null)
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem('user')
        toast.success('Logged out successfully!')
        setTimeout(() => {
            window.location.href = '/auth'
        }, 1500);
    }

    // Close sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false)
            }
        }

        if (isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isSidebarOpen])

    const navItems = [
        { name: 'Home', icon: HomeIcon, path: '/' },
        { name: 'Projects', icon: FolderKanban, path: '/projects' },
        { name: 'AI', icon: Sparkles, path: '/ai' },
        { name: 'Profile', icon: User, path: '/profile' },
    ]

    return (
        <>
            {/* Top Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Menu Button + Logo */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                aria-label="Toggle menu"
                            >
                                <Menu className="w-6 h-6 text-slate-700" />
                            </button>

                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">F</span>
                                </div>
                                <span className="text-xl font-bold text-slate-800 hidden sm:block">
                                    Flow
                                </span>
                            </div>
                        </div>

                        {/* Right: User Button */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all hover:scale-110 cursor-pointer border border-red-200"
                                aria-label="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                <span className="text-lg font-bold text-white">F</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800">Flow</span>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = location.pathname === item.path
                                return (
                                    <li key={item.name}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${isActive
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
                            <p className="text-sm font-semibold text-slate-800 mb-1">Need Help?</p>
                            <p className="text-xs text-slate-600">
                                Visit our documentation or contact support
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
            <Toaster position="bottom-right" />
        </>
    )
}

export default Navbar
