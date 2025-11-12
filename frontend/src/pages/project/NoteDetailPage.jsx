import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Clock, User, Lock, Save, X, Calendar } from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import '../../styles/quill-custom.css'

const NoteDetailPage = () => {
    const { projectId, noteId } = useParams()
    const navigate = useNavigate()
    const [note, setNote] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [showPermissions, setShowPermissions] = useState(false)
    const [projectMembers, setProjectMembers] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        content: ''
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

    // Fetch note details
    useEffect(() => {
        if (noteId && currentUser) {
            fetchNote()
            fetchProjectMembers()
        }
    }, [noteId, currentUser])

    const fetchNote = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get(
                `http://localhost:3000/api/notes/${noteId}?userId=${currentUser.id}`
            )

            if (response.data.success) {
                setNote(response.data.note)
                setFormData({
                    title: response.data.note.title,
                    content: response.data.note.content
                })
            }
        } catch (error) {
            console.error('Error fetching note:', error)
            if (error.response?.status === 403) {
                toast.error('You do not have permission to view this note')
            } else if (error.response?.status === 404) {
                toast.error('Note not found')
            } else {
                toast.error('Failed to load note')
            }
            navigate(`/project/${projectId}/notes`)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchProjectMembers = async () => {
        try {
            const response = await axios.get(
                `http://localhost:3000/api/projects/${projectId}/members`
            )
            if (response.data.success) {
                // Fetch permissions for each member
                const membersWithPermissions = await Promise.all(
                    response.data.members.map(async (member) => {
                        try {
                            const permResponse = await axios.get(
                                `http://localhost:3000/api/notes/${noteId}/permissions/${member.id}`
                            )
                            return {
                                ...member,
                                canEdit: permResponse.data.canEdit || false,
                                canDelete: permResponse.data.canDelete || false
                            }
                        } catch (err) {
                            return {
                                ...member,
                                canEdit: false,
                                canDelete: false
                            }
                        }
                    })
                )
                setProjectMembers(membersWithPermissions)
            }
        } catch (error) {
            console.error('Error fetching members:', error)
        }
    }

    const handleUpdate = async (e) => {
        e.preventDefault()

        try {
            const response = await axios.put(
                `http://localhost:3000/api/notes/${noteId}`,
                {
                    title: formData.title,
                    content: formData.content,
                    userId: currentUser.id,
                    userName: currentUser.name || currentUser.email?.split('@')[0] || 'User'
                }
            )

            if (response.data.success) {
                toast.success('Note updated successfully!')
                setIsEditing(false)
                // Refetch the note to get updated data and permissions
                await fetchNote()
            }
        } catch (error) {
            console.error('Error updating note:', error)
            toast.error(error.response?.data?.message || 'Failed to update note')
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this note?')) {
            return
        }

        try {
            const response = await axios.delete(
                `http://localhost:3000/api/notes/${noteId}`,
                { data: { userId: currentUser.id } }
            )

            if (response.data.success) {
                toast.success('Note deleted successfully!')
                navigate(`/project/${projectId}/notes`)
            }
        } catch (error) {
            console.error('Error deleting note:', error)
            toast.error(error.response?.data?.message || 'Failed to delete note')
        }
    }

    const handleGrantPermission = async (userId, canEdit, canDelete) => {
        try {
            console.log('Granting permission:', { userId, currentUser, canEdit, canDelete })
            const response = await axios.post(
                `http://localhost:3000/api/notes/${noteId}/permissions`,
                {
                    targetUserId: userId,
                    canEdit,
                    canDelete,
                    grantedBy: currentUser.id
                }
            )

            if (response.data.success) {
                toast.success('Permission updated successfully!')
                fetchProjectMembers()
            }
        } catch (error) {
            console.error('Error granting permission:', error)
            toast.error(error.response?.data?.message || 'Failed to update permission')
        }
    }

    // Quill editor modules with toolbar configuration
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
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list', 'bullet', 'indent',
        'align',
        'link', 'image'
    ]

    const canEdit = note && (note.isOwner || note.canEdit || note.isProjectAdmin)
    const canDelete = note && (note.isOwner || note.canDelete || note.isProjectAdmin)
    const canManagePermissions = note && (note.isOwner || note.isProjectAdmin)

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading note...</p>
            </div>
        )
    }

    if (!note) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600">Note not found</p>
            </div>
        )
    }

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/project/${projectId}/notes`)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Notes
                    </button>
                    <div className="flex items-center gap-2">
                        {canManagePermissions && (
                            <button
                                onClick={() => setShowPermissions(!showPermissions)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <Lock className="w-5 h-5" />
                                Permissions
                            </button>
                        )}
                        {canEdit && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="w-5 h-5" />
                                Edit
                            </button>
                        )}
                        {canDelete && !isEditing && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Permission Management */}
                {showPermissions && canManagePermissions && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Manage Permissions</h3>
                        <div className="space-y-3">
                            {projectMembers.filter(member => member.id !== currentUser.id).map(member => {
                                const hasEditPermission = member.id === note.createdBy || member.canEdit
                                const hasDeletePermission = member.id === note.createdBy || member.canDelete

                                return (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                {member.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{member.name}</p>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={hasEditPermission}
                                                    onChange={(e) => handleGrantPermission(member.id, e.target.checked, hasDeletePermission)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    disabled={member.id === note.createdBy}
                                                />
                                                <span className="text-slate-700">Can Edit</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={hasDeletePermission}
                                                    onChange={(e) => handleGrantPermission(member.id, hasEditPermission, e.target.checked)}
                                                    className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                                                    disabled={member.id === note.createdBy}
                                                />
                                                <span className="text-slate-700">Can Delete</span>
                                            </label>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Note Content */}
                {isEditing ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <form onSubmit={handleUpdate} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Rich Text Editor */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Content
                                </label>
                                <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.content}
                                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                        modules={modules}
                                        formats={formats}
                                        placeholder="Write your note content here..."
                                        style={{ height: '400px', marginBottom: '50px' }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false)
                                        setFormData({
                                            title: note.title,
                                            content: note.content
                                        })
                                    }}
                                    className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        {/* Title */}
                        <h1 className="text-4xl font-bold text-slate-900 mb-6">
                            {note.title}
                        </h1>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-8 pb-6 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>Created by <strong>{note.createdByName}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{(() => {
                                    const utcDate = note.createdAt.endsWith('Z') ? note.createdAt : note.createdAt + 'Z'
                                    return new Date(utcDate).toLocaleDateString('en-IN', {
                                        timeZone: 'Asia/Kolkata',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                })()}</span>
                            </div>
                            {note.updatedBy && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Last edited by <strong>{note.updatedByName}</strong> on {(() => {
                                        const utcDate = note.updatedAt.endsWith('Z') ? note.updatedAt : note.updatedAt + 'Z'
                                        return new Date(utcDate).toLocaleDateString('en-IN', {
                                            timeZone: 'Asia/Kolkata',
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                    })()}</span>
                                </div>
                            )}
                        </div>

                        {/* Formatted Content */}
                        <div
                            className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed ql-editor"
                            style={{
                                wordBreak: 'break-word'
                            }}
                            dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                    </div>
                )}
            </div>

            <Toaster position="bottom-right" />

            <style jsx>{`
                .ql-editor a {
                    color: #2563eb !important;
                    text-decoration: underline !important;
                }
                .ql-editor a:hover {
                    color: #1d4ed8 !important;
                }
            `}</style>
        </>
    )
}

export default NoteDetailPage
