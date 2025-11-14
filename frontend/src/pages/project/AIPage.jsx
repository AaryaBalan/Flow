import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Send, Sparkles, Bot, Lightbulb, MessageSquare, Zap, Shield, CheckCircle, TrendingUp, Users, Code, Loader } from 'lucide-react'
import AiComponent from '../../components/AiComponent'
import AiChatOutput from '../../components/AiChatOutput'
import API_BASE_URL from '../../config/api'

const AIPage = () => {
    const { projectId } = useParams()
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [activeTab, setActiveTab] = useState('chat')
    const [projectData, setProjectData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(true)
    const [currentUser, setCurrentUser] = useState(null)
    const [shouldGenerateRecs, setShouldGenerateRecs] = useState(false)
    const [recommendations, setRecommendations] = useState([])
    const [generatingRecs, setGeneratingRecs] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')
    const [generateKey, setGenerateKey] = useState(0)
    const [chatPrompt, setChatPrompt] = useState('')
    const [chatGenerateKey, setChatGenerateKey] = useState(0)
    const [waitingForResponse, setWaitingForResponse] = useState(false)
    const [projectMembers, setProjectMembers] = useState([])
    const [projectTasks, setProjectTasks] = useState([])
    const [projectNotes, setProjectNotes] = useState([])
    const chatEndRef = useRef(null)

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

    useEffect(() => {
        fetchProjectData()
    }, [projectId])

    // Fetch additional project context when project data and user are loaded
    useEffect(() => {
        if (projectData && currentUser) {
            fetchProjectContext()
        }
    }, [projectData, currentUser])

    // Fetch chat messages when user and project are loaded
    useEffect(() => {
        if (currentUser && projectId) {
            fetchChatMessages()
        }
    }, [currentUser, projectId])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchChatMessages = async () => {
        try {
            setLoadingMessages(true)
            const response = await axios.get(
                `${API_BASE_URL}/api/ai-chat/project/${projectId}?userId=${currentUser.id}`
            )

            if (response.data.success) {
                const loadedMessages = response.data.messages.map(msg => ({
                    id: msg.id,
                    type: msg.messageType,
                    text: msg.messageText,
                    timestamp: msg.createdAt,
                    userName: msg.userName,
                    userEmail: msg.userEmail
                }))

                // Add welcome message if no messages exist
                if (loadedMessages.length === 0) {
                    setMessages([
                        {
                            id: 'welcome',
                            type: 'ai',
                            text: 'Hello! I\'m your AI assistant for this project. How can I help you today?',
                            timestamp: new Date().toISOString()
                        }
                    ])
                } else {
                    setMessages(loadedMessages)
                }
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error)
            // Set welcome message on error
            setMessages([
                {
                    id: 'welcome',
                    type: 'ai',
                    text: 'Hello! I\'m your AI assistant for this project. How can I help you today?',
                    timestamp: new Date().toISOString()
                }
            ])
        } finally {
            setLoadingMessages(false)
        }
    }

    const fetchProjectData = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`)
            setProjectData(response.data.project || response.data)
        } catch (error) {
            console.error('Error fetching project data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchProjectContext = async () => {
        if (!projectData || !currentUser) return

        try {
            // Fetch team members
            const membersResponse = await axios.get(`${API_BASE_URL}/api/projects/${projectId}/members`)
            setProjectMembers(membersResponse.data.members || [])

            // Fetch tasks
            const tasksResponse = await axios.get(`${API_BASE_URL}/api/tasks/project/${projectId}`)
            setProjectTasks(tasksResponse.data.tasks || [])

            // Fetch notes
            const notesResponse = await axios.get(`${API_BASE_URL}/api/notes/project/${projectId}?userId=${currentUser.id}`)
            setProjectNotes(notesResponse.data.notes || [])
        } catch (error) {
            console.error('Error fetching project context:', error)
        }
    }

    const handleAiResponse = (response) => {
        // Parse the AI response into structured recommendations
        const lines = response.split('\n').filter(line => line.trim())
        const parsedRecs = []

        lines.forEach(line => {
            // Match pattern: "1. Category: Title - Description"
            const match = line.match(/^\d+\.\s*(.+?):\s*(.+?)\s*-\s*(.+)$/)
            if (match && parsedRecs.length < 6) {
                const [, category, title, description] = match
                parsedRecs.push({
                    id: parsedRecs.length + 1,
                    category: category.trim(),
                    title: title.trim(),
                    description: description.trim(),
                    icon: getCategoryIcon(category.trim()),
                    color: getCategoryColorName(category.trim())
                })
            }
        })

        setRecommendations(parsedRecs)
        setGeneratingRecs(false)
    }

    const handleChatAiResponse = async (response) => {
        setWaitingForResponse(false)

        try {
            // Save AI response to database
            const saveResponse = await axios.post(`${API_BASE_URL}/api/ai-chat/message`, {
                projectId: parseInt(projectId),
                userId: currentUser.id,
                messageType: 'ai',
                messageText: response
            })

            if (saveResponse.data.success) {
                // Update messages with the saved message from database
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages]
                    // Remove the "processing" message
                    newMessages.pop()
                    // Add the saved AI response
                    newMessages.push({
                        id: saveResponse.data.chatMessage.id,
                        type: 'ai',
                        text: response,
                        timestamp: saveResponse.data.chatMessage.createdAt
                    })
                    return newMessages
                })
            }
        } catch (error) {
            console.error('Error saving AI response:', error)
            // Still show the message even if save fails
            setMessages(prevMessages => {
                const newMessages = [...prevMessages]
                newMessages.pop()
                newMessages.push({
                    id: Date.now(),
                    type: 'ai',
                    text: response,
                    timestamp: new Date().toISOString()
                })
                return newMessages
            })
        }
    }

    const generateRecommendations = () => {
        if (!projectData) return

        setGeneratingRecs(true)
        setRecommendations([])
        setShouldGenerateRecs(true)
        setGenerateKey(prev => prev + 1) // Increment key to trigger new generation

        const prompt = `Based on this project:
Title: ${projectData.title}
Description: ${projectData.description}

Please provide exactly 6 specific, actionable recommendations to improve this project. Format each recommendation EXACTLY as follows (one per line):
1. Category: Title - Description
2. Category: Title - Description
(and so on...)

Categories must be one of: Architecture, Security, Performance, Testing, Documentation, User Experience, DevOps, Features

Make each recommendation practical and directly related to the project details provided.`

        setAiPrompt(prompt)
    }

    const getCategoryIcon = (category) => {
        const iconMap = {
            'Architecture': Code,
            'Security': Shield,
            'Performance': Zap,
            'Testing': CheckCircle,
            'Documentation': Lightbulb,
            'User Experience': Users,
            'DevOps': TrendingUp,
            'Features': Sparkles
        }
        return iconMap[category] || Lightbulb
    }

    const getCategoryColorName = (category) => {
        const colorMap = {
            'Architecture': 'teal',
            'Security': 'red',
            'Performance': 'yellow',
            'Testing': 'green',
            'Documentation': 'yellow',
            'User Experience': 'blue',
            'DevOps': 'indigo',
            'Features': 'teal'
        }
        return colorMap[category] || 'blue'
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (message.trim() && !waitingForResponse && currentUser) {
            const userMessage = {
                id: Date.now(),
                type: 'user',
                text: message,
                timestamp: new Date().toISOString(),
                userName: currentUser.name || currentUser.email?.split('@')[0] || 'User'
            }

            const processingMessage = {
                id: Date.now() + 1,
                type: 'ai',
                text: '...',
                timestamp: new Date().toISOString()
            }

            setMessages(prev => [...prev, userMessage, processingMessage])

            try {
                // Save user message to database
                await axios.post(`${API_BASE_URL}/api/ai-chat/message`, {
                    projectId: parseInt(projectId),
                    userId: currentUser.id,
                    messageType: 'user',
                    messageText: message
                })
            } catch (error) {
                console.error('Error saving user message:', error)
            }

            // Set up the AI prompt for chat
            const contextPrompt = projectData ? `
Project Context:
Title: ${projectData.title}
Description: ${projectData.description}
Created: ${new Date(projectData.createdAt).toLocaleDateString()}
Author: ${projectData.authorName || 'Unknown'}

Team Members (${projectMembers.length}):
${projectMembers.map(member => `- ${member.name} (${member.email}) - ${member.designation || 'No designation'}${member.isOwner ? ' [Owner]' : ''}`).join('\n')}

Tasks (${projectTasks.length} total):
${projectTasks.length > 0 ? projectTasks.map(task => `- ${task.title}: ${task.description} [${task.completed ? 'Completed' : 'Pending'}]`).join('\n') : 'No tasks yet'}

Notes (${projectNotes.length} total):
${projectNotes.length > 0 ? projectNotes.map(note => `- ${note.title}: ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`).join('\n') : 'No notes yet'}

User question: ${message}

Please provide a helpful, concise response based on the project context above.` : `User question: ${message}\n\nPlease provide a helpful, concise response.`

            setChatPrompt(contextPrompt)
            setChatGenerateKey(prev => prev + 1)
            setWaitingForResponse(true)
            setMessage('')
        }
    }

    const getColorClasses = (color) => {
        const colors = {
            teal: 'bg-teal-100 text-teal-700 border-teal-200',
            red: 'bg-red-100 text-red-700 border-red-200',
            yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            green: 'bg-green-100 text-green-700 border-green-200',
            blue: 'bg-blue-100 text-blue-700 border-blue-200',
            indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200'
        }
        return colors[color] || colors.blue
    }

    const handleSaveAsNote = async (aiContent) => {
        if (!currentUser || !projectId) {
            console.error('Missing user or project information')
            return
        }

        try {
            // Generate a title from the AI content
            let title = 'AI Generated Note'
            const firstLine = aiContent.split('\n')[0].trim()

            if (firstLine && firstLine.length > 0) {
                // Remove markdown formatting and limit to 60 characters
                title = firstLine
                    .replace(/^#+\s*/, '') // Remove markdown headers
                    .replace(/\*\*/g, '') // Remove bold
                    .replace(/\*/g, '') // Remove italic
                    .replace(/`/g, '') // Remove code markers
                    .substring(0, 60)
                    .trim()

                if (title.endsWith('.') || title.endsWith(',')) {
                    title = title.slice(0, -1)
                }
            }

            // Convert markdown/plain text from AI into safe HTML for storage and display
            const markdownToHtml = (md) => {
                if (!md) return ''

                // Escape HTML
                const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

                // Handle fenced code blocks first
                let out = md
                // Replace CRLF with LF for consistency
                out = out.replace(/\r\n?/g, '\n')

                // Extract fenced code blocks and replace with placeholders
                const codeBlocks = []
                out = out.replace(/```([\s\S]*?)```/g, (match, code) => {
                    const idx = codeBlocks.length
                    codeBlocks.push(escapeHtml(code))
                    return `{{CODE_BLOCK_${idx}}}`
                })

                // Convert headings
                out = out.replace(/^###\s*(.+)$/gim, '<h3>$1</h3>')
                out = out.replace(/^##\s*(.+)$/gim, '<h2>$1</h2>')
                out = out.replace(/^#\s*(.+)$/gim, '<h1>$1</h1>')

                // Convert unordered lists
                out = out.replace(/(^|\n)([\*-]\s.+(?:\n[\*-]\s.+)*)/g, (m, p1, list) => {
                    const items = list.split(/\n/).map(l => '<li>' + l.replace(/^[\*-]\s?/, '') + '</li>').join('')
                    return p1 + `<ul>${items}</ul>`
                })

                // Convert ordered lists
                out = out.replace(/(^|\n)((?:\d+\.\s.+\n?)+)/g, (m, p1, list) => {
                    const items = list.trim().split(/\n/).map(l => '<li>' + l.replace(/^\d+\.\s?/, '') + '</li>').join('')
                    return p1 + `<ol>${items}</ol>`
                })

                // Inline formatting: bold and italic and inline code
                out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                out = out.replace(/\*(.+?)\*/g, '<em>$1</em>')
                out = out.replace(/`([^`]+?)`/g, '<code>$1</code>')

                // Paragraphs: split on double newlines
                const paragraphs = out.split(/\n{2,}/).map(para => {
                    // Skip if already block element
                    if (/^\s*<(h[1-6]|ul|ol|pre|blockquote)/i.test(para)) return para
                    // Replace single newlines with <br>
                    const withBr = para.replace(/\n/g, '<br/>')
                    return `<p>${withBr}</p>`
                })
                out = paragraphs.join('\n')

                // Restore code blocks
                out = out.replace(/\{\{CODE_BLOCK_(\d+)\}\}/g, (m, idx) => ` <pre><code>${codeBlocks[Number(idx)]}</code></pre>`)

                return out
            }

            const htmlContent = markdownToHtml(aiContent)

            const response = await axios.post(`${API_BASE_URL}/api/notes/create`, {
                projectId: parseInt(projectId),
                title: title,
                content: htmlContent,
                userId: currentUser.id,
                userName: currentUser.name || currentUser.email?.split('@')[0] || 'User'
            })

            if (response.data.success || response.data.note) {
                // Update the project notes list
                const newNote = response.data.note || response.data
                setProjectNotes(prev => [...prev, newNote])
                console.log('Note saved successfully:', title)
            }
        } catch (error) {
            console.error('Error saving note:', error)
            throw error
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-130px)] max-h-[calc(100vh-130px)]">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-2 sm:px-0 shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 truncate">AI Assistant</h2>
                    <p className="text-xs sm:text-sm text-slate-600 truncate">Get intelligent help with your project</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-1.5 sm:p-2 flex gap-1 sm:gap-2 mb-3 sm:mb-4 shrink-0">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-md sm:rounded-lg font-medium transition-all text-xs sm:text-base flex-1 sm:flex-initial ${activeTab === 'chat'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                    onClick={() => {
                        setActiveTab('recommendations')
                        if (recommendations.length === 0 && !generatingRecs) {
                            generateRecommendations()
                        }
                    }}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-md sm:rounded-lg font-medium transition-all text-xs sm:text-base flex-1 sm:flex-initial ${activeTab === 'recommendations'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Recommendations</span>
                </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
                <div className="bg-slate-50 rounded-lg sm:rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
                    {/* Hidden AI Component for chat */}
                    {waitingForResponse && chatPrompt && (
                        <AiComponent
                            key={chatGenerateKey}
                            userInput={chatPrompt}
                            onResponse={handleChatAiResponse}
                        />
                    )}

                    {/* Chat Header */}
                    <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">AI Assistant</h3>
                                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Always here to help</p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages - Scrollable Area */}
                    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 min-h-0">
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <AiChatOutput messages={messages} onSaveAsNote={handleSaveAsNote} />
                                <div ref={chatEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Form - Fixed at Bottom */}
                    <div className="bg-white border-t border-slate-200 p-2 sm:p-4 shrink-0">
                        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={waitingForResponse}
                                placeholder={waitingForResponse ? "AI is thinking..." : "Type your message..."}
                                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={waitingForResponse || !message.trim()}
                                className="px-3 sm:px-5 py-2 sm:py-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shrink-0"
                            >
                                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline text-sm">Send</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-6 flex-1 overflow-y-auto min-h-0">
                    {/* Hidden AI Component for fetching */}
                    {shouldGenerateRecs && aiPrompt && (
                        <AiComponent
                            key={generateKey}
                            userInput={aiPrompt}
                            onResponse={handleAiResponse}
                        />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1 sm:mb-2">
                                <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 shrink-0" />
                                <span className="truncate">AI Recommendations</span>
                            </h3>
                            {projectData && (
                                <p className="text-xs sm:text-sm text-slate-600 truncate">
                                    Based on: <span className="font-semibold">{projectData.title}</span>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={generateRecommendations}
                            disabled={generatingRecs || loading}
                            className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-teal-600 text-white rounded-lg sm:rounded-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg whitespace-nowrap"
                        >
                            {generatingRecs ? (
                                <>
                                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                    <span className="hidden sm:inline">Generating...</span>
                                    <span className="sm:hidden">Wait...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">Generate New</span>
                                    <span className="sm:hidden">Generate</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Loading State */}
                    {generatingRecs && recommendations.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                            <Loader className="w-12 h-12 sm:w-16 sm:h-16 text-teal-600 animate-spin mb-3 sm:mb-4" />
                            <p className="text-slate-600 text-base sm:text-lg font-medium">Analyzing your project...</p>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-2">Our AI is generating personalized recommendations</p>
                        </div>
                    )}

                    {/* Project Info Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-12 sm:py-20">
                            <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-spin" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !generatingRecs && recommendations.length === 0 && (
                        <div className="text-center py-12 sm:py-20 px-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">No Recommendations Yet</h4>
                            <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
                                Click "Generate" to get AI-powered recommendations for your project
                            </p>
                        </div>
                    )}

                    {/* Recommendations Grid */}
                    {recommendations.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                            {recommendations.map((rec) => {
                                const Icon = rec.icon
                                return (
                                    <div
                                        key={rec.id}
                                        className="p-3 sm:p-5 border-2 border-slate-100 rounded-lg sm:rounded-xl hover:border-teal-200 hover:shadow-lg transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-2 sm:gap-4">
                                            <div className={`p-2 sm:p-3 rounded-lg ${getColorClasses(rec.color).split(' ')[0]} group-hover:scale-110 transition-transform shrink-0`}>
                                                <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${getColorClasses(rec.color).split(' ')[1]}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-1 sm:mb-2 gap-2">
                                                    <span className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold ${getColorClasses(rec.color)} whitespace-nowrap`}>
                                                        {rec.category}
                                                    </span>
                                                    <span className="text-slate-400 font-bold text-xs sm:text-sm shrink-0">
                                                        #{rec.id}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm sm:text-lg font-bold text-slate-800 mb-1 sm:mb-2 line-clamp-2">
                                                    {rec.title}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 sm:line-clamp-none">
                                                    {rec.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Info Footer */}
                    {recommendations.length > 0 && (
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-blue-900 font-medium">
                                        AI-Generated Insights
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-blue-700 mt-1">
                                        These recommendations are generated based on your project's title and description.
                                        Click "Generate" to get fresh insights anytime.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AIPage
