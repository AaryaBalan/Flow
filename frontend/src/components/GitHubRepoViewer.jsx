import React, { useState, useEffect } from 'react'
import {
    Code, GitBranch, Star, GitFork, Eye, AlertCircle, RefreshCw,
    ChevronRight, ChevronDown, File, Folder, ExternalLink, Calendar,
    Tag, Scale, Users, Activity
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import API_BASE_URL from '../config/api'

const GitHubRepoViewer = ({ githubRepoUrl }) => {
    const [repoDetails, setRepoDetails] = useState(null)
    const [repoTree, setRepoTree] = useState(null)
    const [languages, setLanguages] = useState([])
    const [selectedFile, setSelectedFile] = useState(null)
    const [fileContent, setFileContent] = useState(null)
    const [expandedFolders, setExpandedFolders] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const [loadingFile, setLoadingFile] = useState(false)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('files') // 'files', 'readme', 'about'

    useEffect(() => {
        if (githubRepoUrl) {
            fetchRepositoryData()
        }
    }, [githubRepoUrl])

    const parseGithubUrl = (url) => {
        try {
            const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
            if (match) {
                return {
                    owner: match[1],
                    repo: match[2].replace(/\.git$/, '')
                }
            }
        } catch (error) {
            console.error('Error parsing GitHub URL:', error)
        }
        return null
    }

    const fetchRepositoryData = async () => {
        const parsed = parseGithubUrl(githubRepoUrl)
        if (!parsed) {
            setError('Invalid GitHub repository URL')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            // Fetch repo details
            const detailsRes = await axios.get(
                `${API_BASE_URL}/api/github/repo/${parsed.owner}/${parsed.repo}`
            )
            setRepoDetails(detailsRes.data.data)

            // Fetch tree structure
            const treeRes = await axios.get(
                `${API_BASE_URL}/api/github/repo/${parsed.owner}/${parsed.repo}/tree`
            )
            setRepoTree(treeRes.data.data)

            // Fetch languages
            const langRes = await axios.get(
                `${API_BASE_URL}/api/github/repo/${parsed.owner}/${parsed.repo}/languages`
            )
            setLanguages(langRes.data.data)

        } catch (error) {
            console.error('Error fetching repository data:', error)
            setError(error.response?.data?.message || 'Failed to load repository data')
            toast.error('Failed to load GitHub repository')
        } finally {
            setLoading(false)
        }
    }

    const fetchFileContent = async (filePath) => {
        const parsed = parseGithubUrl(githubRepoUrl)
        if (!parsed) return

        try {
            setLoadingFile(true)
            const res = await axios.get(
                `${API_BASE_URL}/api/github/repo/${parsed.owner}/${parsed.repo}/file`,
                { params: { path: filePath } }
            )
            setFileContent(res.data.data)
        } catch (error) {
            console.error('Error fetching file content:', error)
            toast.error('Failed to load file content')
        } finally {
            setLoadingFile(false)
        }
    }

    const toggleFolder = (path) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(path)) {
            newExpanded.delete(path)
        } else {
            newExpanded.add(path)
        }
        setExpandedFolders(newExpanded)
    }

    const handleFileClick = (file) => {
        if (file.type === 'tree') {
            toggleFolder(file.path)
        } else {
            setSelectedFile(file)
            setFileContent(null)
            fetchFileContent(file.path)
        }
    }

    const getFileLanguage = (filename) => {
        const ext = filename.split('.').pop().toLowerCase()
        const languageMap = {
            js: 'javascript',
            jsx: 'jsx',
            ts: 'typescript',
            tsx: 'tsx',
            py: 'python',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            cs: 'csharp',
            php: 'php',
            rb: 'ruby',
            go: 'go',
            rs: 'rust',
            swift: 'swift',
            kt: 'kotlin',
            html: 'html',
            css: 'css',
            scss: 'scss',
            json: 'json',
            xml: 'xml',
            yaml: 'yaml',
            yml: 'yaml',
            md: 'markdown',
            sql: 'sql',
            sh: 'bash',
            bash: 'bash'
        }
        return languageMap[ext] || 'text'
    }

    const renderTreeNode = (node, depth = 0) => {
        const isExpanded = expandedFolders.has(node.path)
        const isSelected = selectedFile?.path === node.path

        return (
            <div key={node.path}>
                <div
                    onClick={() => handleFileClick(node)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
                        }`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    {node.type === 'tree' && (
                        <span className="shrink-0">
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </span>
                    )}
                    {node.type === 'tree' ? (
                        <Folder className={`w-4 h-4 shrink-0 ${isExpanded ? 'text-blue-600' : 'text-slate-500'}`} />
                    ) : (
                        <File className="w-4 h-4 shrink-0 text-slate-400" />
                    )}
                    <span className="text-sm truncate">{node.name}</span>
                </div>
                {node.type === 'tree' && isExpanded && node.children && (
                    <div>
                        {node.children.map(child => renderTreeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
        return `${Math.floor(diffDays / 365)} years ago`
    }

    if (!githubRepoUrl) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <Code className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No GitHub repository linked</p>
                <p className="text-sm text-slate-400 mt-1">
                    Add a GitHub repository URL to your project settings
                </p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading repository data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 text-red-600 mb-3">
                    <AlertCircle className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">Failed to Load Repository</h3>
                </div>
                <p className="text-slate-600 mb-4">{error}</p>
                <button
                    onClick={fetchRepositoryData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Repository Header */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4 mb-4">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <img
                            src={repoDetails.owner.avatarUrl}
                            alt={repoDetails.owner.login}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                <h2 className="text-base sm:text-xl font-bold text-slate-800 truncate">
                                    {repoDetails.owner.login} / {repoDetails.name}
                                </h2>
                                <a
                                    href={repoDetails.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 shrink-0"
                                >
                                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                                </a>
                            </div>
                            {repoDetails.description && (
                                <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">{repoDetails.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 shrink-0" />
                        <span className="font-semibold">{repoDetails.stars}</span>
                        <span className="text-slate-600 hidden xs:inline">stars</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <GitFork className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="font-semibold">{repoDetails.forks}</span>
                        <span className="text-slate-600 hidden xs:inline">forks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="font-semibold">{repoDetails.watchers}</span>
                        <span className="text-slate-600 hidden xs:inline">watching</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="text-slate-600 text-xs sm:text-sm truncate">Updated {formatDate(repoDetails.updatedAt)}</span>
                    </div>
                </div>

                {/* Languages */}
                {languages.length > 0 && (
                    <div className="mt-4">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex mb-2">
                            {languages.map((lang, index) => (
                                <div
                                    key={lang.name}
                                    className={`h-full ${index === 0 ? 'bg-blue-600' :
                                        index === 1 ? 'bg-green-600' :
                                            index === 2 ? 'bg-purple-600' : 'bg-slate-400'
                                        }`}
                                    style={{ width: `${lang.percentage}%` }}
                                ></div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {languages.slice(0, 3).map((lang, index) => (
                                <div key={lang.name} className="flex items-center gap-1.5 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-600' :
                                        index === 1 ? 'bg-green-600' :
                                            'bg-purple-600'
                                        }`}></div>
                                    <span className="font-medium">{lang.name}</span>
                                    <span className="text-slate-500">{lang.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Topics */}
                {repoDetails.topics && repoDetails.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {repoDetails.topics.map(topic => (
                            <span
                                key={topic}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${activeTab === 'files'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            <span className="hidden sm:inline">Files</span>
                            <span className="sm:hidden">Files</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${activeTab === 'about'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            About
                        </div>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-3 sm:p-6">
                    {activeTab === 'files' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
                            {/* File Tree */}
                            <div className="lg:col-span-1">
                                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-3">
                                    Repository Structure
                                </h3>
                                <div className="border border-slate-200 rounded-lg max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                                    {repoTree?.tree && repoTree.tree.length > 0 ? (
                                        <div className="p-2">
                                            {repoTree.tree.map(node => renderTreeNode(node))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-slate-500 text-sm">
                                            No files found
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* File Content */}
                            <div className="lg:col-span-2">
                                {selectedFile ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-3 gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <File className="w-4 h-4 text-slate-500 shrink-0" />
                                                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                                                    {selectedFile.name}
                                                </h3>
                                            </div>
                                            {fileContent && (
                                                <span className="text-xs text-slate-500 shrink-0">
                                                    {formatBytes(fileContent.size)}
                                                </span>
                                            )}
                                        </div>
                                        {loadingFile ? (
                                            <div className="border border-slate-200 rounded-lg p-8 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                                <p className="text-slate-600 text-sm">Loading file...</p>
                                            </div>
                                        ) : fileContent ? (
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <SyntaxHighlighter
                                                    language={getFileLanguage(selectedFile.name)}
                                                    style={vscDarkPlus}
                                                    showLineNumbers
                                                    customStyle={{
                                                        margin: 0,
                                                        maxHeight: '400px',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {fileContent.content}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 rounded-lg p-8 text-center">
                                        <Code className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">Select a file to view its contents</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                                <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <GitBranch className="w-4 h-4 shrink-0" />
                                        <span className="text-xs sm:text-sm font-medium">Default Branch</span>
                                    </div>
                                    <p className="text-slate-800 font-semibold text-sm sm:text-base truncate">{repoDetails.defaultBranch}</p>
                                </div>

                                <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <Scale className="w-4 h-4 shrink-0" />
                                        <span className="text-xs sm:text-sm font-medium">License</span>
                                    </div>
                                    <p className="text-slate-800 font-semibold text-sm sm:text-base truncate">
                                        {repoDetails.license || 'No license'}
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <Calendar className="w-4 h-4 shrink-0" />
                                        <span className="text-xs sm:text-sm font-medium">Created</span>
                                    </div>
                                    <p className="text-slate-800 font-semibold text-sm sm:text-base">
                                        {new Date(repoDetails.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <Activity className="w-4 h-4 shrink-0" />
                                        <span className="text-xs sm:text-sm font-medium">Last Push</span>
                                    </div>
                                    <p className="text-slate-800 font-semibold text-sm sm:text-base">
                                        {formatDate(repoDetails.pushedAt)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-800 text-sm sm:text-base mb-3">Repository Statistics</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                    <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{repoDetails.stars}</div>
                                        <div className="text-xs text-slate-600 mt-1">Stars</div>
                                    </div>
                                    <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                                        <div className="text-lg sm:text-2xl font-bold text-green-600">{repoDetails.forks}</div>
                                        <div className="text-xs text-slate-600 mt-1">Forks</div>
                                    </div>
                                    <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                                        <div className="text-lg sm:text-2xl font-bold text-purple-600">{repoDetails.watchers}</div>
                                        <div className="text-xs text-slate-600 mt-1">Watchers</div>
                                    </div>
                                    <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
                                        <div className="text-lg sm:text-2xl font-bold text-orange-600">{repoDetails.openIssues}</div>
                                        <div className="text-xs text-slate-600 mt-1">Issues</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center pt-2 sm:pt-4">
                                <a
                                    href={repoDetails.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm sm:text-base"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View on GitHub
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GitHubRepoViewer
