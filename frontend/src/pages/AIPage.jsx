import React, { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'

const AIPage = () => {
    const [message, setMessage] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        // Handle AI message submission
        console.log('Message:', message)
        setMessage('')
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-linear-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">AI Assistant</h1>
                        <p className="text-slate-600">Get intelligent help with your projects</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-linear-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-slate-700">
                                    Hello! I'm your AI assistant. How can I help you with your projects today?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask me anything..."
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
