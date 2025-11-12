import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Save, X, FileText, Clock, User, Lock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import '../../styles/quill-custom.css'
import API_BASE_URL from '../../config/api'

const NotesPage = () => {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const [notes, setNotes] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingNote, setEditingNote] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    })
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    })

    // Quill editor configuration
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ]
    }), [])

    const formats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'color', 'background', 'list', 'bullet', 'indent',
        'align', 'link', 'image'
    ]

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

    // Fetch notes when component mounts or page changes
    useEffect(() => {
        if (projectId && currentUser) {
            fetchNotes(false)

            // Set up auto-refresh every 15 seconds
            const refreshInterval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    fetchNotes(true)
                }
            }, 15000)

            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    fetchNotes(true)
                }
            }
            document.addEventListener('visibilitychange', handleVisibilityChange)

            return () => {
                clearInterval(refreshInterval)
                document.removeEventListener('visibilitychange', handleVisibilityChange)
            }
        }
    }, [projectId, currentUser, pagination.page])

    const fetchNotes = async (isAutoRefresh = false) => {
        if (!currentUser?.id) return

        try {
            if (!isAutoRefresh) {
                setIsLoading(true)
            } else {
                setIsRefreshing(true)
            }

            const response = await axios.get(
                `${API_BASE_URL}/api/notes/project/${projectId}?userId=${currentUser.id}&page=${pagination.page}&limit=${pagination.limit}`
            )

            if (response.data.success) {
                setNotes(response.data.notes)
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination
                }))
            }
        } catch (error) {
            console.error('Error fetching notes:', error)
            if (!isAutoRefresh) {
                toast.error('Failed to load notes')
            }
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleCreateNote = () => {
        setEditingNote(null)
        setFormData({ title: '', content: '' })
        setIsModalOpen(true)
    }

    const handleEditNote = (note) => {
        setEditingNote(note)
        setFormData({
            title: note.title,
            content: note.content
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!currentUser?.id) {
            toast.error('Please log in to save notes')
            return
        }

        // Trim title and content to remove excessive whitespace
        const trimmedTitle = formData.title.trim()
        const cleanedContent = cleanHtmlContent(formData.content)

        if (!trimmedTitle) {
            toast.error('Title cannot be empty')
            return
        }

        try {
            if (editingNote) {
                // Update existing note
                const response = await axios.put(
                    `${API_BASE_URL}/api/notes/${editingNote.id}`,
                    {
                        title: trimmedTitle,
                        content: cleanedContent,
                        userId: currentUser.id,
                        userName: currentUser.name || currentUser.email?.split('@')[0] || 'User'
                    }
                )

                if (response.data.success) {
                    toast.success('Note updated successfully!')
                    await fetchNotes()
                    setIsModalOpen(false)
                    setFormData({ title: '', content: '' })
                    setEditingNote(null)
                }
            } else {
                // Create new note
                const response = await axios.post(
                    `${API_BASE_URL}/api/notes/create`,
                    {
                        projectId: projectId,
                        title: trimmedTitle,
                        content: cleanedContent,
                        userId: currentUser.id,
                        userName: currentUser.name || currentUser.email?.split('@')[0] || 'User'
                    }
                )

                if (response.data.success) {
                    toast.success('Note created successfully!')
                    await fetchNotes()
                    setIsModalOpen(false)
                    setFormData({ title: '', content: '' })
                }
            }
        } catch (error) {
            console.error('Error saving note:', error)
            toast.error(error.response?.data?.message || 'Failed to save note')
        }
    }

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note?')) {
            return
        }

        try {
            const response = await axios.delete(
                `${API_BASE_URL}/api/notes/${noteId}`,
                {
                    data: { userId: currentUser.id }
                }
            )

            if (response.data.success) {
                toast.success('Note deleted successfully!')
                await fetchNotes()
            }
        } catch (error) {
            console.error('Error deleting note:', error)
            toast.error(error.response?.data?.message || 'Failed to delete note')
        }
    }

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const formatDate = (dateString) => {
        // SQLite stores in UTC but returns without timezone info
        // Append 'Z' to tell JavaScript this is UTC time
        const utcDate = dateString.endsWith('Z') ? dateString : dateString + 'Z'
        const date = new Date(utcDate)

        // Get current time
        const now = new Date()

        // Calculate the difference in seconds
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

        // Format date in IST timezone for display
        return date.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const canEdit = (note) => {
        return note.isOwner || note.canEdit || note.isProjectAdmin
    }

    const canDelete = (note) => {
        return note.isOwner || note.canDelete || note.isProjectAdmin
    }

    const cleanHtmlContent = (html) => {
        // Remove trailing empty paragraphs and line breaks
        let cleaned = html.trim()
        // Remove multiple trailing <p><br></p> or <p></p> tags
        cleaned = cleaned.replace(/(<p>(&nbsp;|\s|<br>)*<\/p>\s*)+$/gi, '')
        // Remove leading empty paragraphs
        cleaned = cleaned.replace(/^(<p>(&nbsp;|\s|<br>)*<\/p>\s*)+/gi, '')
        return cleaned.trim()
    }

    return (
        <>
            <div className="space-y-3 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h2 className="text-xl sm:text-3xl font-bold text-slate-800">Notes</h2>
                        <p className="text-slate-600 mt-0.5 sm:mt-1 flex items-center gap-2 text-xs sm:text-base">
                            {isLoading ? 'Loading...' : `${pagination.total} total notes`}
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
                            onClick={() => fetchNotes(false)}
                            disabled={isRefreshing}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
                            title="Refresh notes"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handleCreateNote}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-base whitespace-nowrap"
                        >
                            <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            <span>Create Note</span>
                        </button>
                    </div>
                </div>

                {/* Notes List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading notes...</p>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No notes yet</h3>
                        <p className="text-slate-600 mb-4">Create your first note to get started</p>
                        <button
                            onClick={handleCreateNote}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Note
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                            {notes.map((note, index) => {
                                // Rotate sticky notes with different colors
                                const colors = [
                                    'bg-yellow-100',
                                    'bg-pink-100',
                                    'bg-blue-100',
                                    'bg-green-100',
                                    'bg-purple-100',
                                    'bg-orange-100'
                                ]
                                const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-0']
                                const color = colors[index % colors.length]
                                const rotation = rotations[index % rotations.length]

                                return (
                                    <div
                                        key={note.id}
                                        onClick={() => navigate(`/project/${projectId}/notes/${note.id}`)}
                                        className={`${color} ${rotation} rounded-sm shadow-md hover:shadow-2xl hover:scale-105 hover:rotate-0 transition-all duration-300 p-3 sm:p-6 cursor-pointer group relative min-h-[200px] sm:min-h-[280px] max-h-[200px] sm:max-h-[280px] flex flex-col`}
                                        style={{
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                                            backgroundImage: 'linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(0, 0, 0, 0.05) calc(100% - 1px))',
                                            backgroundSize: '100% 24px'
                                        }}
                                    >
                                        {/* Sticky tape effect at top */}
                                        <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 w-10 sm:w-16 h-4 sm:h-6 bg-white/40 rounded-sm shadow-sm"
                                            style={{
                                                backdropFilter: 'blur(2px)',
                                                borderTop: '1px solid rgba(255, 255, 255, 0.6)',
                                                borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                                            }}
                                        />

                                        {/* Action buttons */}
                                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            {canEdit(note) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEditNote(note)
                                                    }}
                                                    className="p-1 sm:p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all"
                                                    title="Edit note"
                                                >
                                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" />
                                                </button>
                                            )}
                                            {canDelete(note) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteNote(note.id)
                                                    }}
                                                    className="p-1 sm:p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all"
                                                    title="Delete note"
                                                >
                                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Note Header */}
                                        <h3 className="text-sm sm:text-lg font-bold text-slate-800 mb-1.5 sm:mb-3 line-clamp-2 pr-5 sm:pr-8" style={{ fontFamily: 'cursive' }}>
                                            {note.title}
                                        </h3>

                                        {/* Note Content Preview */}
                                        <div
                                            className="text-slate-700 text-[10px] leading-tight sm:text-sm mb-auto line-clamp-6 sm:line-clamp-6 overflow-hidden"
                                            style={{ fontFamily: 'Arial, sans-serif' }}
                                            dangerouslySetInnerHTML={{
                                                __html: note.content.length > 150
                                                    ? note.content.substring(0, 150) + '...'
                                                    : note.content
                                            }}
                                        />

                                        {/* Note Footer */}
                                        <div className="mt-2 sm:mt-4 pt-1.5 sm:pt-3 border-t border-slate-300/30 space-y-0.5 sm:space-y-1">
                                            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-600">
                                                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                                <span className="truncate font-medium">{note.createdByName}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
                                                <div className="flex items-center gap-1 sm:gap-1.5">
                                                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                                    <span className="truncate">{formatDate(note.createdAt)}</span>
                                                </div>
                                                {!canEdit(note) && !canDelete(note) && (
                                                    <div className="flex items-center gap-1 text-amber-700">
                                                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-3 sm:mt-6">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="p-1.5 sm:p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                </button>
                                <span className="text-slate-600 px-2 sm:px-4 text-xs sm:text-base">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="p-1.5 sm:p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Create/Edit Note Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
                                        {editingNote ? 'Edit Note' : 'Create New Note'}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
                                        {editingNote ? 'Update your note' : 'Add a new note to the project'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        setFormData({ title: '', content: '' })
                                        setEditingNote(null)
                                    }}
                                    className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
                                {/* Title Field */}
                                <div>
                                    <label htmlFor="title" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter note title"
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Content Field */}
                                <div>
                                    <label htmlFor="content" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                        Content *
                                    </label>
                                    <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.content}
                                            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                            modules={modules}
                                            formats={formats}
                                            placeholder="Write your note content here..."
                                            style={{ height: '200px', marginBottom: '50px' }}
                                            className="text-sm sm:text-base"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2 sm:pt-4">
                                    <button
                                        type="submit"
                                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all text-sm sm:text-base"
                                    >
                                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                                        {editingNote ? 'Update Note' : 'Create Note'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false)
                                            setFormData({ title: '', content: '' })
                                            setEditingNote(null)
                                        }}
                                        className="px-4 sm:px-6 py-2 sm:py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <Toaster position="bottom-right" toastOptions={{
                style: {
                    fontSize: '14px',
                },
            }} />
        </>
    )
}

export default NotesPage
