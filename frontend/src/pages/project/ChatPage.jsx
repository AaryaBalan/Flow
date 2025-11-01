import React, { useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'

const ChatPage = () => {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([
        { id: 1, user: 'John Doe', text: 'Hey team, how\'s the progress?', time: '10:30 AM', avatar: 'J' },
        { id: 2, user: 'Jane Smith', text: 'Going well! Almost done with the UI', time: '10:32 AM', avatar: 'J' },
        { id: 3, user: 'You', text: 'Great work everyone!', time: '10:35 AM', avatar: 'Y', isCurrentUser: true },
    ])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (message.trim()) {
            setMessages([...messages, {
                id: messages.length + 1,
                user: 'You',
                text: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avatar: 'Y',
                isCurrentUser: true
            }])
            setMessage('')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-linear-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Team Chat</h2>
                    <p className="text-slate-600">Communicate with your team members</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Chat Messages */}
                <div className="bg-slate-50 p-6 min-h-[500px] max-h-[500px] overflow-y-auto space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.isCurrentUser ? 'justify-end' : ''}`}>
                            {!msg.isCurrentUser && (
                                <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-white">{msg.avatar}</span>
                                </div>
                            )}
                            <div className={`max-w-[70%] ${msg.isCurrentUser ? 'text-right' : ''}`}>
                                {!msg.isCurrentUser && (
                                    <p className="text-sm font-semibold text-slate-700 mb-1">{msg.user}</p>
                                )}
                                <div className={`rounded-lg p-4 ${msg.isCurrentUser
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white shadow-sm'
                                    }`}>
                                    <p className={msg.isCurrentUser ? 'text-white' : 'text-slate-700'}>
                                        {msg.text}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{msg.time}</p>
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
                        placeholder="Type your message..."
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

export default ChatPage
