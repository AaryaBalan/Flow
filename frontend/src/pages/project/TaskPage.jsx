import React, { useState } from 'react'
import { Plus, CheckCircle, Circle, X, User } from 'lucide-react'

const TaskPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({ title: '', createdBy: '' })
    const [tasks, setTasks] = useState([
        {
            id: 1,
            title: 'Setup project structure',
            completed: true,
            createdBy: 'John Doe',
            completedBy: 'John Doe',
            createdAt: '2025-10-20',
            completedAt: '2025-10-21'
        },
        {
            id: 2,
            title: 'Design UI components',
            completed: true,
            createdBy: 'Jane Smith',
            completedBy: 'Mike Johnson',
            createdAt: '2025-10-22',
            completedAt: '2025-10-25'
        },
        {
            id: 3,
            title: 'Implement authentication',
            completed: false,
            createdBy: 'Sarah Williams',
            createdAt: '2025-10-28'
        },
        {
            id: 4,
            title: 'Add database integration',
            completed: false,
            createdBy: 'Tom Brown',
            createdAt: '2025-10-29'
        },
    ])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const newTask = {
            id: tasks.length + 1,
            title: formData.title,
            completed: false,
            createdBy: formData.createdBy,
            createdAt: new Date().toISOString().split('T')[0]
        }
        setTasks([newTask, ...tasks])
        setIsModalOpen(false)
        setFormData({ title: '', createdBy: '' })
    }

    const toggleTask = (taskId) => {
        setTasks(tasks.map(task => {
            if (task.id === taskId) {
                if (!task.completed) {
                    return {
                        ...task,
                        completed: true,
                        completedBy: 'Current User',
                        completedAt: new Date().toISOString().split('T')[0]
                    }
                } else {
                    return {
                        ...task,
                        completed: false,
                        completedBy: undefined,
                        completedAt: undefined
                    }
                }
            }
            return task
        }))
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Tasks</h2>
                    <p className="text-slate-600 mt-1">Manage your project tasks</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Task
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pending Tasks */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Pending Tasks</h3>
                    <div className="space-y-3">
                        {tasks.filter(task => !task.completed).map(task => (
                            <div
                                key={task.id}
                                className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all"
                            >
                                <div
                                    className="flex items-start gap-3 cursor-pointer"
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <Circle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-slate-700 font-medium mb-2">{task.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <User className="w-3 h-3" />
                                            <span>Created by <span className="font-medium">{task.createdBy}</span></span>
                                            <span>•</span>
                                            <span>{formatDate(task.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Completed Tasks */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Completed Tasks</h3>
                    <div className="space-y-3">
                        {tasks.filter(task => task.completed).map(task => (
                            <div
                                key={task.id}
                                className="p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-slate-50 transition-all"
                            >
                                <div
                                    className="flex items-start gap-3 cursor-pointer"
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-slate-500 line-through font-medium mb-2">{task.title}</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <User className="w-3 h-3" />
                                                <span>Created by <span className="font-medium">{task.createdBy}</span></span>
                                                <span>•</span>
                                                <span>{formatDate(task.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-green-600">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>Completed by <span className="font-medium">{task.completedBy}</span></span>
                                                <span>•</span>
                                                <span>{formatDate(task.completedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Add New Task</h2>
                                <p className="text-sm text-slate-600 mt-1">Create a new task for the project</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6 text-slate-600" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Task Title Field */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter task title"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Created By Field */}
                            <div>
                                <label htmlFor="createdBy" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Created By *
                                </label>
                                <input
                                    type="text"
                                    id="createdBy"
                                    name="createdBy"
                                    value={formData.createdBy}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                >
                                    Create Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TaskPage
