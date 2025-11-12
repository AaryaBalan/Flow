import React from 'react'
import { Bot, User, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const AiChatOutput = ({ messages }) => {
    const [copiedId, setCopiedId] = useState(null)

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const formatMessage = (text) => {
        // Split by code blocks
        const parts = text.split(/(```[\s\S]*?```)/g)

        return parts.map((part, index) => {
            // Code block
            if (part.startsWith('```')) {
                const codeMatch = part.match(/```(\w+)?\n?([\s\S]*?)```/)
                if (codeMatch) {
                    const [, language, code] = codeMatch
                    return (
                        <div key={index} className="my-3 rounded-lg overflow-hidden bg-slate-900">
                            {language && (
                                <div className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-mono flex items-center justify-between">
                                    <span>{language}</span>
                                    <button
                                        onClick={() => copyToClipboard(code, `code-${index}`)}
                                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                                    >
                                        {copiedId === `code-${index}` ? (
                                            <Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </button>
                                </div>
                            )}
                            <pre className="p-4 overflow-x-auto">
                                <code className="text-sm text-slate-100 font-mono">
                                    {code}
                                </code>
                            </pre>
                        </div>
                    )
                }
            }

            // Regular text with formatting
            return (
                <div key={index} className="prose prose-sm max-w-none">
                    {part.split('\n').map((line, lineIndex) => {
                        // Bold text
                        if (line.match(/\*\*(.*?)\*\*/)) {
                            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }

                        // Italic text
                        if (line.match(/\*(.*?)\*/)) {
                            line = line.replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }

                        // Inline code
                        if (line.match(/`(.*?)`/)) {
                            line = line.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-sm font-mono">$1</code>')
                        }

                        // Numbered lists
                        if (line.match(/^\d+\.\s/)) {
                            return (
                                <li key={lineIndex} className="ml-4" dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '') }} />
                            )
                        }

                        // Bullet points
                        if (line.match(/^[-•]\s/)) {
                            return (
                                <li key={lineIndex} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: line.replace(/^[-•]\s/, '') }} />
                            )
                        }

                        // Headers
                        if (line.startsWith('### ')) {
                            return (
                                <h3 key={lineIndex} className="text-lg font-bold text-slate-800 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: line.replace('### ', '') }} />
                            )
                        }
                        if (line.startsWith('## ')) {
                            return (
                                <h2 key={lineIndex} className="text-xl font-bold text-slate-800 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: line.replace('## ', '') }} />
                            )
                        }
                        if (line.startsWith('# ')) {
                            return (
                                <h1 key={lineIndex} className="text-2xl font-bold text-slate-800 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: line.replace('# ', '') }} />
                            )
                        }

                        // Empty line
                        if (line.trim() === '') {
                            return <br key={lineIndex} />
                        }

                        // Regular paragraph
                        return (
                            <p key={lineIndex} className="text-slate-700 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: line }} />
                        )
                    })}
                </div>
            )
        })
    }

    return (
        <div className="space-y-3">
            {messages.map((msg, index) => (
                <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.type === 'user' ? 'justify-end' : ''} ${index === 0 ? '' : 'animate-fadeIn'} group`}
                >
                    {msg.type === 'ai' && (
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                    )}

                    <div className={`max-w-[75%] ${msg.type === 'user' ? 'flex flex-col items-end' : ''}`}>
                        {/* User name for user messages */}
                        {msg.type === 'user' && msg.userName && (
                            <div className="text-xs text-slate-600 mb-1 px-2 font-medium">
                                {msg.userName}
                            </div>
                        )}

                        <div
                            className={`rounded-2xl px-4 py-2.5 ${msg.type === 'ai'
                                ? 'bg-white border border-slate-200'
                                : 'bg-purple-600 text-white'
                                }`}
                        >
                            {msg.type === 'ai' ? (
                                <div className="relative">
                                    {msg.text === '...' ? (
                                        <div className="flex items-center gap-1 py-1">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    ) : (
                                        <>
                                            {formatMessage(msg.text)}
                                            <button
                                                onClick={() => copyToClipboard(msg.text, msg.id)}
                                                className="absolute -top-1 -right-1 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Copy message"
                                            >
                                                {copiedId === msg.id ? (
                                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-white leading-relaxed">{msg.text}</p>
                            )}

                            {/* Timestamp */}
                            {msg.text !== '...' && (
                                <div className={`text-[10px] mt-1.5 ${msg.type === 'ai' ? 'text-slate-400' : 'text-purple-100'}`}>
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'Just now'}
                                </div>
                            )}
                        </div>
                    </div>

                    {msg.type === 'user' && (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default AiChatOutput
