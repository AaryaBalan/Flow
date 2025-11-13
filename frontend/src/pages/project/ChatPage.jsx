import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Reply, Edit2, Trash2, X, Loader2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import io from 'socket.io-client'

// Get the backend URL dynamically based on current host
const getBackendURL = () => {
    const hostname = window.location.hostname
    // If accessing via network IP, use that IP for backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3000`
    }
    return 'http://localhost:3000'
}

const API_BASE_URL = `${getBackendURL()}/api`
const SOCKET_URL = getBackendURL()

const ChatPage = () => {
    const { projectId } = useParams()
    const [currentUser, setCurrentUser] = useState(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [replyTo, setReplyTo] = useState(null)
    const [editingMessage, setEditingMessage] = useState(null)
    const [typingUsers, setTypingUsers] = useState([])
    const [isTyping, setIsTyping] = useState(false)

    const messagesEndRef = useRef(null)
    const socketRef = useRef(null)
    const typingTimeoutRef = useRef(null)

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Format date for message groups
    const formatDate = (timestamp) => {
        const date = new Date(timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday'
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
    }

    // Load current user
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
    }, [])

    // Initialize Socket.io and load chat history
    useEffect(() => {
        if (!currentUser || !projectId) return

        // Connect to Socket.io
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling']
        })

        // Join project chat
        socketRef.current.emit('join-project-chat', {
            projectId,
            userId: currentUser.id,
            userName: currentUser.name
        })

        // Listen for new messages
        socketRef.current.on('new-message', (newMessage) => {
            setMessages(prev => [...prev, newMessage])
            setTimeout(scrollToBottom, 100)
        })

        // Listen for message edits
        socketRef.current.on('message-edited', (updatedMessage) => {
            setMessages(prev => prev.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
            ))
        })

        // Listen for message deletions
        socketRef.current.on('message-deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(msg => msg.id !== messageId))
        })

        // Listen for typing indicators
        socketRef.current.on('user-typing', ({ userId, userName }) => {
            if (userId !== currentUser.id) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u.userId === userId)) {
                        return [...prev, { userId, userName }]
                    }
                    return prev
                })
            }
        })

        socketRef.current.on('user-stopped-typing', ({ userId }) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== userId))
        })

        // Listen for errors
        socketRef.current.on('error', ({ message: errorMessage }) => {
            toast.error(errorMessage)
        })

        // Load chat history
        loadChatHistory()

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect()
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [currentUser, projectId])

    // Load chat history
    const loadChatHistory = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_BASE_URL}/chat/project/${projectId}`, {
                params: { userId: currentUser.id }
            })

            if (response.data.success) {
                setMessages(response.data.messages)
                setTimeout(scrollToBottom, 100)
            }
        } catch (error) {
            console.error('Error loading chat history:', error)
            toast.error(error.response?.data?.message || 'Failed to load chat history')
        } finally {
            setLoading(false)
        }
    }

    // Handle typing
    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true)
            socketRef.current?.emit('typing', {
                projectId,
                userId: currentUser.id,
                userName: currentUser.name
            })
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
            socketRef.current?.emit('stop-typing', {
                projectId,
                userId: currentUser.id
            })
        }, 2000)
    }

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault()

        if (!message.trim()) return

        if (editingMessage) {
            // Edit existing message
            socketRef.current?.emit('edit-message', {
                messageId: editingMessage.id,
                userId: currentUser.id,
                messageContent: message
            })
            setEditingMessage(null)
        } else {
            // Send new message
            socketRef.current?.emit('send-message', {
                projectId,
                senderId: currentUser.id,
                senderName: currentUser.name,
                messageContent: message,
                replyToMessageId: replyTo?.id || null,
                replyToUserId: replyTo?.senderId || null
            })
            setReplyTo(null)
        }

        setMessage('')
        setIsTyping(false)
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Scroll to bottom after sending
        setTimeout(scrollToBottom, 100)
    }

    // Handle reply
    const handleReply = (msg) => {
        setReplyTo(msg)
        setEditingMessage(null)
    }

    // Handle edit
    const handleEdit = (msg) => {
        setEditingMessage(msg)
        setMessage(msg.messageContent)
        setReplyTo(null)
    }

    // Handle delete
    const handleDelete = (messageId) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            socketRef.current?.emit('delete-message', {
                messageId,
                userId: currentUser.id
            })
        }
    }

    // Cancel reply or edit
    const handleCancel = () => {
        setReplyTo(null)
        setEditingMessage(null)
        setMessage('')
    }

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = formatDate(msg.createdAt)
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(msg)
        return groups
    }, {})


    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Team Chat</h2>
                    <p className="text-sm sm:text-base text-slate-600">Communicate with your team members</p>
                </div>
            </div>

            {/* Chat Container - Fixed Height */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] sm:h-[calc(100vh-250px)]">
                {/* Messages Area */}
                <div className="flex-1 bg-slate-50 p-3 sm:p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <MessageSquare className="w-16 h-16 mb-4" />
                            <p className="text-lg font-semibold">No messages yet</p>
                            <p className="text-sm">Be the first to start the conversation!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                                <div key={date}>
                                    {/* Date Separator */}
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-slate-300"></div>
                                        <span className="text-xs font-semibold text-slate-500 px-3 py-1 bg-slate-200 rounded-full">
                                            {date}
                                        </span>
                                        <div className="flex-1 h-px bg-slate-300"></div>
                                    </div>

                                    {/* Messages for this date */}
                                    <div className="space-y-4">
                                        {dateMessages.map(msg => {
                                            const isCurrentUser = msg.senderId === currentUser?.id
                                            const avatar = msg.senderName.charAt(0).toUpperCase()

                                            return (
                                                <div key={msg.id} className={`flex gap-2 sm:gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                                                    {!isCurrentUser && (
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                                            <span className="text-xs sm:text-sm font-bold text-white">{avatar}</span>
                                                        </div>
                                                    )}

                                                    <div className={`max-w-[85%] sm:max-w-[70%]`}>
                                                        {!isCurrentUser && (
                                                            <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">{msg.senderName}</p>
                                                        )}

                                                        <div className={`rounded-lg p-3 sm:p-4 ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white shadow-sm'}`}>
                                                            {/* Reply Context */}
                                                            {msg.replyToMessageId && (
                                                                <div className={`mb-2 pb-2 border-l-2 pl-2 text-xs sm:text-sm ${isCurrentUser ? 'border-blue-400 opacity-80' : 'border-slate-300 text-slate-600'}`}>
                                                                    <p className="font-semibold">{msg.replyToUserName}</p>
                                                                    <p className="truncate">{msg.replyToMessageContent}</p>
                                                                </div>
                                                            )}

                                                            {/* Message Content */}
                                                            <p className={`text-sm sm:text-base wrap-break-word text-left ${isCurrentUser ? 'text-white' : 'text-slate-700'}`}>
                                                                {msg.messageContent}
                                                            </p>

                                                            {/* Edit indicator */}
                                                            {msg.editedAt && (
                                                                <p className={`text-xs mt-1 text-left ${isCurrentUser ? 'text-blue-200' : 'text-slate-500'}`}>
                                                                    (edited)
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Message Actions */}
                                                        <div className={`flex items-center gap-2 mt-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                                                            <p className="text-xs text-slate-500">{formatTime(msg.createdAt)}</p>

                                                            {!isCurrentUser && (
                                                                <button
                                                                    onClick={() => handleReply(msg)}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Reply
                                                                </button>
                                                            )}

                                                            {isCurrentUser && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEdit(msg)}
                                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                                    >
                                                                        <Edit2 className="w-3 h-3" />
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(msg.id)}
                                                                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                        Delete
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {typingUsers.length > 0 && (
                                <div className="flex gap-3 items-center">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                                        <span className="text-xs sm:text-sm font-bold text-white">{typingUsers[0].userName.charAt(0)}</span>
                                    </div>
                                    <div className="bg-white shadow-sm rounded-lg px-4 py-2">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Reply/Edit Preview */}
                {(replyTo || editingMessage) && (
                    <div className="px-3 sm:px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {replyTo ? (
                                <>
                                    <Reply className="w-4 h-4 text-blue-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-semibold text-blue-700">Replying to {replyTo.senderName}</p>
                                        <p className="text-xs text-slate-600 truncate">{replyTo.messageContent}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Edit2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-semibold text-blue-700">Editing message</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={handleCancel}
                            className="ml-2 p-1 hover:bg-blue-100 rounded transition-colors shrink-0"
                        >
                            <X className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                )}

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-slate-200 flex gap-2 sm:gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value)
                            handleTyping()
                        }}
                        placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={1000}
                    />
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
                    >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">{editingMessage ? 'Update' : 'Send'}</span>
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ChatPage

