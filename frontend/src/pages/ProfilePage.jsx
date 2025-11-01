import React from 'react'
import { Mail, Calendar, MapPin, Edit } from 'lucide-react'

const ProfilePage = () => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Cover Image */}
                <div className="h-32 bg-linear-to-r from-blue-600 to-indigo-600"></div>

                {/* Profile Info */}
                <div className="px-8 pb-8">
                    <div className="flex items-end justify-between -mt-16 mb-6">
                        <div className="flex items-end gap-4">
                            <div className="w-32 h-32 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-blue-600">
                                DC
                            </div>
                            <div className="mb-2">
                                <h1 className="text-2xl font-bold text-slate-800">Dev Collab User</h1>
                                <p className="text-slate-600">Full Stack Developer</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors mb-2">
                            <Edit className="w-4 h-4" />
                            Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Mail className="w-5 h-5" />
                            <span>user@devcollab.com</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Calendar className="w-5 h-5" />
                            <span>Joined Nov 2025</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <MapPin className="w-5 h-5" />
                            <span>San Francisco, CA</span>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 mb-3">About</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Passionate developer focused on building modern web applications with React, Node.js, and cutting-edge technologies.
                            Love collaborating with teams to create amazing products.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
                    <div className="text-slate-600">Projects</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">8</div>
                    <div className="text-slate-600">Completed</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">24</div>
                    <div className="text-slate-600">Collaborators</div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
