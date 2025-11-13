import React, { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Bot, Loader2 } from 'lucide-react'
import AiComponent from '../components/AiComponent'
import API_BASE_URL from '../config/api'

const AIPage = () => {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [waitingForResponse, setWaitingForResponse] = useState(false)
    const [chatPrompt, setChatPrompt] = useState('')
    const [chatGenerateKey, setChatGenerateKey] = useState(0)
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

        // Set welcome message
        setMessages([
            {
                id: 'welcome',
                type: 'ai',
                text: 'Hello! I\'m your AI assistant. I can help you with coding questions, project planning, problem-solving, and more. How can I assist you today?',
                timestamp: new Date().toISOString()
            }
        ])
    }, [])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }, [messages])

    const handleAiResponse = (response) => {
        setWaitingForResponse(false)

        // Update messages with AI response
        setMessages(prevMessages => {
            const newMessages = [...prevMessages]
            // Remove the "processing" message
            if (newMessages[newMessages.length - 1]?.text === '...') {
                newMessages.pop()
            }
            // Add the AI response
            newMessages.push({
                id: Date.now(),
                type: 'ai',
                text: response,
                timestamp: new Date().toISOString()
            })
            return newMessages
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!message.trim() || waitingForResponse) return

        const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User'

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: message,
            timestamp: new Date().toISOString(),
            userName
        }

        const processingMessage = {
            id: Date.now() + 1,
            type: 'ai',
            text: '...',
            timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMessage, processingMessage])

        // Set up the AI prompt
        const prompt = `User question: ${message}\n\nPlease provide a helpful, clear, and concise response. If it's a coding question, provide code examples. If it's about planning or design, provide structured advice.`

        setChatPrompt(prompt)
        setChatGenerateKey(prev => prev + 1)
        setWaitingForResponse(true)
        setMessage('')
    }

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Hidden AI Component for generating responses */}
            {waitingForResponse && chatPrompt && (
                <div className="hidden">
                    <AiComponent
                        key={chatGenerateKey}
                        userInput={chatPrompt}
                        onResponse={handleAiResponse}
                    />
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">AI Assistant</h1>
                    <p className="text-sm sm:text-base text-slate-600">Get intelligent help with coding, planning, and problem-solving</p>
                </div>
            </div>

            {/* Chat Container - Fixed Height */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] sm:h-[calc(100vh-250px)]">
                {/* Messages Area */}
                <div className="flex-1 bg-slate-50 p-3 sm:p-6 overflow-y-auto">
                    <div className="space-y-4 sm:space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                                {msg.type === 'ai' && (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-teal-600 to-cyan-600 rounded-full flex items-center justify-center shrink-0">
                                        {msg.text === '...' ? (
                                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                                        ) : (
                                            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        )}
                                    </div>
                                )}

                                <div className={`max-w-[85%] sm:max-w-[75%] ${msg.type === 'user' ? 'text-right' : ''}`}>
                                    {msg.type === 'user' && msg.userName && (
                                        <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">{msg.userName}</p>
                                    )}

                                    <div className={`rounded-lg p-3 sm:p-4 ${msg.type === 'user'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white shadow-sm'
                                        }`}>
                                        {msg.text === '...' ? (
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        ) : (
                                            <p className={`text-sm sm:text-base whitespace-pre-wrap ${msg.type === 'user' ? 'text-white' : 'text-slate-700'
                                                }`}>
                                                {msg.text}
                                            </p>
                                        )}
                                    </div>

                                    <p className="text-xs text-slate-500 mt-1">{formatTime(msg.timestamp)}</p>
                                </div>

                                {msg.type === 'user' && (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-emerald-600 to-green-600 rounded-full flex items-center justify-center shrink-0">
                                        <span className="text-xs sm:text-sm font-bold text-white">
                                            {msg.userName?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Scroll anchor */}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-slate-200 flex gap-2 sm:gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={waitingForResponse}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || waitingForResponse}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
                    >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AIPage
