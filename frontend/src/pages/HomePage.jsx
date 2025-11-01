import React from 'react'

const HomePage = () => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                    Welcome to Dev Collab
                </h1>
                <p className="text-slate-600 text-lg">
                    Start collaborating on your projects with your team.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Your Projects</h3>
                    <p className="text-slate-600 text-sm">View and manage all your active projects</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-2xl">✨</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">AI Assistant</h3>
                    <p className="text-slate-600 text-sm">Get intelligent suggestions for your work</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-2xl">👥</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Team Members</h3>
                    <p className="text-slate-600 text-sm">Collaborate with your team in real-time</p>
                </div>
            </div>
        </div>
    )
}

export default HomePage
