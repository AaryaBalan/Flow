import React from 'react'
import { Bot, User, Copy, Check, BookmarkPlus, MoreVertical } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const AiChatOutput = ({ messages, onSaveAsNote }) => {
    const [copiedId, setCopiedId] = useState(null)
    const [savingId, setSavingId] = useState(null)
    const [dropdownOpen, setDropdownOpen] = useState(null)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const copyToClipboard = (text, id) => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        setCopiedId(id)
                        setTimeout(() => setCopiedId(null), 2000)
                    })
                    .catch(() => {
                        fallbackCopy(text, id)
                    })
            } else {
                fallbackCopy(text, id)
            }
        } catch (error) {
            fallbackCopy(text, id)
        }
    }

    const fallbackCopy = (text, id) => {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            const successful = document.execCommand('copy')
            textArea.remove()

            if (successful) {
                setCopiedId(id)
                setTimeout(() => setCopiedId(null), 2000)
            }
        } catch (err) {
            textArea.remove()
            console.error('Failed to copy:', err)
        }
    }

    const handleSaveAsNote = async (messageText, id) => {
        if (!onSaveAsNote) return

        setSavingId(id)
        try {
            await onSaveAsNote(messageText)
            // Show success feedback for 2 seconds
            setTimeout(() => setSavingId(null), 2000)
        } catch (error) {
            console.error('Error saving note:', error)
            setSavingId(null)
        }
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
                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors shadow-sm border border-slate-700 flex items-center justify-center"
                                        title="Copy code"
                                        aria-label="Copy code block"
                                    >
                                        {copiedId === `code-${index}` ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-slate-200" />
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
                        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                    )}

                    <div className={`max-w-full md:max-w-[75%] ${msg.type === 'user' ? 'flex flex-col items-end' : ''}`}>
                        {/* User name for user messages */}
                        {msg.type === 'user' && msg.userName && (
                            <div className="text-xs text-slate-600 mb-1 px-2 font-medium">
                                {msg.userName}
                            </div>
                        )}

                        <div
                            className={`rounded-md px-4 py-2.5 relative ${msg.type === 'ai'
                                ? 'bg-white border border-slate-200'
                                : 'bg-emerald-600 text-white'
                                }`}
                        >
                            {/* Three-dot menu button positioned at top-right of the message box */}
                            {msg.type === 'ai' && msg.text !== '...' && (
                                <div className="absolute top-1 right-1 z-10">
                                    <button
                                        onClick={() => setDropdownOpen(dropdownOpen === msg.id ? null : msg.id)}
                                        className="p-1.5 bg-slate-50 hover:bg-white rounded-full shadow-sm border border-slate-200 transition-colors flex items-center justify-center"
                                        aria-label="Message options"
                                    >
                                        <MoreVertical className="w-4 h-4 text-slate-600" />
                                    </button>

                                    {/* Dropdown menu */}
                                    {dropdownOpen === msg.id && (
                                        <div
                                            ref={dropdownRef}
                                            className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
                                        >
                                            <button
                                                onClick={() => {
                                                    handleSaveAsNote(msg.text, msg.id)
                                                    setDropdownOpen(null)
                                                }}
                                                disabled={savingId === msg.id}
                                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 disabled:opacity-50"
                                            >
                                                {savingId === msg.id ? (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <BookmarkPlus className="w-4 h-4 text-slate-600" />
                                                )}
                                                <span>{savingId === msg.id ? 'Saved!' : 'Save as note'}</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    copyToClipboard(msg.text, msg.id)
                                                    setDropdownOpen(null)
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                            >
                                                {copiedId === msg.id ? (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-slate-600" />
                                                )}
                                                <span>{copiedId === msg.id ? 'Copied!' : 'Copy message'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {msg.type === 'ai' ? (
                                <div className="relative">
                                    {msg.text === '...' ? (
                                        <div className="flex items-center gap-1 py-1">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    ) : (
                                        <p className='text-xs md:text-sm'>{formatMessage(msg.text)}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-white leading-relaxed text-xs md:text-sm">{msg.text}</p>
                            )}

                            {/* Timestamp */}
                            {msg.text !== '...' && (
                                <div className={`text-[10px] mt-1.5 ${msg.type === 'ai' ? 'text-slate-400' : 'text-emerald-100'}`}>
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'Just now'}
                                </div>
                            )}
                        </div>
                    </div>

                    {msg.type === 'user' && (
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default AiChatOutput
