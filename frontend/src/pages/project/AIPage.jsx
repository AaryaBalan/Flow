import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Send, Sparkles, Bot, Lightbulb, MessageSquare, Zap, Shield, CheckCircle, TrendingUp, Users, Code, Loader } from 'lucide-react'
import AiComponent from '../../components/AiComponent'

const AIPage = () => {
    const { projectId } = useParams()
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([
        { id: 1, type: 'ai', text: 'Hello! I\'m your AI assistant for this project. How can I help you today?' }
    ])
    const [activeTab, setActiveTab] = useState('chat')
    const [projectData, setProjectData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [shouldGenerateRecs, setShouldGenerateRecs] = useState(false)
    const [recommendations, setRecommendations] = useState([])
    const [generatingRecs, setGeneratingRecs] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')
    const [generateKey, setGenerateKey] = useState(0)

    useEffect(() => {
        fetchProjectData()
    }, [projectId])

    const fetchProjectData = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`http://localhost:3000/api/projects/${projectId}`)
            setProjectData(response.data.project || response.data)
        } catch (error) {
            console.error('Error fetching project data:', error)
        } finally {
            setLoading(false)
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
            'Architecture': 'purple',
            'Security': 'red',
            'Performance': 'yellow',
            'Testing': 'green',
            'Documentation': 'yellow',
            'User Experience': 'blue',
            'DevOps': 'indigo',
            'Features': 'purple'
        }
        return colorMap[category] || 'blue'
    }

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

    const getColorClasses = (color) => {
        const colors = {
            purple: 'bg-purple-100 text-purple-700 border-purple-200',
            red: 'bg-red-100 text-red-700 border-red-200',
            yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            green: 'bg-green-100 text-green-700 border-green-200',
            blue: 'bg-blue-100 text-blue-700 border-blue-200',
            indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200'
        }
        return colors[color] || colors.blue
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

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm p-2 flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'chat'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Chat Assistant
                </button>
                <button
                    onClick={() => {
                        setActiveTab('recommendations')
                        if (recommendations.length === 0 && !generatingRecs) {
                            generateRecommendations()
                        }
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'recommendations'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <Lightbulb className="w-4 h-4" />
                    Recommendations
                </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
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
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    {/* Hidden AI Component for fetching */}
                    {shouldGenerateRecs && aiPrompt && (
                        <AiComponent
                            key={generateKey}
                            userInput={aiPrompt}
                            onResponse={handleAiResponse}
                        />
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                                <Lightbulb className="w-6 h-6 text-yellow-500" />
                                AI-Powered Recommendations
                            </h3>
                            {projectData && (
                                <p className="text-slate-600">
                                    Based on: <span className="font-semibold">{projectData.title}</span>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={generateRecommendations}
                            disabled={generatingRecs || loading}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {generatingRecs ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate New
                                </>
                            )}
                        </button>
                    </div>

                    {/* Loading State */}
                    {generatingRecs && recommendations.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="w-16 h-16 text-purple-600 animate-spin mb-4" />
                            <p className="text-slate-600 text-lg">Analyzing your project...</p>
                            <p className="text-slate-500 text-sm mt-2">Our AI is generating personalized recommendations</p>
                        </div>
                    )}

                    {/* Project Info Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !generatingRecs && recommendations.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lightbulb className="w-10 h-10 text-purple-600" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">No Recommendations Yet</h4>
                            <p className="text-slate-600 mb-6">
                                Click "Generate New" to get AI-powered recommendations for your project
                            </p>
                        </div>
                    )}

                    {/* Recommendations Grid */}
                    {recommendations.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {recommendations.map((rec) => {
                                const Icon = rec.icon
                                return (
                                    <div
                                        key={rec.id}
                                        className="p-5 border-2 border-slate-100 rounded-xl hover:border-purple-200 hover:shadow-lg transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg ${getColorClasses(rec.color).split(' ')[0]} group-hover:scale-110 transition-transform`}>
                                                <Icon className={`w-6 h-6 ${getColorClasses(rec.color).split(' ')[1]}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getColorClasses(rec.color)}`}>
                                                        {rec.category}
                                                    </span>
                                                    <span className="text-slate-400 font-bold text-sm">
                                                        #{rec.id}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-800 mb-2">
                                                    {rec.title}
                                                </h4>
                                                <p className="text-sm text-slate-600 leading-relaxed">
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
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-900 font-medium">
                                        AI-Generated Insights
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        These recommendations are generated based on your project's title and description.
                                        Click "Generate New" to get fresh insights anytime.
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
