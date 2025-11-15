import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import GitHubRepoViewer from '../../components/GitHubRepoViewer'
import { Code, ExternalLink, Settings } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import API_BASE_URL from '../../config/api'

const GitHubPage = () => {
    const { projectId } = useParams()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    const [githubRepoUrl, setGithubRepoUrl] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchProject()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId])

    const fetchProject = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`)
            if (response.data.success) {
                setProject(response.data.project)
                setGithubRepoUrl(response.data.project.githubRepoUrl || '')
            }
        } catch (error) {
            console.error('Error fetching project:', error)
            toast.error('Failed to load project')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveGithubUrl = async () => {
        if (!githubRepoUrl.trim()) {
            toast.error('Please enter a GitHub repository URL')
            return
        }

        // Validate GitHub URL
        if (!githubRepoUrl.match(/github\.com\/[^/]+\/[^/]+/)) {
            toast.error('Please enter a valid GitHub repository URL')
            return
        }

        try {
            setSaving(true)

            // Extract owner and repo from URL - more flexible regex
            const match = githubRepoUrl.match(/github\.com\/([^/]+)\/([^/\s]+)/)
            const owner = match[1]
            const repo = match[2].replace(/\.git$/, '')

            // Get userId from localStorage - user is stored as JSON object
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                toast.error('User information not found. Please log in again.')
                return
            }

            let userId
            try {
                const userData = JSON.parse(userStr)
                userId = userData.id
            } catch (e) {
                toast.error('Invalid user data. Please log in again.')
                return
            }

            const response = await axios.put(
                `${API_BASE_URL}/api/projects/${projectId}`,
                {
                    githubRepoUrl: githubRepoUrl.trim(),
                    githubOwner: owner,
                    githubRepo: repo,
                    userId: userId
                }
            )

            if (response.data.success) {
                toast.success('GitHub repository linked successfully!')
                setShowSettings(false)
                fetchProject()
            }
        } catch (error) {
            console.error('Error saving GitHub URL:', error)
            toast.error(error.response?.data?.message || 'Failed to save GitHub repository')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Code className="w-7 h-7 sm:w-8 sm:h-8" />
                        GitHub Repository
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">
                        View repository code and structure
                    </p>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">
                        GitHub Repository Settings
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                                Repository URL
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={githubRepoUrl}
                                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                                    placeholder="https://github.com/username/repository"
                                    className="flex-1 px-3 sm:px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSaveGithubUrl}
                                    disabled={saving}
                                    className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Enter the full GitHub repository URL (e.g., https://github.com/facebook/react)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Repository Viewer */}
            <GitHubRepoViewer githubRepoUrl={project?.githubRepoUrl} />
        </div>
    )
}

export default GitHubPage
