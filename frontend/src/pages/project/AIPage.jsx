import React, { useState } from 'react'
import { Send, Sparkles, Bot } from 'lucide-react'

const AIPage = () => {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([
        { id: 1, type: 'ai', text: 'Hello! I\'m your AI assistant for this project. How can I help you today?' }
    ])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (message.trim()) {
            setMessages([...messages,
            { id: messages.length + 1, type: 'user', text: message },
            { id: messages.length + 2, type: 'ai', text: 'I\'m processing your request...' }
            ])
            setMessage('')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-linear-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">AI Assistant</h2>
                    <p className="text-slate-600">Get intelligent help with your project</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Chat Messages */}
                <div className="bg-slate-50 p-6 min-h-[500px] max-h-[500px] overflow-y-auto space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                            {msg.type === 'ai' && (
                                <div className="w-8 h-8 bg-linear-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[70%] rounded-lg p-4 ${msg.type === 'ai'
                                    ? 'bg-white shadow-sm'
                                    : 'bg-blue-600 text-white'
                                }`}>
                                <p className={msg.type === 'ai' ? 'text-slate-700' : 'text-white'}>
                                    {msg.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 flex gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask me anything about your project..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Send className="w-5 h-5" />
                        Send
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AIPage
